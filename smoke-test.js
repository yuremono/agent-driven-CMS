import { spawn } from "node:child_process";
import readline from "node:readline";

// Codex app-server 専用の smoke test。Claude Code は起動方式が異なるため別扱いにする。
const proc = spawn("codex", ["app-server"], {
  stdio: ["pipe", "pipe", "inherit"],
});

const rl = readline.createInterface({ input: proc.stdout });
const timeout = setTimeout(() => {
  console.error("Smoke test timed out.");
  proc.kill("SIGINT");
  process.exitCode = 1;
  process.exit(1);
}, 20000);

function send(message) {
  proc.stdin.write(JSON.stringify(message) + "\n");
}

let initialized = false;
let threadId = null;
let turnStarted = false;

function maybeStartTurn() {
  if (threadId && !turnStarted) {
    turnStarted = true;
    send({
      method: "turn/start",
      id: 2,
      params: {
        threadId,
        input: [{ type: "text", text: "Summarize this repo." }],
      },
    });
  }
}

rl.on("line", (line) => {
  console.log("SERVER:", line);

  const msg = JSON.parse(line);
  if (msg.method === "turn/completed") {
    clearTimeout(timeout);
    proc.kill("SIGINT");
    process.exit(0);
  }

  if (msg.id === 0 && msg.result && !initialized) {
    initialized = true;
    send({ method: "initialized", params: {} });
    send({
      method: "thread/start",
      id: 1,
      params: { model: "gpt-5.4-mini" },
    });
  }

  if (msg.method === "thread/started" && msg.params?.thread?.id && !threadId) {
    threadId = msg.params.thread.id;
    maybeStartTurn();
  }

  if (msg.id === 1 && msg.result?.thread?.id && !threadId) {
    threadId = msg.result.thread.id;
    maybeStartTurn();
  }
});

send({
  jsonrpc: "2.0",
  id: 0,
  method: "initialize",
  params: {
    clientInfo: {
      name: "agent_driven_cms",
      title: "Agent Driven CMS",
      version: "0.1.0",
    },
  },
});
