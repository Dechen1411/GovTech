export type UserRole = "user" | "admin";

export type SessionUser = {
  role: UserRole;
  holderDid: string;
  idNumberDisplay: string;
  fullName?: string;
  sessionToken: string;
  walletAddress: string;
  wallet: string;
  walletVerified?: boolean;
  walletProvider?: string;
  privyWalletId?: string;
  walletVerifiedAt?: string;
  adminWalletAddress?: string;
  adminWalletVerifiedAt?: string;
  displayName: string;
  ndiProofThreadId?: string;
  ndiVerifiedAt?: string;
  suspended?: boolean;
};

let sessionUser: SessionUser | null = null;

export const getSessionUser = (): SessionUser | null => {
  return sessionUser;
};

export const setSessionUser = (user: SessionUser) => {
  sessionUser = {
    ...user,
    wallet: user.wallet || user.walletAddress || "",
  };
};

export const clearSessionUser = () => {
  sessionUser = null;
};
