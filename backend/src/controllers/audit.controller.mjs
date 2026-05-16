import { requireAdmin } from "../services/auth.service.mjs";
import { ok } from "../utils/http.mjs";

export const list = ({ db, req, body, res }) => {
  requireAdmin(db, req, body);
  return ok(res, { auditLog: db.auditLog.slice(0, 100) });
};
