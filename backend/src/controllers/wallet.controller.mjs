import { writeDb } from "../db/store.mjs";
import { serializeUser } from "../models/user.model.mjs";
import { requireUser } from "../services/auth.service.mjs";
import { createWalletChallenge, verifyWalletChallenge } from "../services/wallet.service.mjs";
import { created, ok } from "../utils/http.mjs";

export const challenge = async ({ db, req, body, res }) => {
  const user = requireUser(db, req, body);
  const walletChallenge = createWalletChallenge(db, user, body.walletAddress);
  await writeDb(db);
  return created(res, walletChallenge);
};

export const verify = async ({ db, req, body, res }) => {
  const user = requireUser(db, req, body);
  let verifiedUser;
  try {
    verifiedUser = await verifyWalletChallenge(db, user, body);
  } catch (error) {
    await writeDb(db);
    throw error;
  }
  await writeDb(db);
  return ok(res, { user: serializeUser(verifiedUser, db) });
};
