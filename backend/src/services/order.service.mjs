import { balanceOf } from "../models/ledger.model.mjs";
import { SHARES_PER_PROPERTY } from "../config/constants.mjs";
import { audit } from "./audit.service.mjs";
import { transferShares } from "./erc6909.service.mjs";
import { findListing } from "./listing.service.mjs";
import { isVerifiedWallet } from "./wallet.service.mjs";
import { httpError } from "../utils/errors.mjs";
import { isWallet, makeId, normalizeWallet, now, randomHex } from "../utils/values.mjs";

export const createOrder = (db, user, body = {}) => {
  if (!user.walletAddress || !isWallet(user.walletAddress)) {
    throw httpError(400, "Link a wallet before purchasing shares");
  }
  if (!isVerifiedWallet(db, user.walletAddress)) {
    throw httpError(400, "Your linked wallet must be NDI-verified before purchasing shares");
  }

  const listing = findListing(db, body.listingId);
  if (!listing || !["ACTIVE", "PARTIALLY_SOLD"].includes(listing.status)) {
    throw httpError(400, "Listing is not available");
  }
  if (!isVerifiedWallet(db, listing.sellerWallet)) {
    throw httpError(400, "Seller wallet must be NDI-linked before transferring shares");
  }

  const qty = Number(body.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > listing.sharesForSale) {
    throw httpError(400, "Quantity must be within the available shares");
  }

  const txHash = randomHex(32);
  const event = transferShares(db, {
    tokenId: listing.tokenId,
    fromWallet: listing.sellerWallet,
    toWallet: user.walletAddress,
    qty,
    txHash,
  });

  listing.sharesForSale -= qty;
  listing.status = listing.sharesForSale === 0 ? "SOLD" : "PARTIALLY_SOLD";

  const order = {
    id: makeId("ORD"),
    listingId: listing.id,
    tokenId: listing.tokenId,
    buyerWallet: normalizeWallet(user.walletAddress),
    qty,
    totalPrice: qty * listing.pricePerShare,
    status: "COMPLETE",
    txHash,
    createdAt: now(),
  };

  db.orders.unshift(order);
  audit(db, user.walletAddress, "SHARES_PURCHASED", order.id, { listingId: listing.id, tokenId: listing.tokenId, qty, txHash: event.txHash });

  return { order, listing, txHash };
};

export const portfolioForWallet = (db, wallet) => {
  const normalizedWallet = normalizeWallet(wallet);
  if (!isWallet(normalizedWallet)) {
    throw httpError(400, "A valid wallet address is required");
  }

  const walletBalances = db.balances[normalizedWallet] ?? {};
  const holdings = Object.entries(walletBalances)
    .filter(([, amount]) => Number(amount) > 0)
    .map(([tokenId, amount]) => {
      const property = db.properties.find((item) => item.tokenId === tokenId);
      const activeListing = db.listings.find((item) => item.tokenId === tokenId && ["ACTIVE", "PARTIALLY_SOLD"].includes(item.status));
      const totalSupply = Number(property?.totalSupply ?? SHARES_PER_PROPERTY);
      return {
        tokenId,
        balance: balanceOf(db, normalizedWallet, tokenId) || Number(amount),
        percentage: Number(((Number(amount) / totalSupply) * 100).toFixed(2)),
        estimatedValue: Number(amount) * Number(activeListing?.pricePerShare ?? 0),
        property,
      };
    });

  const listings = db.listings.filter((listing) => normalizeWallet(listing.sellerWallet) === normalizedWallet);
  const orders = db.orders.filter((order) => normalizeWallet(order.buyerWallet) === normalizedWallet);
  const leases = (db.leases ?? []).filter(
    (lease) => normalizeWallet(lease.lessorWallet) === normalizedWallet || normalizeWallet(lease.lesseeWallet) === normalizedWallet,
  );

  return { wallet: normalizedWallet, holdings, listings, orders, leases };
};
