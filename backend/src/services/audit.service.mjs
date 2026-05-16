import { makeId, now } from "../utils/values.mjs";

export const audit = (db, actor, action, target, metadata = {}) => {
  db.auditLog.unshift({
    id: makeId("AUD"),
    actor: actor || "system",
    action,
    target,
    timestamp: now(),
    metadata,
  });
};
