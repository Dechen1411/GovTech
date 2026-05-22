import {
  apiRequest,
  getAuthToken,
  type AuditLogEntry,
  type LeaseRecord,
  type ListingRecord,
  type PortfolioHolding,
  type PropertyRecord,
} from "@/lib/api";
import type { SessionUser } from "@/lib/auth";

const PRELOAD_TTL_MS = 30_000;

type ApiPreloadOptions = {
  token?: string;
};

type ApiPreloadEntry<T> = {
  expiresAt: number;
  promise: Promise<T>;
};

type UserDashboardData = {
  holdings: PortfolioHolding[];
  leases: LeaseRecord[];
  listings: ListingRecord[];
};

type AdminDashboardData = {
  auditLog: AuditLogEntry[];
  leases: LeaseRecord[];
  listings: ListingRecord[];
  properties: PropertyRecord[];
  queue: PropertyRecord[];
};

const apiPreloads = new Map<string, ApiPreloadEntry<unknown>>();

const walletForUser = (user: SessionUser | null) => user?.walletAddress || user?.wallet || "";

const apiPreloadKey = (path: string, options: ApiPreloadOptions = {}) => `${path}::${options.token || ""}`;

const getPreload = <T>(path: string, options: ApiPreloadOptions = {}) => {
  const key = apiPreloadKey(path, options);
  const preload = apiPreloads.get(key);

  if (!preload || preload.expiresAt < Date.now()) {
    apiPreloads.delete(key);
    return null;
  }

  return preload as ApiPreloadEntry<T>;
};

export const preloadApi = <T>(path: string, options: ApiPreloadOptions = {}) => {
  const key = apiPreloadKey(path, options);
  const existing = getPreload<T>(path, options);

  if (existing) {
    return existing.promise;
  }

  const promise = apiRequest<T>(path, options).catch((error) => {
    apiPreloads.delete(key);
    throw error;
  });

  apiPreloads.set(key, {
    expiresAt: Date.now() + PRELOAD_TTL_MS,
    promise,
  });

  return promise;
};

export const consumePreloadedApi = async <T>(path: string, options: ApiPreloadOptions = {}) => {
  const preload = getPreload<T>(path, options);

  if (preload) {
    try {
      return await preload.promise;
    } catch {
      // If a speculative request failed, let the real page load make one fresh attempt.
    }
  }

  return apiRequest<T>(path, options);
};

export const preloadPublicRegistry = () => {
  void preloadApi<{ listings: ListingRecord[] }>("/api/listings").catch(() => undefined);
};

export const loadPublicRegistry = () => consumePreloadedApi<{ listings?: ListingRecord[] }>("/api/listings");

export const preloadUserDashboardData = (user: SessionUser | null) => {
  const wallet = walletForUser(user);
  const token = getAuthToken(user);

  if (!wallet) {
    return Promise.resolve();
  }

  return Promise.all([
    preloadApi<{ listings: ListingRecord[] }>("/api/listings"),
    preloadApi<{ holdings: PortfolioHolding[]; leases: LeaseRecord[] }>(`/api/portfolio/${wallet}`, { token }),
  ])
    .then(() => undefined)
    .catch(() => undefined);
};

export const loadUserDashboardData = async (user: SessionUser | null, preferPreload = true): Promise<UserDashboardData> => {
  const wallet = walletForUser(user);
  const token = getAuthToken(user);

  if (!wallet) {
    return { holdings: [], leases: [], listings: [] };
  }

  const request = preferPreload ? consumePreloadedApi : apiRequest;
  const [listingData, portfolioData] = await Promise.all([
    request<{ listings: ListingRecord[] }>("/api/listings"),
    request<{ holdings: PortfolioHolding[]; leases: LeaseRecord[] }>(`/api/portfolio/${wallet}`, { token }),
  ]);

  return {
    holdings: portfolioData.holdings || [],
    leases: portfolioData.leases || [],
    listings: listingData.listings || [],
  };
};

export const preloadAdminDashboardData = (user: SessionUser | null) => {
  const token = getAuthToken(user);

  if (!token) {
    return Promise.resolve();
  }

  return Promise.all([
    preloadApi<{ properties: PropertyRecord[] }>("/api/properties"),
    preloadApi<{ queue: PropertyRecord[] }>("/api/admin/review-queue", { token }),
    preloadApi<{ listings: ListingRecord[] }>("/api/listings?status=ALL"),
    preloadApi<{ leases: LeaseRecord[] }>("/api/leases?status=ALL", { token }),
    preloadApi<{ auditLog: AuditLogEntry[] }>("/api/audit-log", { token }),
  ])
    .then(() => undefined)
    .catch(() => undefined);
};

export const loadAdminDashboardData = async (user: SessionUser | null, preferPreload = true): Promise<AdminDashboardData> => {
  const token = getAuthToken(user);

  if (!token) {
    return { auditLog: [], leases: [], listings: [], properties: [], queue: [] };
  }

  const request = preferPreload ? consumePreloadedApi : apiRequest;
  const [propertyData, queueData, listingData, leaseData, auditData] = await Promise.all([
    request<{ properties: PropertyRecord[] }>("/api/properties"),
    request<{ queue: PropertyRecord[] }>("/api/admin/review-queue", { token }),
    request<{ listings: ListingRecord[] }>("/api/listings?status=ALL"),
    request<{ leases: LeaseRecord[] }>("/api/leases?status=ALL", { token }),
    request<{ auditLog: AuditLogEntry[] }>("/api/audit-log", { token }),
  ]);

  return {
    auditLog: auditData.auditLog || [],
    leases: leaseData.leases || [],
    listings: listingData.listings || [],
    properties: propertyData.properties || [],
    queue: queueData.queue || [],
  };
};

export const preloadWorkspaceData = (user: SessionUser | null) => {
  if (user?.role === "admin") {
    return preloadAdminDashboardData(user);
  }

  return preloadUserDashboardData(user);
};
