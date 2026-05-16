import { SHARES_PER_PROPERTY } from "../config/constants.mjs";
import { asTokenId } from "../utils/values.mjs";
import { balanceOf, holderCount } from "./ledger.model.mjs";
import { serializeProperty } from "./property.model.mjs";

export const serializeListing = (db, listing) => {
  const property = db.properties.find((item) => item.tokenId === asTokenId(listing.tokenId));
  const totalSupply = Number(property?.totalSupply ?? SHARES_PER_PROPERTY);
  return {
    ...listing,
    property: property ? serializeProperty(db, property) : null,
    sellerBalance: balanceOf(db, listing.sellerWallet, listing.tokenId),
    holderCount: holderCount(db, listing.tokenId),
    ownershipPercentForSale: Number(((listing.sharesForSale / totalSupply) * 100).toFixed(2)),
    totalAsk: listing.sharesForSale * listing.pricePerShare,
  };
};
