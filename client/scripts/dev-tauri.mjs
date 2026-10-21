import { execSync, spawn } from "node:child_process";

function freePort1430() {
  try {
    const output = execSync("lsof -ti:1430", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();

    if (!output) {
      return;
    }

    const pids = output
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean)
      .join(" ");

    if (pids) {
      execSync(`kill -9 ${pids}`, { stdio: "ignore" });
    }
  } catch {
    // No process bound to port 1430 or lsof unavailable; continue startup.
  }
}

freePort1430();

const vite = spawn("vite", { stdio: "inherit", shell: true });

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
