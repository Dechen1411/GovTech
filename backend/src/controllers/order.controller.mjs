import { writeDb } from "../db/store.mjs";
import { serializeListing } from "../models/listing.model.mjs";
import { serializeLease } from "../models/lease.model.mjs";
import { serializeProperty } from "../models/property.model.mjs";
import { requireUser } from "../services/auth.service.mjs";
import { createOrder, portfolioForWallet } from "../services/order.service.mjs";
import { created, ok } from "../utils/http.mjs";

export const create = async ({ db, req, body, res }) => {
  const user = requireUser(db, req, body);
  const { order, listing, txHash } = createOrder(db, user, body);
  await writeDb(db);
  return created(res, { order, listing: serializeListing(db, listing), txHash });
};

export const portfolio = ({ db, segments, res }) => {
  const portfolioData = portfolioForWallet(db, segments[2]);
  return ok(res, {
    wallet: portfolioData.wallet,
    holdings: portfolioData.holdings.map((holding) => ({
      ...holding,
      property: holding.property ? serializeProperty(db, holding.property) : null,
    })),
    listings: portfolioData.listings.map((listing) => serializeListing(db, listing)),
    orders: portfolioData.orders,
    leases: portfolioData.leases.map((lease) => serializeLease(db, lease)),
  });
};
