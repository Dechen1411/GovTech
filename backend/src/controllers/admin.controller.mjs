import { writeDb } from "../db/store.mjs";
import { serializeListing } from "../models/listing.model.mjs";
import { serializeProperty } from "../models/property.model.mjs";
import { serializeUser } from "../models/user.model.mjs";
import { approveProperty, rejectProperty, reviewQueue, suspendWallet } from "../services/admin.service.mjs";
import { requireAdmin } from "../services/auth.service.mjs";
import { ok } from "../utils/http.mjs";

export const queue = ({ db, req, body, res }) => {
  requireAdmin(db, req, body);
  return ok(res, { queue: reviewQueue(db).map((property) => serializeProperty(db, property)) });
};

export const approve = async ({ db, req, body, segments, res }) => {
  const admin = requireAdmin(db, req, body);
  const { property, listing } = await approveProperty(db, admin, segments[3], body);
  await writeDb(db);
  return ok(res, { property: serializeProperty(db, property), listing: listing ? serializeListing(db, listing) : null });
};

export const reject = async ({ db, req, body, segments, res }) => {
  const admin = requireAdmin(db, req, body);
  const property = rejectProperty(db, admin, segments[3], body);
  await writeDb(db);
  return ok(res, { property: serializeProperty(db, property) });
};

export const suspend = async ({ db, req, body, segments, res }) => {
  const admin = requireAdmin(db, req, body);
  const result = suspendWallet(db, admin, segments[3], body);
  await writeDb(db);
  return ok(res, { wallet: result.wallet, suspendedUsers: result.users.map((user) => serializeUser(user, db)) });
};
