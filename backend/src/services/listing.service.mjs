import { serializeListing } from "../models/listing.model.mjs";
import { audit } from "./audit.service.mjs";
import { httpError } from "../utils/errors.mjs";
import { normalizeWallet } from "../utils/values.mjs";

export const findListing = (db, id) => db.listings.find((listing) => listing.id === id);

export const listListings = (db, searchParams) => {
  const status = searchParams.get("status") || "ACTIVE";
  const type = searchParams.get("type") || "";

  return db.listings
    .filter((listing) => status === "ALL" || listing.status === status || (status === "ACTIVE" && listing.status === "PARTIALLY_SOLD"))
    .filter((listing) => !type || listing.listingType === type)
    .map((listing) => serializeListing(db, listing));
};

export const cancelListing = (db, listingId, user) => {
  const listing = findListing(db, listingId);
  if (!listing) {
    throw httpError(404, "Listing not found");
  }
  if (normalizeWallet(listing.sellerWallet) !== normalizeWallet(user.walletAddress) && user.role !== "admin") {
    throw httpError(403, "Only the seller or admin can cancel this listing");
  }

  listing.status = "CANCELLED";
  listing.cancelledAt = new Date().toISOString();
  audit(db, user.walletAddress || user.holderDid, "LISTING_CANCELLED", listing.id);
  return listing;
};
