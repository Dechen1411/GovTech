import { ok } from "../utils/http.mjs";

export const list = ({ db, res }) => ok(res, { auditLog: db.auditLog.slice(0, 100) });
