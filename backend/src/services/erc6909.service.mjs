import { SHARES_PER_PROPERTY } from "../config/constants.mjs";
import { activeLeasedShares, balanceOf, setBalance, topHolder } from "../models/ledger.model.mjs";
import { audit } from "./audit.service.mjs";
import { isVerifiedWallet } from "./wallet.service.mjs";
import { httpError } from "../utils/errors.mjs";
import { asTokenId, makeId, normalizeWallet, now, randomHex } from "../utils/values.mjs";

export const approveMarketplaceSpend = (db, ownerWallet, tokenId, amount) => {
  if (!isVerifiedWallet(db, ownerWallet)) {
    throw httpError(400, "Seller wallet must be NDI-linked before approving marketplace transfers");
  }

  const existing = db.approvals.find(
    (approval) =>
      normalizeWallet(approval.ownerWallet) === normalizeWallet(ownerWallet) &&
      approval.tokenId === asTokenId(tokenId) &&
      approval.spender === "marketplace",
  );

  if (existing) {
    existing.amount = Number(amount);
    return existing;
  }

  const approval = {
    ownerWallet: normalizeWallet(ownerWallet),
    spender: "marketplace",
    tokenId: asTokenId(tokenId),
    amount: Number(amount),
  };
  db.approvals.push(approval);
  return approval;
};

export const transferShares = (db, { tokenId, fromWallet, toWallet, qty, txHash = randomHex(32) }) => {
  const token = asTokenId(tokenId);
  const from = normalizeWallet(fromWallet);
  const to = normalizeWallet(toWallet);
  const amount = Number(qty);
  const fromBalance = balanceOf(db, from, token);

  if (!isVerifiedWallet(db, from)) {
    throw httpError(400, "Source wallet must be NDI-linked before transferring shares");
  }

  if (!isVerifiedWallet(db, to)) {
    throw httpError(400, "Recipient wallet must be NDI-linked before receiving shares");
  }

  if (fromBalance < amount) {
    throw httpError(400, "Seller does not hold enough shares");
  }

  if (fromBalance - activeLeasedShares(db, from, token) < amount) {
    throw httpError(400, "These shares are locked by an active lease");
  }

  setBalance(db, from, token, fromBalance - amount);
  setBalance(db, to, token, balanceOf(db, to, token) + amount);

  const event = {
    id: makeId("EVT"),
    tokenId: token,
    fromWallet: from,
    toWallet: to,
    qty: amount,
    txHash,
    timestamp: now(),
  };
  db.transferEvents.unshift(event);

  const property = db.properties.find((item) => item.tokenId === token);
  if (property) {
    property.ownerWallet = topHolder(db, token);
    property.updatedAt = now();
  }

  return event;
};

export const createListing = (db, { user, tokenId, sharesForSale, pricePerShare, listingType }) => {
  const token = asTokenId(tokenId);
  const property = db.properties.find((item) => item.tokenId === token);
  const sellerWallet = normalizeWallet(user.walletAddress);
  const shares = Number(sharesForSale);
  const price = Number(pricePerShare);

  if (!property || !["APPROVED", "LISTED"].includes(property.status)) {
    throw httpError(400, "Property is not approved for listing");
  }

  if (!sellerWallet) {
    throw httpError(400, "A verified wallet is required before listing shares");
  }

  if (!isVerifiedWallet(db, sellerWallet)) {
    throw httpError(400, "Seller wallet must be NDI-linked before listing shares");
  }

  if (user.suspended) {
    throw httpError(400, "This wallet is suspended from creating listings");
  }

  if (!Number.isInteger(shares) || shares < 1 || shares > balanceOf(db, sellerWallet, token) - activeLeasedShares(db, sellerWallet, token)) {
    throw httpError(400, "Shares for sale must be within the holder balance");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw httpError(400, "Price per share must be greater than zero");
  }

  const resolvedType = listingType || (shares === SHARES_PER_PROPERTY ? "FULL" : "PARTIAL");
  approveMarketplaceSpend(db, sellerWallet, token, shares);

  const listing = {
    id: makeId("LST"),
    tokenId: token,
    sharesForSale: shares,
    originalShares: shares,
    pricePerShare: price,
    sellerWallet,
    listingType: resolvedType,
    status: "ACTIVE",
    createdAt: now(),
  };

  db.listings.unshift(listing);
  property.status = "LISTED";
  property.updatedAt = now();
  audit(db, sellerWallet, "LISTING_CREATED", listing.id, { tokenId: token, sharesForSale: shares, pricePerShare: price });

  return listing;
};
