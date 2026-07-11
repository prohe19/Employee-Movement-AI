import { createApp } from "./app";
import { env } from "./config/env";
import { closePdfEngine } from "./services/pdfService";

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`Employee Movement AI backend listening on port ${env.port} (${env.nodeEnv})`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => {
    console.log("HTTP server closed");
  });
  await closePdfEngine();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
