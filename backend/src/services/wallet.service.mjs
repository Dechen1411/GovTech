import { verifyMessage } from "ethers";
import { httpError } from "../utils/errors.mjs";
import { isAdminWallet, isWallet, makeId, normalizeWallet, now, randomNonce } from "../utils/values.mjs";
import { audit } from "./audit.service.mjs";
import { setVerifiedWalletOnChain } from "./chain.service.mjs";

export const isVerifiedWallet = (db, wallet) => {
  const normalizedWallet = normalizeWallet(wallet);
  return isWallet(normalizedWallet) && db.verifiedWallets?.[normalizedWallet] === true;
};

export const setVerifiedWallet = (db, wallet, verified = true) => {
  const normalizedWallet = normalizeWallet(wallet);
  if (!isWallet(normalizedWallet)) {
    throw httpError(400, "A valid wallet address is required for verification");
  }

  db.verifiedWallets = db.verifiedWallets ?? {};
  db.verifiedWallets[normalizedWallet] = Boolean(verified);
  return db.verifiedWallets[normalizedWallet];
};

export const createWalletChallenge = (db, user, wallet) => {
  const walletAddress = normalizeWallet(wallet);
  if (!isWallet(walletAddress)) {
    throw httpError(400, "A valid wallet address is required");
  }

  const challenge = {
    challengeId: makeId("CHAL"),
    holderDid: user.holderDid,
    walletAddress,
    challenge: `Smart Property Platform wallet link\nHolder: ${user.holderDid}\nNonce: ${randomNonce(16)}`,
    status: "PENDING",
    createdAt: now(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };

  db.walletChallenges.unshift(challenge);
  return challenge;
};

export const verifyWalletChallenge = async (db, user, body = {}) => {
  const challenge = db.walletChallenges.find((item) => item.challengeId === body.challengeId && item.holderDid === user.holderDid);
  if (!challenge) {
    throw httpError(404, "Unknown wallet challenge");
  }

  if (new Date(challenge.expiresAt).getTime() < Date.now()) {
    challenge.status = "EXPIRED";
    throw httpError(400, "Wallet challenge expired");
  }

  if (!body.signature || String(body.signature).length < 8) {
    throw httpError(400, "Wallet signature is required");
  }

  const walletAddress = normalizeWallet(challenge.walletAddress);
  let recoveredAddress = "";
  try {
    recoveredAddress = normalizeWallet(verifyMessage(challenge.challenge, String(body.signature)));
  } catch {
    throw httpError(400, "Wallet signature could not be verified");
  }

  if (recoveredAddress !== walletAddress) {
    throw httpError(403, "Wallet signature does not match the selected wallet");
  }

  const chainVerification = await setVerifiedWalletOnChain(walletAddress, true);

  challenge.status = "VERIFIED";
  challenge.signature = String(body.signature);
  challenge.verifiedAt = now();
  user.walletAddress = walletAddress;
  user.role = isAdminWallet(user.walletAddress) ? "admin" : "user";
  setVerifiedWallet(db, user.walletAddress, true);
  audit(db, user.holderDid, "WALLET_LINKED", user.walletAddress, {
    challengeId: challenge.challengeId,
    onChainEligible: true,
    chainTxHash: chainVerification?.txHash || null,
  });

  return user;
};
