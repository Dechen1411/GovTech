import { normalizeRole } from "../utils/values.mjs";
import { isVerifiedWallet } from "../services/wallet.service.mjs";

export const serializeUser = (user, db = null) => {
  const role = normalizeRole(user.role);
  const fullName = String(user.fullName || "").trim();

  return {
    holderDid: user.holderDid,
    idNumberDisplay: user.idNumberDisplay,
    fullName,
    walletAddress: user.walletAddress || "",
    wallet: user.walletAddress || "",
    walletVerified: db ? isVerifiedWallet(db, user.walletAddress) : Boolean(user.walletAddress && user.ndiVerifiedAt),
    walletProvider: user.walletProvider || (user.walletAddress ? "privy" : ""),
    privyWalletId: user.privyWalletId || "",
    walletVerifiedAt: user.walletVerifiedAt || "",
    adminWalletAddress: user.adminWalletAddress || "",
    adminWalletVerifiedAt: user.adminWalletVerifiedAt || "",
    role,
    sessionToken: user.sessionToken,
    ndiProofThreadId: user.ndiProofThreadId,
    ndiVerifiedAt: user.ndiVerifiedAt,
    suspended: Boolean(user.suspended),
    displayName: fullName || (role === "admin" ? "Platform Admin" : "Verified User"),
  };
};
