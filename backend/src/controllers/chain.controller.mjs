import { getChainStatus } from "../services/chain.service.mjs";
import { ok } from "../utils/http.mjs";

export const status = async ({ res }) => ok(res, await getChainStatus());
