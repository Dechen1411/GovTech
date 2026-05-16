import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { PRIVY_API_BASE, PRIVY_APP_ID, PRIVY_APP_SECRET, USE_PRIVY } from "../config/constants.mjs";
import { httpError } from "../utils/errors.mjs";
import { isWallet, normalizeWallet } from "../utils/values.mjs";

const privyAuthHeader = () => `Basic ${Buffer.from(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`, "utf8").toString("base64")}`;

const privyHeaders = (extra = {}) => ({
  Authorization: privyAuthHeader(),
  "privy-app-id": PRIVY_APP_ID,
  ...extra,
});

const readErrorText = async (response) => {
  const text = await response.text().catch(() => "");
  return text || response.statusText || "Unknown Privy error";
};

export const privyExternalIdForHolder = (holderDid = "") => {
  const digest = createHash("sha256").update(String(holderDid)).digest("hex");
  return `ndi_${digest.slice(0, 48)}`;
};

export const getPrivyWalletByExternalId = async (externalId) => {
  if (!USE_PRIVY) {
    throw httpError(503, "Privy credentials are not configured. Set PRIVY_APP_ID and PRIVY_APP_SECRET.");
  }

  const response = await fetch(`${PRIVY_API_BASE}/wallets/ext_wal_${encodeURIComponent(externalId)}`, {
    method: "GET",
    headers: privyHeaders(),
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw httpError(502, `Privy wallet lookup failed: ${response.status} ${await readErrorText(response)}`);
  }

  return response.json();
};

export const ensurePrivyWalletForNdiHolder = async ({ holderDid, idNumberDisplay = "" }) => {
  if (!holderDid) {
    throw httpError(400, "Holder DID is required before creating a Privy wallet");
  }

  const externalId = privyExternalIdForHolder(holderDid);
  const existing = await getPrivyWalletByExternalId(externalId);
  if (existing?.address) {
    const walletAddress = normalizeWallet(existing.address);
    if (!isWallet(walletAddress)) {
      throw httpError(502, "Privy returned an invalid Ethereum wallet address");
    }
    return {
      walletId: existing.id,
      walletAddress,
      externalId,
      created: false,
    };
  }

  const response = await fetch(`${PRIVY_API_BASE}/wallets`, {
    method: "POST",
    headers: privyHeaders({
      "Content-Type": "application/json",
      "privy-idempotency-key": externalId,
    }),
    body: JSON.stringify({
      chain_type: "ethereum",
      external_id: externalId,
      display_name: `Smart Property ${String(idNumberDisplay || holderDid).slice(-12)}`,
    }),
  });

  if (!response.ok) {
    const errorText = await readErrorText(response);
    if (response.status === 409 || errorText.toLowerCase().includes("external_id")) {
      const duplicate = await getPrivyWalletByExternalId(externalId);
      if (duplicate?.address) {
        const walletAddress = normalizeWallet(duplicate.address);
        if (!isWallet(walletAddress)) {
          throw httpError(502, "Privy returned an invalid Ethereum wallet address");
        }
        return {
          walletId: duplicate.id,
          walletAddress,
          externalId,
          created: false,
        };
      }
    }
    throw httpError(502, `Privy wallet creation failed: ${response.status} ${errorText}`);
  }

  const wallet = await response.json();
  const walletAddress = normalizeWallet(wallet.address);
  if (!isWallet(walletAddress)) {
    throw httpError(502, "Privy returned an invalid Ethereum wallet address");
  }

  return {
    walletId: wallet.id,
    walletAddress,
    externalId,
    created: true,
  };
};
