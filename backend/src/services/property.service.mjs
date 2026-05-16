import { SHARES_PER_PROPERTY, ZERO_WALLET } from "../config/constants.mjs";
import { balanceOf, propertyHistory, setBalance, topHolder } from "../models/ledger.model.mjs";
import { audit } from "./audit.service.mjs";
import { mintPropertyOnChain } from "./chain.service.mjs";
import { transferShares } from "./erc6909.service.mjs";
import { isVerifiedWallet } from "./wallet.service.mjs";
import { httpError } from "../utils/errors.mjs";
import { asTokenId, isWallet, makeId, normalizeWallet, now, randomHex } from "../utils/values.mjs";

export const findProperty = (db, id) => {
  const normalized = asTokenId(id);
  return db.properties.find((property) => property._id === normalized || property.tokenId === normalized || property.id === normalized);
};

const syncNextTokenId = (db, tokenId) => {
  const numericTokenId = Number(tokenId);
  if (Number.isInteger(numericTokenId)) {
    db.nextTokenId = Math.max(Number(db.nextTokenId || 1), numericTokenId + 1);
  }
};

export const registerProperty = async (db, body = {}) => {
  const docHash = String(body.documentHash || body.docHash || "").trim();
  const ownerWallet = normalizeWallet(body.ownerWallet);
  if (!body.title || !body.location || !docHash || !isWallet(ownerWallet)) {
    throw httpError(400, "Title, location, document hash, and owner wallet are required");
  }
  if (!isVerifiedWallet(db, ownerWallet)) {
    throw httpError(400, "Owner wallet must be NDI-linked before minting property shares");
  }

  const chainMint = await mintPropertyOnChain(ownerWallet, SHARES_PER_PROPERTY, docHash);
  const tokenId = chainMint?.tokenId || asTokenId(body.id || db.nextTokenId++);
  syncNextTokenId(db, tokenId);
  const property = {
    _id: `prop-${tokenId}`,
    tokenId,
    title: String(body.title).trim(),
    location: String(body.location).trim(),
    threeWordLocation: String(body.threeWordLocation || "").trim(),
    propertyType: body.propertyType || "Residential",
    price: String(body.price || "Nu. 0"),
    ownerWallet,
    docHash,
    documentHash: docHash,
    docStorageRef: body.docStorageRef || "manual://admin-registration",
    totalSupply: SHARES_PER_PROPERTY,
    status: "LISTED",
    submittedAt: now(),
    approvedAt: now(),
    updatedAt: now(),
    imageUrl: body.imageUrl || "",
    imageStorageRef: body.imageStorageRef || "",
    imageCid: body.imageCid || "",
    imageName: body.imageName || "",
    description: body.description || "",
  };

  db.properties.unshift(property);
  setBalance(db, ownerWallet, tokenId, SHARES_PER_PROPERTY);
  db.transferEvents.unshift({
    id: makeId("EVT"),
    tokenId,
    fromWallet: ZERO_WALLET,
    toWallet: ownerWallet,
    qty: SHARES_PER_PROPERTY,
    txHash: chainMint?.txHash || randomHex(32),
    timestamp: now(),
  });
  audit(db, ownerWallet, "PROPERTY_REGISTERED", tokenId, { docHash, chainTxHash: chainMint?.txHash || null });

  return property;
};

export const getPropertyHistory = (db, id) => {
  const property = findProperty(db, id);
  if (!property || !property.tokenId) {
    throw httpError(404, "Property history not found");
  }
  return propertyHistory(db, property.tokenId);
};

export const transferWholeProperty = (db, id, body = {}) => {
  const property = findProperty(db, id);
  const newOwnerWallet = normalizeWallet(body.newOwnerWallet);
  if (!property || !property.tokenId) {
    throw httpError(404, "Property not found");
  }
  if (!isWallet(newOwnerWallet)) {
    throw httpError(400, "A valid new owner wallet is required");
  }
  if (!isVerifiedWallet(db, newOwnerWallet)) {
    throw httpError(400, "New owner wallet must be NDI-linked before receiving shares");
  }
  const currentOwner = topHolder(db, property.tokenId);
  if (!isVerifiedWallet(db, currentOwner)) {
    throw httpError(400, "Current owner wallet must be NDI-linked before transferring shares");
  }

  transferShares(db, {
    tokenId: property.tokenId,
    fromWallet: currentOwner,
    toWallet: newOwnerWallet,
    qty: balanceOf(db, currentOwner, property.tokenId),
  });
  audit(db, currentOwner, "OWNERSHIP_TRANSFERRED", property.tokenId, { newOwnerWallet });

  return property;
};

export const legacyBuyProperty = (db, id, body = {}) => {
  const property = findProperty(db, id);
  const buyerWallet = normalizeWallet(body.buyerWallet);
  if (!property || !property.tokenId) {
    throw httpError(404, "Property not found");
  }
  if (!isWallet(buyerWallet)) {
    throw httpError(400, "A valid buyer wallet is required");
  }
  if (!isVerifiedWallet(db, buyerWallet)) {
    throw httpError(400, "Buyer wallet must be NDI-linked before purchasing shares");
  }

  const listing = db.listings.find((item) => item.tokenId === property.tokenId && ["ACTIVE", "PARTIALLY_SOLD"].includes(item.status));
  if (!listing) {
    throw httpError(400, "No active listing is available for this property");
  }
  if (!isVerifiedWallet(db, listing.sellerWallet)) {
    throw httpError(400, "Seller wallet must be NDI-linked before transferring shares");
  }

  const qty = Math.max(1, Number(body.qty || listing.sharesForSale));
  transferShares(db, { tokenId: listing.tokenId, fromWallet: listing.sellerWallet, toWallet: buyerWallet, qty });
  listing.sharesForSale -= qty;
  listing.status = listing.sharesForSale === 0 ? "SOLD" : "PARTIALLY_SOLD";
  audit(db, buyerWallet, "LEGACY_PROPERTY_PURCHASED", property.tokenId, { qty, listingId: listing.id });

  return { property, listing };
};
