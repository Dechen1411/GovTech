import { activeLeasedShares } from "./ledger.model.mjs";
import { serializeProperty } from "./property.model.mjs";
import { asTokenId } from "../utils/values.mjs";

export const serializeLease = (db, lease) => {
  const property = db.properties.find((item) => item.tokenId === asTokenId(lease.tokenId));
  return {
    ...lease,
    property: property ? serializeProperty(db, property) : null,
    activeLeasedShares: activeLeasedShares(db, lease.lessorWallet, lease.tokenId),
  };
};
