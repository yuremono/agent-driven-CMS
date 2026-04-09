import assert from "node:assert/strict";
import test from "node:test";

import {
  applyAssistantDelta,
  beginAssistantMessage,
  completeAssistantMessage,
  createTranscriptRuntime,
} from "../app/components/useBridgeSession.js";

function latestAssistant(conversation) {
  for (let index = conversation.length - 1; index >= 0; index -= 1) {
    const entry = conversation[index];
    if (entry.role === "assistant") return entry;
  }
  return null;
}

test("delta only accumulates streaming text on the same assistant entry", () => {
  const runtime = createTranscriptRuntime();
  let conversation = [];

  conversation = beginAssistantMessage(conversation, runtime, { turnId: "turn-1" });
  conversation = applyAssistantDelta(conversation, runtime, {
    turnId: "turn-1",
    delta: "Hello",
  });
  conversation = applyAssistantDelta(conversation, runtime, {
    turnId: "turn-1",
    delta: " world",
  });

  const assistant = latestAssistant(conversation);
  assert.equal(conversation.length, 1);
  assert.equal(assistant?.text, "Hello world");
  assert.equal(assistant?.status, "streaming");
});

test("delta followed by completed keeps the final assistant text", () => {
  const runtime = createTranscriptRuntime();
  let conversation = [];

  conversation = beginAssistantMessage(conversation, runtime, { turnId: "turn-2" });
  conversation = applyAssistantDelta(conversation, runtime, {
    turnId: "turn-2",
    delta: "Hello",
  });
  conversation = applyAssistantDelta(conversation, runtime, {
    turnId: "turn-2",
    delta: " world",
  });
  conversation = completeAssistantMessage(conversation, runtime, {
    turnId: "turn-2",
    text: "Hello world!",
  });

  const assistant = latestAssistant(conversation);
  assert.equal(conversation.length, 1);
  assert.equal(assistant?.text, "Hello world!");
  assert.equal(assistant?.status, "complete");
});

test("completed first wins over later deltas for the same turn", () => {
  const runtime = createTranscriptRuntime();
  let conversation = [];

  conversation = completeAssistantMessage(conversation, runtime, {
    turnId: "turn-3",
    text: "Complete answer",
  });
  conversation = applyAssistantDelta(conversation, runtime, {
    turnId: "turn-3",
    delta: " late fragment",
  });

  const assistant = latestAssistant(conversation);
  assert.equal(conversation.length, 1);
  assert.equal(assistant?.text, "Complete answer");
  assert.equal(assistant?.status, "complete");
});

test("replayed completed events do not create stale duplicate assistant text", () => {
  const runtime = createTranscriptRuntime();
  let conversation = [];

  conversation = beginAssistantMessage(conversation, runtime, { turnId: "turn-4" });
  conversation = applyAssistantDelta(conversation, runtime, {
    turnId: "turn-4",
    delta: "First half",
  });
  conversation = completeAssistantMessage(conversation, runtime, {
    turnId: "turn-4",
    text: "First half plus end",
  });
  conversation = applyAssistantDelta(conversation, runtime, {
    turnId: "turn-4",
    delta: " ignored replay",
  });
  conversation = completeAssistantMessage(conversation, runtime, {
    turnId: "turn-4",
    text: "First half plus end",
  });

  const assistant = latestAssistant(conversation);
  assert.equal(conversation.length, 1);
  assert.equal(assistant?.text, "First half plus end");
  assert.equal(assistant?.status, "complete");
});

test("pending assistant placeholder accepts deltas and completion", () => {
  const runtime = createTranscriptRuntime();
  runtime.pendingAssistantId = runtime.nextId++;
  let conversation = [
    {
      id: runtime.pendingAssistantId,
      role: "assistant",
      text: "",
      status: "streaming",
    },
  ];

  conversation = applyAssistantDelta(conversation, runtime, {
    turnId: "turn-5",
    delta: "streamed ",
  });
  conversation = applyAssistantDelta(conversation, runtime, {
    turnId: "turn-5",
    delta: "text",
  });
  conversation = completeAssistantMessage(conversation, runtime, {
    turnId: "turn-5",
    text: "streamed text",
  });

  const assistant = latestAssistant(conversation);
  assert.equal(conversation.length, 1);
  assert.equal(assistant?.text, "streamed text");
  assert.equal(assistant?.status, "complete");
});
