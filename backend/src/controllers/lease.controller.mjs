import { writeDb } from "../db/store.mjs";
import { serializeLease } from "../models/lease.model.mjs";
import { requireUser } from "../services/auth.service.mjs";
import { closeLease, createLease, listLeases } from "../services/lease.service.mjs";
import { created, ok } from "../utils/http.mjs";

export const list = ({ db, requestUrl, res }) => ok(res, { leases: listLeases(db, requestUrl.searchParams).map((lease) => serializeLease(db, lease)) });

export const create = async ({ db, req, body, res }) => {
  const user = requireUser(db, req, body);
  const lease = await createLease(db, user, body);
  await writeDb(db);
  return created(res, { lease: serializeLease(db, lease) });
};

export const complete = async ({ db, req, body, segments, res }) => {
  const user = requireUser(db, req, body);
  const lease = await closeLease(db, user, segments[2], "complete");
  await writeDb(db);
  return ok(res, { lease: serializeLease(db, lease) });
};

export const cancel = async ({ db, req, body, segments, res }) => {
  const user = requireUser(db, req, body);
  const lease = await closeLease(db, user, segments[2], "cancel");
  await writeDb(db);
  return ok(res, { lease: serializeLease(db, lease) });
};
