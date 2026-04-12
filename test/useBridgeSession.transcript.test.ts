import assert from "node:assert/strict";
import test from "node:test";

import {
  applyAssistantDelta,
  beginAssistantMessage,
  completeAssistantMessage,
  createTranscriptRuntime,
  restoreTranscriptRuntime,
  serializeTranscriptRuntime,
} from "../app/components/useBridgeSession";

type TranscriptEntry = {
  id: number;
  role: "assistant" | "user";
  text: string;
  status: "complete" | "error" | "streaming";
};

function latestAssistant(conversation: TranscriptEntry[]) {
  for (let index = conversation.length - 1; index >= 0; index -= 1) {
    const entry = conversation[index];
    if (entry.role === "assistant") return entry;
  }
  return null;
}

test("delta only accumulates streaming text on the same assistant entry", () => {
  const runtime = createTranscriptRuntime();
  let conversation: TranscriptEntry[] = [];

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
  let conversation: TranscriptEntry[] = [];

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
  assert.equal(conversation.length, 2);
  assert.equal(assistant?.text, "Hello world!");
  assert.equal(assistant?.status, "complete");
  assert.equal(conversation[0].status, "streaming");
  assert.equal(conversation[1].status, "complete");
});

test("completed first wins over later deltas for the same turn", () => {
  const runtime = createTranscriptRuntime();
  let conversation: TranscriptEntry[] = [];

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
  let conversation: TranscriptEntry[] = [];

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
  assert.equal(conversation.length, 2);
  assert.equal(assistant?.text, "First half plus end");
  assert.equal(assistant?.status, "complete");
});

test("pending assistant placeholder accepts deltas and completion", () => {
  const runtime = createTranscriptRuntime();
  runtime.pendingAssistantId = runtime.nextId++;
  let conversation: TranscriptEntry[] = [
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
  assert.equal(conversation.length, 2);
  assert.equal(assistant?.text, "streamed text");
  assert.equal(assistant?.status, "complete");
  assert.equal(conversation[0].status, "streaming");
  assert.equal(conversation[1].status, "complete");
});

test("restored runtime keeps completed turn guard after reload", () => {
  const runtime = createTranscriptRuntime();
  let conversation: TranscriptEntry[] = [];

  conversation = beginAssistantMessage(conversation, runtime, { turnId: "turn-6" });
  conversation = completeAssistantMessage(conversation, runtime, {
    turnId: "turn-6",
    text: "Already done",
  });

  const restoredRuntime = restoreTranscriptRuntime(
    serializeTranscriptRuntime(runtime),
    conversation,
  );
  conversation = applyAssistantDelta(conversation, restoredRuntime, {
    turnId: "turn-6",
    delta: " late fragment",
  });

  const assistant = latestAssistant(conversation);
  assert.equal(conversation.length, 2);
  assert.equal(assistant?.text, "Already done");
  assert.equal(assistant?.status, "complete");
});

test("restored runtime keeps pending assistant placeholder after reload", () => {
  const runtime = createTranscriptRuntime();
  runtime.pendingAssistantId = runtime.nextId++;
  const assistantId = runtime.pendingAssistantId as number;
  let conversation: TranscriptEntry[] = [
    {
      id: assistantId,
      role: "assistant",
      text: "",
      status: "streaming",
    },
  ];

  const restoredRuntime = restoreTranscriptRuntime(
    serializeTranscriptRuntime(runtime),
    conversation,
  );
  conversation = applyAssistantDelta(conversation, restoredRuntime, {
    turnId: "turn-7",
    delta: "continued",
  });

  const assistant = latestAssistant(conversation);
  assert.equal(conversation.length, 1);
  assert.equal(assistant?.id, assistantId);
  assert.equal(assistant?.text, "continued");
  assert.equal(assistant?.status, "streaming");
});
