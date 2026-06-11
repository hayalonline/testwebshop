import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let shuttingDown = false;

const processes = [
  {
    name: "api",
    command: process.execPath,
    args: ["server/index.js"],
    env: { ...process.env, PORT: process.env.PORT || "3001" }
  },
  {
    name: "web",
    command: process.execPath,
    args: ["node_modules/vite/bin/vite.js", "--host", "0.0.0.0"],
    env: process.env
  }
];

const children = processes.map(({ name, command, args, env }) => {
  const child = spawn(command, args, {
    cwd: root,
    env,
    stdio: ["inherit", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => process.stdout.write(`[${name}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${name}] ${chunk}`));
  child.on("exit", (code) => {
    if (code && !shuttingDown) {
      console.error(`[${name}] gestopt met exitcode ${code}`);
      shutdown(code);
    }
  });

  return child;
});

function shutdown(code = 0) {
  shuttingDown = true;
  children.forEach((child) => {
    if (!child.killed) child.kill();
  });
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
