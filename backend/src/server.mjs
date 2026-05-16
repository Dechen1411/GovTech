import { createServer } from "node:http";
import { PORT } from "./config/constants.mjs";
import { handleApi } from "./app.mjs";
import { ensureDb } from "./db/store.mjs";
import { startNdiNatsSubscriber } from "./services/ndi-events.service.mjs";

void ensureDb().catch((error) => {
  console.error(`Database warmup failed: ${error instanceof Error ? error.message : "Unknown database error"}`);
});

void startNdiNatsSubscriber().catch((error) => {
  console.error(`Bhutan NDI NATS startup failed: ${error instanceof Error ? error.message : "Unknown NDI transport error"}`);
});

createServer((req, res) => {
  void handleApi(req, res);
}).listen(PORT, () => {
  console.log(`Smart Property Platform API listening on http://localhost:${PORT}`);
});
