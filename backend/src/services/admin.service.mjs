import { SHARES_PER_PROPERTY, ZERO_WALLET } from "../config/constants.mjs";
import { setBalance } from "../models/ledger.model.mjs";
import { audit } from "./audit.service.mjs";
import { mintPropertyOnChain } from "./chain.service.mjs";
import { createListing } from "./erc6909.service.mjs";
import { findProperty } from "./property.service.mjs";
import { isVerifiedWallet } from "./wallet.service.mjs";
import { httpError } from "../utils/errors.mjs";
import { makeId, normalizeWallet, now, randomHex } from "../utils/values.mjs";

export const reviewQueue = (db) => db.properties.filter((property) => property.status === "PENDING");

const syncNextTokenId = (db, tokenId) => {
  const numericTokenId = Number(tokenId);
  if (Number.isInteger(numericTokenId)) {
    db.nextTokenId = Math.max(Number(db.nextTokenId || 1), numericTokenId + 1);
  }
};

export const approveProperty = async (db, admin, propertyId, body = {}) => {
  const property = findProperty(db, propertyId);
  if (!property) {
    throw httpError(404, "Property not found");
  }
  if (property.status !== "PENDING") {
    throw httpError(400, "Only pending properties can be approved");
  }

  if (!isVerifiedWallet(db, property.ownerWallet)) {
    throw httpError(400, "Owner wallet must be NDI-linked before minting property shares");
  }

  const chainMint = await mintPropertyOnChain(property.ownerWallet, SHARES_PER_PROPERTY, property.docHash);
  const tokenId = chainMint?.tokenId || String(db.nextTokenId++);
  syncNextTokenId(db, tokenId);
  property.tokenId = tokenId;
  property.status = "APPROVED";
  property.approvedAt = now();
  property.updatedAt = now();
  property.totalSupply = SHARES_PER_PROPERTY;

  setBalance(db, property.ownerWallet, tokenId, SHARES_PER_PROPERTY);
  db.transferEvents.unshift({
    id: makeId("EVT"),
    tokenId,
    fromWallet: ZERO_WALLET,
    toWallet: normalizeWallet(property.ownerWallet),
    qty: SHARES_PER_PROPERTY,
    txHash: chainMint?.txHash || randomHex(32),
    timestamp: now(),
  });

  const requestedShares = Math.min(Math.max(Number(property.requestedListingShares || 0), 0), SHARES_PER_PROPERTY);
  let listing = null;
  if (requestedShares > 0) {
    listing = createListing(db, {
      user: { ...admin, walletAddress: property.ownerWallet, suspended: false },
      tokenId,
      sharesForSale: requestedShares,
      pricePerShare: Number(property.requestedPricePerShare || 1),
      listingType: requestedShares === SHARES_PER_PROPERTY ? "FULL" : "PARTIAL",
    });
  }

  audit(db, admin.walletAddress || admin.holderDid, "PROPERTY_APPROVED", property._id, {
    tokenId,
    notes: body.notes || "",
    chainTxHash: chainMint?.txHash || null,
  });
  return { property, listing };
};

export const rejectProperty = (db, admin, propertyId, body = {}) => {
  const property = findProperty(db, propertyId);
  if (!property) {
    throw httpError(404, "Property not found");
  }

  property.status = "REJECTED";
  property.rejectionNotes = body.notes || "Rejected by admin review";
  property.updatedAt = now();
  audit(db, admin.walletAddress || admin.holderDid, "PROPERTY_REJECTED", property._id, { notes: property.rejectionNotes });

  return property;
};

export const suspendWallet = (db, admin, wallet, body = {}) => {
  const normalizedWallet = normalizeWallet(wallet);
  const users = db.users.filter((user) => normalizeWallet(user.walletAddress) === normalizedWallet);
  users.forEach((user) => {
    user.suspended = true;
  });
  audit(db, admin.walletAddress || admin.holderDid, "WALLET_SUSPENDED", normalizedWallet, { reason: body.reason || "" });
  return { wallet: normalizedWallet, users };
};
