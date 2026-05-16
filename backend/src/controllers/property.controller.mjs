import { writeDb } from "../db/store.mjs";
import { serializeListing } from "../models/listing.model.mjs";
import { serializeProperty } from "../models/property.model.mjs";
import { requireAdmin, requireUser } from "../services/auth.service.mjs";
import { getPropertyHistory, legacyBuyProperty, registerProperty, transferWholeProperty } from "../services/property.service.mjs";
import { created, ok } from "../utils/http.mjs";

export const listProperties = ({ db, res }) => ok(res, { properties: db.properties.map((property) => serializeProperty(db, property)) });

export const createProperty = async ({ db, req, body, res }) => {
  requireAdmin(db, req, body);
  const property = await registerProperty(db, body);
  await writeDb(db);
  return created(res, { property: serializeProperty(db, property) });
};

export const history = ({ db, segments, res }) => ok(res, { history: getPropertyHistory(db, segments[2]) });

export const transfer = async ({ db, req, segments, body, res }) => {
  requireAdmin(db, req, body);
  const property = transferWholeProperty(db, segments[2], body);
  await writeDb(db);
  return ok(res, { property: serializeProperty(db, property) });
};

export const legacyBuy = async ({ db, req, segments, body, res }) => {
  const user = requireUser(db, req, body);
  const { property, listing } = legacyBuyProperty(db, segments[2], { ...body, buyerWallet: user.walletAddress });
  await writeDb(db);
  return ok(res, { property: serializeProperty(db, property), listing: serializeListing(db, listing) });
};
