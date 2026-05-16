import { NDI_API_BASE, NDI_AUTH_BASE, NDI_CLIENT_ID, NDI_CLIENT_SECRET, NDI_FOUNDATIONAL_SCHEMA, USE_NDI } from "../config/constants.mjs";
import { httpError } from "../utils/errors.mjs";
import { normalizeRole, now, randomSessionToken } from "../utils/values.mjs";
import { audit } from "./audit.service.mjs";

let ndiToken = "";
let ndiTokenExpiresAt = 0;

const pickRevealedValue = (revealedAttrs = {}, name) => {
  const value = revealedAttrs[name];
  if (Array.isArray(value)) {
    return value[0]?.value || "";
  }
  return value?.value || "";
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

export const createNdiProofRequest = async (role) => {
  const normalizedRole = normalizeRole(role);
  const token = await fetchNdiToken();
  const payload = {
    proofName: "Smart Property Platform Login",
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
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };
};

export const createOrUpdateUserFromProof = (db, pending, body = {}) => {
  const requestedRole = "user";
  const holderDid = body.holderDid || `did:key:demo-${requestedRole}-${pending.threadId.slice(0, 8)}`;
  const idNumberDisplay = body.idNumberDisplay || "NDI-VERIFIED";
  const existing = db.users.find((user) => user.holderDid === holderDid);
  const sessionToken = randomSessionToken();

  const user = existing ?? {
    holderDid,
    walletAddress: "",
    createdAt: now(),
    suspended: false,
  };

  user.idNumberDisplay = idNumberDisplay;
  user.fullName = body.fullName || user.fullName || "";
  const role = requestedRole;
  user.role = role;
  user.sessionToken = sessionToken;
  user.ndiProofThreadId = pending.threadId;
  user.ndiVerifiedAt = now();

  if (!existing) {
    db.users.push(user);
  }

  pending.status = "VERIFIED";
  pending.sessionToken = sessionToken;
  pending.holderDid = holderDid;
  pending.idNumberDisplay = idNumberDisplay;
  pending.completedAt = now();

  audit(db, holderDid, "NDI_PROOF_VALIDATED", pending.threadId, { role, idNumberDisplay });
  return user;
};

export const createOrUpdateUserFromNdiPayload = (db, threadId, payload = {}) => {
  const pending = db.pendingSessions.find((session) => session.threadId === threadId);
  if (!pending) {
    return null;
  }
  if (pending.status === "VERIFIED" && pending.sessionToken) {
    return getUserBySession(db, pending.sessionToken) || null;
  }

  const inner = payload?.data?.type ? payload.data : payload;
  if (inner.verification_result !== "ProofValidated") {
    pending.status = "FAILED";
    pending.failedAt = now();
    audit(db, "ndi", "NDI_PROOF_FAILED", threadId, { verificationResult: inner.verification_result || "unknown" });
    return null;
  }

  const revealed = inner.requested_presentation?.revealed_attrs || {};
  const holderDid = inner.holder_did;
  if (!holderDid) {
    pending.status = "FAILED";
    pending.failedAt = now();
    audit(db, "ndi", "NDI_PROOF_FAILED", threadId, { reason: "Missing holder_did" });
    return null;
  }

  return createOrUpdateUserFromProof(db, pending, {
    holderDid,
    idNumberDisplay: pickRevealedValue(revealed, "ID Number") || "NDI-VERIFIED",
    fullName: pickRevealedValue(revealed, "Full Name"),
    role: pending.role,
  });
};
