import { writeDb } from "../db/store.mjs";
import { serializeUser } from "../models/user.model.mjs";
import { audit } from "../services/audit.service.mjs";
import { createNdiProofRequest, getTokenFromRequest, getUserBySession, requireUser } from "../services/auth.service.mjs";
import { created, ok } from "../utils/http.mjs";
import { now } from "../utils/values.mjs";

export const startNdi = async ({ db, body, res }) => {
  const role = "user";
  const intent = body?.intent === "admin" || body?.role === "admin" ? "admin" : "user";
  const proof = await createNdiProofRequest(role, intent);
  const pending = {
    threadId: proof.proofRequestThreadId,
    proofRequestURL: proof.proofRequestURL,
    deepLinkURL: proof.deepLinkURL,
    role,
    intent,
    status: "PENDING",
    createdAt: now(),
    expiresAt: proof.expiresAt,
  };
  db.pendingSessions.unshift(pending);
  audit(db, "anonymous", "NDI_PROOF_REQUEST_CREATED", pending.threadId, { role, intent });
  await writeDb(db);
  return created(res, pending);
};

export const ndiStatus = async ({ db, segments, res }) => {
  const threadId = segments[4];
  const pending = db.pendingSessions.find((session) => session.threadId === threadId);
  if (!pending) {
    return ok(res, {
      threadId,
      proofRequestURL: "",
      deepLinkURL: "",
      role: "user",
      intent: "user",
      status: "EXPIRED",
      expiresAt: now(),
      error: "NDI login request is no longer active.",
      user: null,
    });
  }

  if (pending.status === "PENDING" && new Date(pending.expiresAt).getTime() < Date.now()) {
    pending.status = "EXPIRED";
    pending.expiredAt = now();
    pending.error = "NDI login request is no longer active.";
    audit(db, "ndi", "NDI_PROOF_EXPIRED", pending.threadId, { intent: pending.intent || "user" });
    await writeDb(db);
  }

  const user = pending.sessionToken ? getUserBySession(db, pending.sessionToken) : null;
  return ok(res, { ...pending, user: user ? serializeUser(user, db) : null });
};

export const me = ({ db, req, body, res }) => {
  const user = requireUser(db, req, body);
  return ok(res, { user: serializeUser(user, db) });
};

export const logout = async ({ db, req, body, res }) => {
  const token = getTokenFromRequest(req, body);
  const loggedOutAt = now();
  let changed = false;

  if (token) {
    const user = getUserBySession(db, token);
    if (user) {
      user.sessionToken = "";
      user.loggedOutAt = loggedOutAt;
      audit(db, user.holderDid || user.walletAddress || "anonymous", "SESSION_LOGOUT", user.walletAddress || user.holderDid || "session", {
        role: user.role || "user",
      });
      changed = true;
    }

    for (const pending of db.pendingSessions ?? []) {
      if (pending.sessionToken === token) {
        pending.sessionToken = "";
        pending.loggedOutAt = loggedOutAt;
        changed = true;
      }
    }
  }

  if (changed) {
    await writeDb(db);
  }

  return ok(res, { ok: true });
};
