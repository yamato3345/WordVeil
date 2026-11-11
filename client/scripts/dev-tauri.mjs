import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// Let Vite report an occupied port instead of killing another process.
const vitePath = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
const vite = spawn(process.execPath, [vitePath, "--host", "127.0.0.1"], { stdio: "inherit" });

const forwardSignal = (signal) => {
  if (!vite.killed) {
    vite.kill(signal);
  }
};

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));

vite.on("exit", (code) => {
  process.exit(code ?? 0);
});
