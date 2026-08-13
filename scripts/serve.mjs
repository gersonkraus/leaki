import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { startLeakiServer } from "./leaki-server.mjs";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const port = parseInt(process.env.PORT || "3030", 10);
const host = process.env.HOST || "127.0.0.1";

startLeakiServer({
  www: join(root, "www"),
  dataDir: join(root, "data"),
  port,
  host
});
