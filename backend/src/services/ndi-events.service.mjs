import { StringCodec, connect, nkeyAuthenticator } from "nats";
import { NDI_NATS_NKEY_SEED, NDI_NATS_URL, USE_NDI_NATS } from "../config/constants.mjs";
import { readDb, writeDb } from "../db/store.mjs";
import { createOrUpdateUserFromNdiPayload } from "./auth.service.mjs";

let subscriberStarted = false;

export const startNdiNatsSubscriber = async () => {
  if (subscriberStarted || !USE_NDI_NATS) {
    return;
  }

  subscriberStarted = true;
  const codec = StringCodec();
  const nc = await connect({
    servers: [NDI_NATS_URL],
    authenticator: nkeyAuthenticator(new TextEncoder().encode(NDI_NATS_NKEY_SEED)),
  });

  console.log(`Bhutan NDI NATS subscriber connected to ${NDI_NATS_URL}`);
  const sub = nc.subscribe(">");

  void (async () => {
    for await (const msg of sub) {
      try {
        const payload = JSON.parse(codec.decode(msg.data));
        const threadId = payload.pattern || payload.data?.thid;
        if (!threadId) {
          continue;
        }

        const db = await readDb();
        const user = createOrUpdateUserFromNdiPayload(db, threadId, payload);
        if (user) {
          await writeDb(db);
          console.log(`Bhutan NDI proof validated for thread ${threadId}`);
        }
      } catch (error) {
        console.error(`Unable to process Bhutan NDI event: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  })();
};
