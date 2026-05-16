import { asTokenId } from "../utils/values.mjs";
import { propertyHistory, topHolder } from "./ledger.model.mjs";

export const serializeProperty = (db, property) => {
  const tokenId = property.tokenId ? asTokenId(property.tokenId) : "";
  return {
    ...property,
    id: tokenId || property._id,
    tokenId,
    documentHash: property.docHash,
    verified: ["APPROVED", "LISTED", "SOLD"].includes(property.status),
    ownerWallet: property.ownerWallet || (tokenId ? topHolder(db, tokenId) : ""),
    updatedAt: property.updatedAt || property.approvedAt || property.submittedAt,
    ownershipTrail: tokenId ? propertyHistory(db, tokenId) : [],
  };
};
