import { writeDb } from "../db/store.mjs";
import { serializeListing } from "../models/listing.model.mjs";
import { requireUser } from "../services/auth.service.mjs";
import { createListing } from "../services/erc6909.service.mjs";
import { cancelListing, listListings } from "../services/listing.service.mjs";
import { created, ok } from "../utils/http.mjs";

export const list = ({ db, requestUrl, res }) => ok(res, { listings: listListings(db, requestUrl.searchParams) });

export const create = async ({ db, req, body, res }) => {
  const user = requireUser(db, req, body);
  const listing = createListing(db, {
    user,
    tokenId: body.tokenId,
    sharesForSale: body.sharesForSale,
    pricePerShare: body.pricePerShare,
    listingType: body.listingType,
  });
  await writeDb(db);
  return created(res, { listing: serializeListing(db, listing) });
};

export const cancel = async ({ db, req, body, segments, res }) => {
  const user = requireUser(db, req, body);
  const listing = cancelListing(db, segments[2], user);
  await writeDb(db);
  return ok(res, { listing: serializeListing(db, listing) });
};
