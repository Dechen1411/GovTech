import { readDb } from "./db/store.mjs";
import { routeApi } from "./routes/api.routes.mjs";
import {
  HAS_IPFS_DOCUMENT_CONFIG,
  USE_CHAIN,
  USE_IPFS_DOCUMENT_STORAGE,
  USE_MONGODB,
  USE_NDI,
  USE_NDI_NATS,
  USE_PRIVY,
} from "./config/constants.mjs";
import { isHttpError } from "./utils/errors.mjs";
import { notFound, ok, parseBody, send } from "./utils/http.mjs";

export const handleApi = async (req, res) => {
  if (req.method === "OPTIONS") {
    return send(res, 204, "");
  }

  const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const segments = requestUrl.pathname.split("/").filter(Boolean);
  const method = req.method ?? "GET";

  if (requestUrl.pathname === "/health") {
    return ok(res, {
      ok: true,
      service: "smart-property-backend",
      runtime: process.versions.bun ? "bun" : "node",
      storage: USE_MONGODB ? "mongodb" : "mongodb-missing-config",
      documentStorage: USE_IPFS_DOCUMENT_STORAGE ? (HAS_IPFS_DOCUMENT_CONFIG ? "ipfs" : "ipfs-missing-config") : "local-encrypted",
      chain: USE_CHAIN ? "configured" : "not-configured",
      ndi: USE_NDI ? "configured" : "not-configured",
      ndiTransport: USE_NDI_NATS ? "nats" : "none",
      walletProvider: USE_PRIVY ? "privy" : "privy-missing-config",
    });
  }

  if (segments[0] !== "api") {
    return notFound(res);
  }

  try {
    const body = ["POST", "PATCH", "DELETE"].includes(method) ? await parseBody(req) : {};
    const path = segments.join("/");
    const db = method === "GET" && path === "api/chain/status" ? null : await readDb();

    return await routeApi({ req, res, requestUrl, segments, method, db, body });
  } catch (error) {
    if (isHttpError(error)) {
      return send(res, error.status, { message: error.message, details: error.details });
    }

    console.error(error);
    return send(res, 500, { message: error instanceof Error ? error.message : "Internal server error" });
  }
};
