import { createHash, randomBytes, randomUUID } from "node:crypto";
import { ADMIN_WALLET_ADDRESSES, roleSet, seedWallets, walletAddressRegex } from "../config/constants.mjs";

export const now = () => new Date().toISOString();
export const asTokenId = (value) => String(value ?? "").trim();
export const normalizeWallet = (wallet) => String(wallet ?? "").trim().toLowerCase();
export const normalizeRole = (role) => (role === "admin" ? "admin" : "user");
export const isSupportedRole = (role) => roleSet.has(role);
export const isWallet = (wallet) => walletAddressRegex.test(String(wallet ?? ""));
export const isAdminWallet = (wallet) => ADMIN_WALLET_ADDRESSES.includes(normalizeWallet(wallet));
export const seededVerifiedWallets = () =>
  Object.fromEntries([...Object.values(seedWallets), ...ADMIN_WALLET_ADDRESSES].map((wallet) => [normalizeWallet(wallet), true]));
export const sha256Hex = (value) => `0x${createHash("sha256").update(String(value)).digest("hex")}`;
export const randomHex = (bytes = 32) => `0x${randomBytes(bytes).toString("hex")}`;
export const randomNonce = (bytes = 16) => randomBytes(bytes).toString("hex");
export const randomSessionToken = () => `spp_${randomBytes(24).toString("hex")}`;
export const randomThreadId = () => randomUUID();
export const makeId = (prefix) => `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
