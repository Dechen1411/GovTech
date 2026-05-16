import type { SessionUser } from "@/lib/auth";

export type PropertyStatus = "PENDING" | "APPROVED" | "LISTED" | "SOLD" | "REJECTED";
export type ListingStatus = "ACTIVE" | "PARTIALLY_SOLD" | "SOLD" | "CANCELLED";
export type ListingType = "FULL" | "PARTIAL" | "SECONDARY";

export type OwnershipTrailItem = {
  ownerWallet: string;
  fromWallet?: string;
  qty?: number;
  timestamp: string;
  txRef: string;
};

export type PropertyRecord = {
  _id: string;
  id: string;
  tokenId: string;
  title: string;
  location: string;
  threeWordLocation?: string;
  propertyType: string;
  price: string;
  imageUrl?: string;
  imageStorageRef?: string;
  imageCid?: string;
  imageName?: string;
  verified: boolean;
  docHash: string;
  documentHash: string;
  docStorageRef: string;
  docGatewayUrl?: string;
  docCid?: string;
  totalSupply: number;
  status: PropertyStatus;
  ownerWallet: string;
  submittedAt: string;
  approvedAt?: string | null;
  updatedAt: string;
  description?: string;
  requestedListingShares?: number;
  requestedPricePerShare?: number;
  rejectionNotes?: string;
  ownershipTrail: OwnershipTrailItem[];
};

export type ListingRecord = {
  id: string;
  tokenId: string;
  sharesForSale: number;
  originalShares: number;
  pricePerShare: number;
  sellerWallet: string;
  listingType: ListingType;
  status: ListingStatus;
  createdAt: string;
  property: PropertyRecord | null;
  sellerBalance: number;
  holderCount: number;
  ownershipPercentForSale: number;
  totalAsk: number;
};

export type PortfolioHolding = {
  tokenId: string;
  balance: number;
  percentage: number;
  estimatedValue: number;
  property: PropertyRecord | null;
};

export type LeaseRecord = {
  id: string;
  chainLeaseId: string;
  tokenId: string;
  lessorWallet: string;
  lesseeWallet: string;
  shareAmount: number;
  startDate: number;
  endDate: number;
  startDateIso: string;
  endDateIso: string;
  rentAmount: number;
  depositAmount: number;
  termsHash: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  txHash: string;
  closeTxHash?: string;
  notes?: string;
  createdAt: string;
  closedAt?: string;
  property: PropertyRecord | null;
};

export type AuditLogEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

type ApiOptions = RequestInit & {
  token?: string;
};

export const apiRequest = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = (await response.json().catch(() => ({}))) as T & { message?: string };

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

export const getAuthToken = (sessionUser: SessionUser | null) => sessionUser?.sessionToken || "";

export const formatNu = (amount: number) => `Nu. ${Math.round(amount).toLocaleString("en-IN")}`;

export const shortWallet = (wallet = "") => (wallet.length > 12 ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : wallet);

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read file"));
    };
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
