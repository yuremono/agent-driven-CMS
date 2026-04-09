import { spawn } from "node:child_process";
import readline from "node:readline";

const timeout = setTimeout(() => {
  console.error("Claude smoke test timed out.");
  process.exit(1);
}, 30000);

function readAuthStatus() {
  return new Promise((resolve, reject) => {
    const proc = spawn("claude", ["auth", "status", "--json"], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    proc.on("error", reject);
    proc.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `claude auth status failed (${code})`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function main() {
  const authStatus = await readAuthStatus();
  if (!authStatus?.loggedIn) {
    throw new Error("Claude Code is not logged in. Run `claude auth login` first.");
  }

  const proc = spawn(
    "claude",
    [
      "-p",
      "--output-format",
      "stream-json",
      "--verbose",
      "--include-partial-messages",
      "--permission-mode",
      "acceptEdits",
      "Reply with exactly OK.",
    ],
    {
      stdio: ["ignore", "pipe", "inherit"],
    },
  );

  const rl = readline.createInterface({ input: proc.stdout });
  let succeeded = false;

  rl.on("line", (line) => {
    console.log("CLAUDE:", line);
    const payload = JSON.parse(line);
    if (payload.type === "result" && payload.subtype === "success") {
      const text = String(payload.result ?? "").trim();
      if (text === "OK") {
        succeeded = true;
      }
    }
  });

  proc.on("error", (error) => {
    clearTimeout(timeout);
    throw error;
  });

  proc.on("exit", (code) => {
    clearTimeout(timeout);
    if (code !== 0 || !succeeded) {
      console.error("Claude smoke test failed.");
      process.exit(code || 1);
      return;
    }

    console.log("Claude smoke test passed.");
    process.exit(0);
  });
}

main().catch((error) => {
  clearTimeout(timeout);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
