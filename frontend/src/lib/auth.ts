export type UserRole = "user" | "admin";

export type SessionUser = {
  role: UserRole;
  holderDid: string;
  idNumberDisplay: string;
  sessionToken: string;
  walletAddress: string;
  wallet: string;
  walletVerified?: boolean;
  displayName: string;
  ndiProofThreadId?: string;
  ndiVerifiedAt?: string;
  suspended?: boolean;
};

const SESSION_KEY = "smart-property-session";

export const getSessionUser = (): SessionUser | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
};

export const setSessionUser = (user: SessionUser) => {
  window.localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      ...user,
      wallet: user.wallet || user.walletAddress || "",
    }),
  );
};

export const clearSessionUser = () => {
  window.localStorage.removeItem(SESSION_KEY);
};
