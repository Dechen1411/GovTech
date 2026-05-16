import { activeLeasedShares, balanceOf } from "../models/ledger.model.mjs";
import { audit } from "./audit.service.mjs";
import { createLeaseOnChain, closeLeaseOnChain } from "./chain.service.mjs";
import { isVerifiedWallet } from "./wallet.service.mjs";
import { httpError } from "../utils/errors.mjs";
import { asTokenId, isWallet, makeId, normalizeWallet, now, sha256Hex } from "../utils/values.mjs";

const leaseStatusSet = new Set(["ACTIVE", "COMPLETED", "CANCELLED"]);

const toUnixSeconds = (value, label) => {
  const time = Date.parse(String(value || ""));
  if (!Number.isFinite(time)) {
    throw httpError(400, `${label} must be a valid date`);
  }
  return Math.floor(time / 1000);
};

const leaseTermsHash = (terms) =>
  sha256Hex(
    JSON.stringify({
      tokenId: terms.tokenId,
      lessorWallet: normalizeWallet(terms.lessorWallet),
      lesseeWallet: normalizeWallet(terms.lesseeWallet),
      shareAmount: Number(terms.shareAmount),
      startDate: terms.startDate,
      endDate: terms.endDate,
      rentAmount: Number(terms.rentAmount),
      depositAmount: Number(terms.depositAmount),
      notes: String(terms.notes || ""),
    }),
  );

export const listLeases = (db, searchParams) => {
  const wallet = normalizeWallet(searchParams.get("wallet") || "");
  const tokenId = asTokenId(searchParams.get("tokenId") || "");
  const status = searchParams.get("status") || "ACTIVE";

  return (db.leases ?? [])
    .filter((lease) => status === "ALL" || lease.status === status)
    .filter((lease) => !tokenId || asTokenId(lease.tokenId) === tokenId)
    .filter((lease) => !wallet || normalizeWallet(lease.lessorWallet) === wallet || normalizeWallet(lease.lesseeWallet) === wallet);
};

export const createLease = async (db, user, body = {}) => {
  const lessorWallet = normalizeWallet(user.walletAddress);
  const lesseeWallet = normalizeWallet(body.lesseeWallet);
  const tokenId = asTokenId(body.tokenId);
  const shareAmount = Number(body.shareAmount);
  const rentAmount = Number(body.rentAmount);
  const depositAmount = Number(body.depositAmount || 0);
  const property = db.properties.find((item) => asTokenId(item.tokenId) === tokenId);

  if (!isWallet(lessorWallet)) {
    throw httpError(400, "Link a wallet before creating a lease");
  }
  if (!isVerifiedWallet(db, lessorWallet)) {
    throw httpError(400, "Lessor wallet must be NDI-linked before leasing shares");
  }
  if (!isWallet(lesseeWallet)) {
    throw httpError(400, "A valid lessee wallet is required");
  }
  if (lessorWallet === lesseeWallet) {
    throw httpError(400, "Lessor and lessee wallets must be different");
  }
  if (!isVerifiedWallet(db, lesseeWallet)) {
    throw httpError(400, "Lessee wallet must be NDI-linked before receiving lease rights");
  }
  if (!property || !["APPROVED", "LISTED"].includes(property.status)) {
    throw httpError(400, "Property is not approved for leasing");
  }
  if (!Number.isInteger(shareAmount) || shareAmount < 1) {
    throw httpError(400, "Share amount must be a positive whole number");
  }
  if (balanceOf(db, lessorWallet, tokenId) - activeLeasedShares(db, lessorWallet, tokenId) < shareAmount) {
    throw httpError(400, "Lease amount exceeds the lessor's unleased share balance");
  }
  if (!Number.isFinite(rentAmount) || rentAmount <= 0) {
    throw httpError(400, "Rent amount must be greater than zero");
  }
  if (!Number.isFinite(depositAmount) || depositAmount < 0) {
    throw httpError(400, "Deposit amount cannot be negative");
  }

  const startDate = toUnixSeconds(body.startDate, "Start date");
  const endDate = toUnixSeconds(body.endDate, "End date");
  if (startDate >= endDate) {
    throw httpError(400, "Lease end date must be after start date");
  }

  const termsHash = leaseTermsHash({
    tokenId,
    lessorWallet,
    lesseeWallet,
    shareAmount,
    startDate,
    endDate,
    rentAmount,
    depositAmount,
    notes: body.notes,
  });

  const chainLease = await createLeaseOnChain({
    tokenId,
    lessorWallet,
    lesseeWallet,
    shareAmount,
    startDate,
    endDate,
    rentAmount,
    depositAmount,
    termsHash,
  });
  if (!chainLease) {
    throw httpError(500, "Chain is not configured for on-chain lease creation");
  }

  const lease = {
    id: makeId("LEASE"),
    chainLeaseId: chainLease.leaseId,
    tokenId,
    lessorWallet,
    lesseeWallet,
    shareAmount,
    startDate,
    endDate,
    startDateIso: new Date(startDate * 1000).toISOString(),
    endDateIso: new Date(endDate * 1000).toISOString(),
    rentAmount,
    depositAmount,
    termsHash,
    status: "ACTIVE",
    txHash: chainLease.txHash,
    notes: body.notes || "",
    createdAt: now(),
  };

  db.leases.unshift(lease);
  audit(db, lessorWallet, "LEASE_CREATED", lease.id, {
    chainLeaseId: lease.chainLeaseId,
    tokenId,
    lesseeWallet,
    shareAmount,
    termsHash,
    txHash: chainLease.txHash,
  });

  return lease;
};

export const closeLease = async (db, user, leaseId, action) => {
  const lease = (db.leases ?? []).find((item) => item.id === leaseId || item.chainLeaseId === leaseId);
  if (!lease) {
    throw httpError(404, "Lease not found");
  }
  if (lease.status !== "ACTIVE") {
    throw httpError(400, "Only active leases can be closed");
  }
  const actorWallet = normalizeWallet(user.walletAddress);
  if (user.role !== "admin" && actorWallet !== normalizeWallet(lease.lessorWallet) && actorWallet !== normalizeWallet(lease.lesseeWallet)) {
    throw httpError(403, "Only a lease party or admin can close this lease");
  }

  const normalizedAction = action === "cancel" ? "cancel" : "complete";
  const chainClose = await closeLeaseOnChain(lease.chainLeaseId, normalizedAction);
  if (!chainClose) {
    throw httpError(500, "Chain is not configured for on-chain lease closure");
  }

  lease.status = normalizedAction === "cancel" ? "CANCELLED" : "COMPLETED";
  lease.closedAt = now();
  lease.closeTxHash = chainClose.txHash;
  audit(db, actorWallet || user.holderDid, normalizedAction === "cancel" ? "LEASE_CANCELLED" : "LEASE_COMPLETED", lease.id, {
    chainLeaseId: lease.chainLeaseId,
    txHash: chainClose.txHash,
  });

  return lease;
};

export const isLeaseStatus = (status) => leaseStatusSet.has(status);
