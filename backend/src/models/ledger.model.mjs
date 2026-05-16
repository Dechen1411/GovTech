import { asTokenId, normalizeWallet } from "../utils/values.mjs";

export const balanceOf = (db, wallet, tokenId) => {
  const normalizedWallet = normalizeWallet(wallet);
  const token = asTokenId(tokenId);
  return Number(db.balances[normalizedWallet]?.[token] ?? 0);
};

export const setBalance = (db, wallet, tokenId, value) => {
  const normalizedWallet = normalizeWallet(wallet);
  const token = asTokenId(tokenId);
  db.balances[normalizedWallet] = db.balances[normalizedWallet] ?? {};
  db.balances[normalizedWallet][token] = Math.max(0, Number(value));
};

export const holderCount = (db, tokenId) => {
  const token = asTokenId(tokenId);
  return Object.values(db.balances).filter((tokens) => Number(tokens?.[token] ?? 0) > 0).length;
};

export const topHolder = (db, tokenId) => {
  const token = asTokenId(tokenId);
  let winner = "";
  let amount = -1;
  for (const [wallet, tokens] of Object.entries(db.balances)) {
    const balance = Number(tokens?.[token] ?? 0);
    if (balance > amount) {
      winner = wallet;
      amount = balance;
    }
  }
  return winner;
};

export const activeLeasedShares = (db, wallet, tokenId) => {
  const normalizedWallet = normalizeWallet(wallet);
  const token = asTokenId(tokenId);
  return (db.leases ?? [])
    .filter(
      (lease) =>
        lease.status === "ACTIVE" &&
        normalizeWallet(lease.lessorWallet) === normalizedWallet &&
        asTokenId(lease.tokenId) === token,
    )
    .reduce((sum, lease) => sum + Number(lease.shareAmount || 0), 0);
};

export const propertyHistory = (db, tokenId) =>
  db.transferEvents
    .filter((event) => event.tokenId === asTokenId(tokenId))
    .map((event) => ({
      ownerWallet: event.toWallet,
      fromWallet: event.fromWallet,
      qty: event.qty,
      timestamp: event.timestamp,
      txRef: event.txHash,
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
