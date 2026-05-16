import * as adminController from "../controllers/admin.controller.mjs";
import * as auditController from "../controllers/audit.controller.mjs";
import * as authController from "../controllers/auth.controller.mjs";
import * as chainController from "../controllers/chain.controller.mjs";
import * as documentController from "../controllers/document.controller.mjs";
import * as leaseController from "../controllers/lease.controller.mjs";
import * as listingController from "../controllers/listing.controller.mjs";
import * as orderController from "../controllers/order.controller.mjs";
import * as propertyController from "../controllers/property.controller.mjs";
import * as walletController from "../controllers/wallet.controller.mjs";
import { httpError } from "../utils/errors.mjs";

export const routeApi = (ctx) => {
  const { method, segments } = ctx;
  const path = segments.join("/");

  if (method === "POST" && path === "api/auth/ndi/start") return authController.startNdi(ctx);
  if (method === "GET" && segments[1] === "auth" && segments[2] === "ndi" && segments[3] === "status" && segments[4]) {
    return authController.ndiStatus(ctx);
  }
  if (method === "GET" && path === "api/auth/me") return authController.me(ctx);

  if (method === "GET" && path === "api/chain/status") return chainController.status(ctx);

  if (method === "POST" && path === "api/wallet/challenge") return walletController.challenge(ctx);
  if (method === "POST" && path === "api/wallet/verify") return walletController.verify(ctx);

  if (method === "GET" && path === "api/properties") return propertyController.listProperties(ctx);
  if (method === "POST" && path === "api/properties") return propertyController.createProperty(ctx);
  if (method === "GET" && segments[1] === "properties" && segments[2] && segments[3] === "history") return propertyController.history(ctx);
  if (method === "PATCH" && segments[1] === "properties" && segments[2] && segments[3] === "transfer") return propertyController.transfer(ctx);
  if (method === "PATCH" && segments[1] === "properties" && segments[2] && segments[3] === "buy") return propertyController.legacyBuy(ctx);

  if (method === "GET" && path === "api/listings") return listingController.list(ctx);
  if (method === "POST" && path === "api/listings") return listingController.create(ctx);
  if (method === "PATCH" && segments[1] === "listings" && segments[2] && segments[3] === "cancel") return listingController.cancel(ctx);

  if (method === "POST" && path === "api/orders") return orderController.create(ctx);
  if (method === "GET" && segments[1] === "portfolio" && segments[2]) return orderController.portfolio(ctx);

  if (method === "GET" && path === "api/leases") return leaseController.list(ctx);
  if (method === "POST" && path === "api/leases") return leaseController.create(ctx);
  if (method === "PATCH" && segments[1] === "leases" && segments[2] && segments[3] === "complete") return leaseController.complete(ctx);
  if (method === "PATCH" && segments[1] === "leases" && segments[2] && segments[3] === "cancel") return leaseController.cancel(ctx);

  if (method === "POST" && path === "api/documents/submit") return documentController.submit(ctx);

  if (method === "GET" && path === "api/admin/review-queue") return adminController.queue(ctx);
  if (method === "POST" && segments[1] === "admin" && segments[2] === "properties" && segments[3] && segments[4] === "approve") {
    return adminController.approve(ctx);
  }
  if (method === "POST" && segments[1] === "admin" && segments[2] === "properties" && segments[3] && segments[4] === "reject") {
    return adminController.reject(ctx);
  }
  if (method === "POST" && segments[1] === "admin" && segments[2] === "wallets" && segments[3] && segments[4] === "suspend") {
    return adminController.suspend(ctx);
  }

  if (method === "GET" && path === "api/audit-log") return auditController.list(ctx);

  throw httpError(404, "Unknown API route");
};
