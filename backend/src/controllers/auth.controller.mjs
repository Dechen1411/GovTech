import { writeDb } from "../db/store.mjs";
import { serializeUser } from "../models/user.model.mjs";
import { audit } from "../services/audit.service.mjs";
import { createNdiProofRequest, getUserBySession, requireUser } from "../services/auth.service.mjs";
import { httpError } from "../utils/errors.mjs";
import { created, ok } from "../utils/http.mjs";
import { now } from "../utils/values.mjs";

export const startNdi = async ({ db, body, res }) => {
  const role = "user";
  const proof = await createNdiProofRequest(role);
  const pending = {
    threadId: proof.proofRequestThreadId,
    proofRequestURL: proof.proofRequestURL,
    deepLinkURL: proof.deepLinkURL,
    role,
    status: "PENDING",
    createdAt: now(),
    expiresAt: proof.expiresAt,
  };
  db.pendingSessions.unshift(pending);
  audit(db, "anonymous", "NDI_PROOF_REQUEST_CREATED", pending.threadId, { role });
  await writeDb(db);
  return created(res, pending);
};

export const ndiStatus = ({ db, segments, res }) => {
  const pending = db.pendingSessions.find((session) => session.threadId === segments[4]);
  if (!pending) {
    throw httpError(404, "Unknown proof request");
  }
  const user = pending.sessionToken ? getUserBySession(db, pending.sessionToken) : null;
  return ok(res, { ...pending, user: user ? serializeUser(user, db) : null });
};

export const me = ({ db, req, body, res }) => {
  const user = requireUser(db, req, body);
  return ok(res, { user: serializeUser(user, db) });
};
