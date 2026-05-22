import { NDI_API_BASE, NDI_AUTH_BASE, NDI_CLIENT_ID, NDI_CLIENT_SECRET, NDI_FOUNDATIONAL_SCHEMA, USE_NDI } from "../config/constants.mjs";
import { httpError } from "../utils/errors.mjs";
import { isAdminNdiIdentity, normalizeRole, now, randomSessionToken } from "../utils/values.mjs";
import { audit } from "./audit.service.mjs";
import { ensurePrivyWalletForNdiHolder } from "./privy.service.mjs";
import { verifyPlatformWallet } from "./wallet.service.mjs";

let ndiToken = "";
let ndiTokenExpiresAt = 0;

const normalizeAttributeName = (value = "") => String(value).replace(/[\s_-]+/g, "").toLowerCase();

const revealedValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(revealedValue).find(Boolean) || "";
  }

  if (value && typeof value === "object") {
    return value.value || value.raw || "";
  }

  return value || "";
};

const pickRevealedValue = (revealedAttrs = {}, name) => {
  const directValue = revealedValue(revealedAttrs[name]);
  if (directValue) {
    return String(directValue).trim();
  }

  const targetName = normalizeAttributeName(name);
  const entry = Object.entries(revealedAttrs).find(([key, value]) => {
    const candidateName = normalizeAttributeName(value?.name || value?.label || key);
    return candidateName === targetName;
  });

  return entry ? String(revealedValue(entry[1])).trim() : "";
};

export const fetchNdiToken = async () => {
  if (ndiToken && Date.now() < ndiTokenExpiresAt) {
    return ndiToken;
  }

  if (!USE_NDI) {
    throw httpError(503, "NDI credentials are not configured");
  }

  const body = new URLSearchParams({
    client_id: NDI_CLIENT_ID,
    client_secret: NDI_CLIENT_SECRET,
    grant_type: "client_credentials",
  });

  const response = await fetch(`${NDI_AUTH_BASE}/authentication/v1/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw httpError(502, `NDI auth failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  ndiToken = data.access_token;
  ndiTokenExpiresAt = Date.now() + Math.max(0, Number(data.expires_in || 0) - 300) * 1000;
  return ndiToken;
};

export const getTokenFromRequest = (req, body = {}) => {
  const header = req.headers.authorization ?? "";
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return body.sessionToken || body.token || "";
};

export const getUserBySession = (db, token) => db.users.find((user) => user.sessionToken && user.sessionToken === token);

export const requireUser = (db, req, body = {}) => {
  const token = getTokenFromRequest(req, body);
  const user = getUserBySession(db, token);
  if (!user) {
    throw httpError(401, "Authentication required");
  }
  return user;
};

export const requireAdmin = (db, req, body = {}) => {
  const user = requireUser(db, req, body);
  if (user.role !== "admin") {
    throw httpError(403, "Admin session required");
  }
  return user;
};

export const createNdiProofRequest = async (role, intent = "user") => {
  const normalizedRole = normalizeRole(role);
  const isAdminIntent = intent === "admin";
  const token = await fetchNdiToken();
  const payload = {
    proofName: isAdminIntent ? "Smart Property Platform Officer Login" : "Smart Property Platform Login",
    proofAttributes: ["Full Name", "ID Number"].map((name) => ({
      name,
      restrictions: [{ schema_name: NDI_FOUNDATIONAL_SCHEMA }],
    })),
    purpose: "login",
    authenticationLevel: "Standard",
    isShortenUrl: true,
  };

  const response = await fetch(`${NDI_API_BASE}/verifier/v1/proof-request`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw httpError(502, `NDI proof request failed: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  const data = result.data || result;
  const threadId = data.proofRequestThreadId || data.threadId;

  return {
    proofRequestThreadId: threadId,
    proofRequestURL: data.proofRequestURL,
    deepLinkURL: data.deepLinkURL,
    role: normalizedRole,
    intent: isAdminIntent ? "admin" : "user",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };
};

const ensurePrivyPlatformWallet = async (db, user, { holderDid, idNumberDisplay }) => {
  if (user.walletAddress) {
    return null;
  }

  const wallet = await ensurePrivyWalletForNdiHolder({ holderDid, idNumberDisplay });
  user.walletProvider = "privy";
  user.privyWalletId = wallet.walletId;
  user.privyWalletExternalId = wallet.externalId;
  user.privyWalletCreatedAt = wallet.created ? now() : user.privyWalletCreatedAt || now();

  await verifyPlatformWallet(db, user, wallet.walletAddress, {
    actor: wallet.created ? "PRIVY_WALLET_CREATED" : "PRIVY_WALLET_REUSED",
    metadata: {
      provider: "privy",
      privyWalletId: wallet.walletId,
      privyExternalId: wallet.externalId,
    },
  });

  return wallet;
};

export const createOrUpdateUserFromProof = async (db, pending, body = {}) => {
  const requestedRole = "user";
  const holderDid = body.holderDid || `did:key:demo-${requestedRole}-${pending.threadId.slice(0, 8)}`;
  const idNumberDisplay = body.idNumberDisplay || "NDI-VERIFIED";
  const fullName = String(body.fullName || body.name || "").trim();
  const existing = db.users.find((user) => user.holderDid === holderDid);
  const sessionToken = randomSessionToken();

  const user = existing ?? {
    holderDid,
    walletAddress: "",
    createdAt: now(),
    suspended: false,
  };

  user.idNumberDisplay = idNumberDisplay;
  user.fullName = fullName || user.fullName || "";
  user.sessionToken = sessionToken;
  user.ndiProofThreadId = pending.threadId;
  user.ndiVerifiedAt = now();

  await ensurePrivyPlatformWallet(db, user, { holderDid, idNumberDisplay });

  const adminRequested = pending.intent === "admin";
  const adminAllowed =
    adminRequested &&
    isAdminNdiIdentity({
      holderDid,
      idNumberDisplay,
      walletAddress: user.walletAddress,
    });
  const role = adminAllowed ? "admin" : requestedRole;
  user.role = role;

  if (!existing) {
    db.users.push(user);
  }

  if (adminRequested && !adminAllowed) {
    pending.status = "FAILED";
    pending.failedAt = now();
    pending.holderDid = holderDid;
    pending.idNumberDisplay = idNumberDisplay;
    pending.walletAddress = user.walletAddress;
    pending.walletProvider = user.walletProvider || "privy";
    pending.error = "This NDI identity is not approved for admin console access";
    audit(db, holderDid, "ADMIN_NDI_ACCESS_DENIED", pending.threadId, {
      idNumberDisplay,
      walletAddress: user.walletAddress,
    });
    throw httpError(403, pending.error);
  }

  pending.status = "VERIFIED";
  pending.sessionToken = sessionToken;
  pending.holderDid = holderDid;
  pending.idNumberDisplay = idNumberDisplay;
  pending.completedAt = now();
  pending.walletAddress = user.walletAddress;
  pending.walletProvider = user.walletProvider || "privy";
  delete pending.error;

  audit(db, holderDid, adminAllowed ? "ADMIN_NDI_ACCESS_GRANTED" : "NDI_PROOF_VALIDATED", pending.threadId, {
    role,
    idNumberDisplay,
    walletProvider: user.walletProvider || "privy",
  });
  return user;
};

export const createOrUpdateUserFromNdiPayload = async (db, threadId, payload = {}) => {
  const pending = db.pendingSessions.find((session) => session.threadId === threadId);
  if (!pending) {
    return null;
  }
  if (pending.status === "VERIFIED" && pending.sessionToken) {
    return getUserBySession(db, pending.sessionToken) || null;
  }

  const payloadData = payload?.data && typeof payload.data === "object" ? payload.data : null;
  const inner =
    payloadData &&
    ("verification_result" in payloadData ||
      "verificationResult" in payloadData ||
      "requested_presentation" in payloadData ||
      "holder_did" in payloadData)
      ? payloadData
      : payload;
  const verificationResult = inner.verification_result || inner.verificationResult || "";

  if (!verificationResult) {
    return null;
  }

  if (verificationResult !== "ProofValidated") {
    pending.status = "FAILED";
    pending.failedAt = now();
    pending.error = "NDI Wallet did not validate this login request. Please try again.";
    audit(db, "ndi", "NDI_PROOF_FAILED", threadId, { verificationResult });
    return null;
  }

  const revealed = inner.requested_presentation?.revealed_attrs || {};
  const holderDid = inner.holder_did;
  if (!holderDid) {
    pending.status = "FAILED";
    pending.failedAt = now();
    pending.error = "NDI proof was validated, but the wallet did not include a holder identity.";
    audit(db, "ndi", "NDI_PROOF_FAILED", threadId, { reason: "Missing holder_did" });
    return null;
  }

  try {
    return await createOrUpdateUserFromProof(db, pending, {
      holderDid,
      idNumberDisplay: pickRevealedValue(revealed, "ID Number") || "NDI-VERIFIED",
      fullName: pickRevealedValue(revealed, "Full Name"),
      role: pending.role,
    });
  } catch (error) {
    pending.status = "FAILED";
    pending.failedAt = now();
    pending.error = error instanceof Error ? error.message : "Unable to complete NDI authorization";
    audit(db, holderDid, "NDI_AUTHORIZATION_FAILED", threadId, { reason: pending.error });
    return null;
  }
};
