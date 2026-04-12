"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { BridgeStatus } from "../../lib/bridge";
import { fetchJson } from "../../lib/bridge-http";

type TranscriptRole = "assistant" | "user";
type TranscriptStatus = "complete" | "error" | "streaming";
type TranscriptEntry = {
  id: number;
  role: TranscriptRole;
  text: string;
  status: TranscriptStatus;
};
type TranscriptRuntime = {
  nextId: number;
  pendingAssistantId: number | null;
  assistantIdByTurnId: Map<string | number, number>;
  assistantIdByItemId: Map<string | number, number>;
  completedTurnIds: Set<string | number>;
};
type ApprovalRequest = {
  requestId: string | number;
  method: string;
  params?: Record<string, unknown>;
};
type LocalEvent = Record<string, unknown>;
type RateLimitSummary = {
  label: string;
  usedPercent: number;
  windowDurationMins: number;
  resetsAt: number;
};
type TurnPlan = {
  plan?: unknown[];
} | null;
type BridgeEventPayload = Record<string, unknown> & {
  id?: string | number;
  type?: string;
  method?: string;
  status?: BridgeStatus;
  diff?: string;
  plan?: unknown;
  params?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

const emptyStatus: BridgeStatus = {
  provider: "codex",
  providerLabel: "Codex",
  capabilities: {
    approvals: true,
    browserLogin: true,
    browserLogout: true,
    diff: true,
    plan: true,
    rateLimits: true,
  },
  availableModels: [
    { label: "gpt-5.4-mini", value: "gpt-5.4-mini" },
    { label: "gpt-5.4", value: "gpt-5.4" },
    { label: "gpt-5.3-codex", value: "gpt-5.3-codex" },
    { label: "Auto", value: "auto" },
  ],
  defaultModel: "gpt-5.4-mini",
  defaultPermissionMode: null,
  state: "idle",
  threadId: null,
  pid: null,
  error: null,
  pendingServerRequests: 0,
  authMode: null,
  accountType: null,
  accountEmail: null,
  requiresOpenaiAuth: null,
  rateLimits: null,
  initialized: false,
  ready: false,
};

function upsertByRequestId(list: ApprovalRequest[], request: ApprovalRequest) {
  const index = list.findIndex((item) => item.requestId === request.requestId);
  if (index === -1) return [request, ...list];
  const next = list.slice();
  next[index] = { ...next[index], ...request };
  return next;
}

function removeByRequestId(list: ApprovalRequest[], requestId: string | number) {
  return list.filter((item) => item.requestId !== requestId);
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

function getRateLimitSummary(rateLimits: unknown): RateLimitSummary | null {
  if (!isRecord(rateLimits) || !isRecord(rateLimits.primary)) return null;
  const primary = rateLimits.primary;
  return {
    label:
      (typeof rateLimits.limitName === "string" ? rateLimits.limitName : null) ??
      (typeof rateLimits.limitId === "string" ? rateLimits.limitId : null) ??
      "codex",
    usedPercent: typeof primary.usedPercent === "number" ? primary.usedPercent : 0,
    windowDurationMins:
      typeof primary.windowDurationMins === "number" ? primary.windowDurationMins : 0,
    resetsAt: typeof primary.resetsAt === "number" ? primary.resetsAt : 0,
  };
}

export function formatPercent(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return "n/a";
  return `${Math.round(value)}%`;
}

export function formatWindow(minutes: unknown) {
  if (typeof minutes !== "number" || Number.isNaN(minutes)) return "unknown";
  return `${minutes}分`;
}

export function formatResetAt(timestamp: unknown) {
  if (typeof timestamp !== "number" || Number.isNaN(timestamp)) return "unknown";
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp * 1000));
}

export function requestTitle(method: string | null | undefined) {
  if (method === "item/fileChange/requestApproval") return "File change approval";
  if (method === "item/commandExecution/requestApproval") return "Command approval";
  if (method === "tool/requestUserInput") return "Tool input";
  return method ?? "request";
}

export function decisionOptions(method: string | null | undefined) {
  if (method === "item/fileChange/requestApproval") {
    return ["accept", "acceptForSession", "decline", "cancel"];
  }
  if (method === "item/commandExecution/requestApproval") {
    return ["accept", "acceptForSession", "decline", "cancel"];
  }
  return [];
}

function createTranscriptEntry(
  id: number,
  role: TranscriptRole,
  text: string,
  status: TranscriptStatus,
): TranscriptEntry {
  return { id, role, text, status };
}

export function createTranscriptRuntime(): TranscriptRuntime {
  return {
    nextId: 1,
    pendingAssistantId: null,
    assistantIdByTurnId: new Map(),
    assistantIdByItemId: new Map(),
    completedTurnIds: new Set(),
  };
}

function updateEntryById(
  list: TranscriptEntry[],
  entryId: number,
  updater: (entry: TranscriptEntry) => TranscriptEntry,
) {
  const index = list.findIndex((item) => item.id === entryId);
  if (index === -1) return list;
  const next = list.slice();
  next[index] = updater(next[index]);
  return next;
}

function getLatestAssistantText(entries: TranscriptEntry[]) {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const item = entries[index];
    if (item.role === "assistant") {
      return item.text ?? "";
    }
  }
  return "";
}

function findLatestAssistantEntry(list: TranscriptEntry[], excludeComplete = false) {
  for (let index = list.length - 1; index >= 0; index -= 1) {
    const item = list[index];
    if (item.role !== "assistant") continue;
    if (item.status !== "streaming") continue;
    return item;
  }
  return null;
}

function resolveAssistantEntryId(
  runtime: TranscriptRuntime,
  conversation: TranscriptEntry[],
  turnId: string | number | null,
  itemId: string | number | null,
) {
  if (itemId != null && runtime.assistantIdByItemId.has(itemId)) {
    return runtime.assistantIdByItemId.get(itemId);
  }
  if (turnId != null && runtime.assistantIdByTurnId.has(turnId)) {
    return runtime.assistantIdByTurnId.get(turnId);
  }
  if (runtime.pendingAssistantId != null) {
    return runtime.pendingAssistantId;
  }
  return findLatestAssistantEntry(conversation, true)?.id ?? null;
}

function trackAssistantEntry(
  runtime: TranscriptRuntime,
  entryId: number,
  turnId: string | number | null,
  itemId: string | number | null,
) {
  if (turnId != null) {
    runtime.assistantIdByTurnId.set(turnId, entryId);
  }
  if (itemId != null) {
    runtime.assistantIdByItemId.set(itemId, entryId);
  }
}

export function beginAssistantMessage(
  conversation: TranscriptEntry[],
  runtime: TranscriptRuntime,
  { turnId = null, itemId = null, text = "" }: {
    turnId?: string | number | null;
    itemId?: string | number | null;
    text?: string;
  } = {},
) {
  if (turnId != null && runtime.completedTurnIds.has(turnId)) {
    return conversation;
  }

  const entryId = resolveAssistantEntryId(runtime, conversation, turnId, itemId);
  if (entryId == null) {
    const assistantId = runtime.nextId++;
    const nextConversation = [
      ...conversation,
      createTranscriptEntry(assistantId, "assistant", text, "streaming"),
    ];
    trackAssistantEntry(runtime, assistantId, turnId, itemId);
    return nextConversation;
  }

  const nextConversation = updateEntryById(conversation, entryId, (entry) => ({
    ...entry,
    text: text || entry.text || "",
    status: "streaming",
  }));
  trackAssistantEntry(runtime, entryId, turnId, itemId);
  return nextConversation;
}

export function applyAssistantDelta(
  conversation: TranscriptEntry[],
  runtime: TranscriptRuntime,
  { turnId = null, itemId = null, delta = "" }: {
    turnId?: string | number | null;
    itemId?: string | number | null;
    delta?: string;
  } = {},
) {
  if (!delta) return conversation;
  if (turnId != null && runtime.completedTurnIds.has(turnId)) {
    return conversation;
  }

  const entryId = resolveAssistantEntryId(runtime, conversation, turnId, itemId);
  if (entryId == null) {
    const assistantId = runtime.nextId++;
    const nextConversation = [
      ...conversation,
      createTranscriptEntry(assistantId, "assistant", delta, "streaming"),
    ];
    trackAssistantEntry(runtime, assistantId, turnId, itemId);
    return nextConversation;
  }

  const nextConversation = updateEntryById(conversation, entryId, (entry) => ({
    ...entry,
    text: `${entry.text ?? ""}${delta}`,
    status: "streaming",
  }));
  trackAssistantEntry(runtime, entryId, turnId, itemId);
  return nextConversation;
}

export function completeAssistantMessage(
  conversation: TranscriptEntry[],
  runtime: TranscriptRuntime,
  { turnId = null, itemId = null, text = "" }: {
    turnId?: string | number | null;
    itemId?: string | number | null;
    text?: string;
  } = {},
) {
  const entryId = resolveAssistantEntryId(runtime, conversation, turnId, itemId);
  if (turnId != null) {
    runtime.completedTurnIds.add(turnId);
  }

  if (entryId == null) {
    const assistantId = runtime.nextId++;
    const nextConversation = [
      ...conversation,
      createTranscriptEntry(assistantId, "assistant", text, "complete"),
    ];
    trackAssistantEntry(runtime, assistantId, turnId, itemId);
    runtime.pendingAssistantId = null;
    return nextConversation;
  }

  const nextConversation = updateEntryById(conversation, entryId, (entry) => ({
    ...entry,
    text: text || entry.text || "",
    status: "complete",
  }));
  trackAssistantEntry(runtime, entryId, turnId, itemId);
  if (runtime.pendingAssistantId === entryId) {
    runtime.pendingAssistantId = null;
  }
  return nextConversation;
}

export function useBridgeSession() {
  const [status, setStatus] = useState(emptyStatus);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(emptyStatus.defaultModel);
  const [sending, setSending] = useState(false);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [conversation, setConversation] = useState<TranscriptEntry[]>([]);
  const [currentTurnId, setCurrentTurnId] = useState<string | number | null>(null);
  const [turnDiff, setTurnDiff] = useState("");
  const [turnPlan, setTurnPlan] = useState<TurnPlan>(null);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [respondingRequestId, setRespondingRequestId] = useState<string | number | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [rateLimitsBusy, setRateLimitsBusy] = useState(false);
  const transcriptRuntimeRef = useRef(createTranscriptRuntime());
  const [authRoutes, setAuthRoutes] = useState({
    account: false,
    login: false,
    logout: false,
  });

  function pushLocalError(error: unknown, fallbackMessage: string) {
    setEvents((current) => [
      {
        type: "local-error",
        message: getErrorMessage(error, fallbackMessage),
      },
      ...current,
    ]);
  }

  useEffect(() => {
    let mounted = true;

    fetchJson<BridgeStatus>("/api/bridge/status")
      .then((data) => {
        if (mounted) setStatus(data);
      })
      .catch(() => {});

    const probe = async (path: string) => {
      try {
        const res = await fetch(path, { method: "OPTIONS" });
        return res.status !== 404;
      } catch {
        return false;
      }
    };

    Promise.all([
      probe("/api/bridge/account"),
      probe("/api/bridge/login"),
      probe("/api/bridge/logout"),
    ]).then(([account, login, logout]) => {
      if (!mounted) return;
      setAuthRoutes({ account, login, logout });
    });

    const source = new EventSource("/api/bridge/events");
    source.onmessage = (event) => {
      const payload = JSON.parse(event.data) as BridgeEventPayload;
      setEvents((current) => [payload, ...current].slice(0, 80));

      if (payload.type === "status") {
        if (payload.status) {
          setStatus(payload.status);
        }
        if (typeof payload.diff === "string") {
          setTurnDiff(payload.diff);
        }
        if (payload.plan) {
          setTurnPlan(isRecord(payload.plan) ? payload.plan : null);
        }
        return;
      }

      if (payload.method === "turn/started") {
        const turn = isRecord(payload.params?.turn) ? payload.params.turn : null;
        const turnId = typeof turn?.id === "string" || typeof turn?.id === "number" ? turn.id : null;
        setCurrentTurnId(turnId);
        setTurnDiff("");
        setTurnPlan(null);
        setApprovals([]);
        return;
      }

      if (payload.method === "turn/diff/updated") {
        setTurnDiff(typeof payload.params?.diff === "string" ? payload.params.diff : "");
        return;
      }

      if (payload.method === "turn/plan/updated") {
        setTurnPlan(payload.params ?? null);
        return;
      }

      if (payload.method === "item/started") {
        const item = isRecord(payload.params?.item) ? payload.params.item : null;
        if (item?.type === "agentMessage") {
          const turnId =
            typeof payload.params?.turnId === "string" || typeof payload.params?.turnId === "number"
              ? payload.params.turnId
              : null;
          const itemId = typeof item.id === "string" || typeof item.id === "number" ? item.id : null;
          setCurrentTurnId(turnId);
          setConversation((current) =>
            beginAssistantMessage(current, transcriptRuntimeRef.current, {
              turnId,
              itemId,
              text: typeof item.text === "string" ? item.text : "",
            }),
          );
        }
        return;
      }

      if (
        payload.method === "item/fileChange/requestApproval" ||
        payload.method === "item/commandExecution/requestApproval" ||
        payload.method === "tool/requestUserInput"
      ) {
        const requestId = payload.id ?? payload.params?.itemId ?? payload.params?.requestId;
        if (typeof requestId === "string" || typeof requestId === "number") {
          setApprovals((current) =>
            upsertByRequestId(current, {
              requestId,
              method: payload.method ?? "request",
              params: payload.params ?? {},
            }),
          );
        }
        return;
      }

      if (payload.method === "serverRequest/resolved") {
        const requestId = payload.params?.requestId;
        if (typeof requestId === "string" || typeof requestId === "number") {
          setApprovals((current) => removeByRequestId(current, requestId));
        }
        return;
      }

      if (payload.method === "item/agentMessage/delta") {
        const delta = typeof payload.params?.delta === "string" ? payload.params.delta : "";
        if (!delta) return;
        const item = isRecord(payload.params?.item) ? payload.params.item : null;
        const itemId =
          typeof payload.params?.itemId === "string" || typeof payload.params?.itemId === "number"
            ? payload.params.itemId
            : typeof item?.id === "string" || typeof item?.id === "number"
              ? item.id
              : null;
        const turnId =
          typeof payload.params?.turnId === "string" || typeof payload.params?.turnId === "number"
            ? payload.params.turnId
            : null;
        setConversation((current) =>
          applyAssistantDelta(current, transcriptRuntimeRef.current, {
            turnId,
            itemId,
            delta,
          }),
        );
        return;
      }

      if (payload.method === "item/completed") {
        const item = isRecord(payload.params?.item) ? payload.params.item : null;
        if (item?.type === "agentMessage") {
          const turnId =
            typeof payload.params?.turnId === "string" || typeof payload.params?.turnId === "number"
              ? payload.params.turnId
              : null;
          const itemId = typeof item.id === "string" || typeof item.id === "number" ? item.id : null;
          setConversation((current) =>
            completeAssistantMessage(current, transcriptRuntimeRef.current, {
              turnId,
              itemId,
              text: typeof item.text === "string" ? item.text : "",
            }),
          );
        }
      }
    };

    return () => {
      mounted = false;
      source.close();
    };
  }, []);

  const provider = status.provider ?? "codex";
  const providerLabel = status.providerLabel ?? (provider === "claude" ? "Claude Code" : "Codex");
  const capabilities = status.capabilities ?? emptyStatus.capabilities;
  const modelOptions = useMemo(() => {
    if (Array.isArray(status.availableModels) && status.availableModels.length > 0) {
      return status.availableModels;
    }
    return emptyStatus.availableModels;
  }, [status.availableModels]);
  const defaultModel = status.defaultModel ?? modelOptions[0]?.value ?? "auto";

  useEffect(() => {
    setSelectedModel((current) => {
      if (modelOptions.some((option) => option.value === current)) {
        return current;
      }
      return defaultModel;
    });
  }, [defaultModel, modelOptions]);

  const statusLabel = useMemo(() => {
    if (status.error) return `error: ${status.error}`;
    if (status.threadId) return "ready";
    return status.state ?? "idle";
  }, [status]);

  const authLabel = useMemo(() => {
    if (status.authMode) return status.authMode;
    if (status.requiresOpenaiAuth === true) return "auth required";
    if (provider === "claude" && status.error) return "terminal auth required";
    if (status.requiresOpenaiAuth === false) return "not required";
    return "unknown";
  }, [provider, status.authMode, status.error, status.requiresOpenaiAuth]);

  const rateLimitSummary = useMemo(
    () => getRateLimitSummary(status.rateLimits),
    [status.rateLimits],
  );

  const planSteps = Array.isArray(turnPlan?.plan) ? turnPlan.plan : [];
  const canSubmit = Boolean(status.threadId && !status.error && !sending);
  const submitLabel = sending
    ? "送信中..."
    : status.error
      ? "接続エラー"
      : status.threadId
        ? `${providerLabel} に送る`
        : "接続待ち...";
  const showAuthHelp =
    (provider === "codex" && status.requiresOpenaiAuth === true && !status.authMode) ||
    (provider === "claude" && !status.authMode);
  const replyText = useMemo(() => getLatestAssistantText(conversation), [conversation]);
  const supportsApprovals = capabilities.approvals !== false;
  const supportsBrowserLogin = capabilities.browserLogin !== false;
  const supportsBrowserLogout = capabilities.browserLogout !== false;
  const supportsDiff = capabilities.diff !== false;
  const supportsPlan = capabilities.plan !== false;
  const supportsRateLimits = capabilities.rateLimits !== false;
  const authHelp = provider === "claude"
    ? {
        description:
          "認証が必要です。まずターミナルで `claude auth login` を完了してください。",
        command: "claude auth login\nclaude auth status --json",
      }
    : {
        description:
          "認証が必要です。まずターミナルで `codex login` を完了してください。",
        command:
          'security find-generic-password -a "$USER" -s OPENAI_API_KEY -w | codex login --with-api-key\ncodex login status',
      };

  async function refreshStatus() {
    const data = await fetchJson<BridgeStatus>("/api/bridge/status");
    setStatus(data);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input.trim();
    if (!value || sending) return;
    if (!status.threadId || status.error) {
      setEvents((current) => [
        {
          type: "local-error",
          message: status.error ?? `${providerLabel} がまだ ready ではありません。`,
        },
        ...current,
      ]);
      return;
    }

    setSending(true);
    const userId = transcriptRuntimeRef.current.nextId++;
    const assistantId = transcriptRuntimeRef.current.nextId++;
    transcriptRuntimeRef.current.pendingAssistantId = assistantId;
    setConversation((current) => [
      ...current,
      createTranscriptEntry(userId, "user", value, "complete"),
      createTranscriptEntry(assistantId, "assistant", "", "streaming"),
    ]);
    try {
      await fetchJson("/api/bridge/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: value, model: selectedModel }),
      }, "failed to submit prompt");
      setInput("");
    } catch (error) {
      const message = getErrorMessage(error, "unknown error");
      setConversation((current) =>
        updateEntryById(current, assistantId, (entry) => ({
          ...entry,
          text: message,
          status: "error",
        })),
      );
      if (transcriptRuntimeRef.current.pendingAssistantId === assistantId) {
        transcriptRuntimeRef.current.pendingAssistantId = null;
      }
      pushLocalError(error, "unknown error");
    } finally {
      setSending(false);
    }
  }

  async function handleApproval(request: ApprovalRequest, decision: string) {
    setRespondingRequestId(request.requestId);
    try {
      await fetchJson("/api/bridge/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.requestId,
          result: decision,
        }),
      }, "failed to respond");
    } catch (error) {
      pushLocalError(error, "unknown error");
    } finally {
      setRespondingRequestId(null);
    }
  }

  async function handleLogin() {
    if (!authRoutes.login || !supportsBrowserLogin || authBusy) return;
    setAuthBusy(true);
    try {
      const data = await fetchJson<{ authUrl?: string }>("/api/bridge/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "chatgpt" }),
      }, "failed to start login");
      if (typeof data.authUrl === "string" && data.authUrl) {
        window.open(data.authUrl, "_blank", "noopener,noreferrer");
      }
      await refreshStatus();
    } catch (error) {
      pushLocalError(error, "login failed");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    if (!authRoutes.logout || !supportsBrowserLogout || authBusy) return;
    setAuthBusy(true);
    try {
      await fetchJson("/api/bridge/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }, "failed to logout");
      await refreshStatus();
    } catch (error) {
      pushLocalError(error, "logout failed");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleRefreshAuth() {
    if (!authRoutes.account || authBusy) {
      try {
        await refreshStatus();
      } catch {
        // ignore
      }
      return;
    }
    setAuthBusy(true);
    try {
      await fetchJson("/api/bridge/account", { method: "GET" }, "failed to refresh account");
      await refreshStatus();
    } catch (error) {
      pushLocalError(error, "refresh failed");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleRefreshRateLimits() {
    if (!supportsRateLimits) {
      await refreshStatus().catch(() => {});
      return;
    }
    if (rateLimitsBusy) return;
    setRateLimitsBusy(true);
    try {
      await fetchJson("/api/bridge/rate-limits", { method: "GET" }, "failed to refresh rate limits");
      await refreshStatus();
    } catch (error) {
      pushLocalError(error, "rate limit refresh failed");
    } finally {
      setRateLimitsBusy(false);
    }
  }

  return {
    approvals,
    authBusy,
    authHelp,
    authLabel,
    authRoutes,
    canSubmit,
    capabilities,
    currentTurnId,
    events,
    handleApproval,
    handleLogin,
    handleLogout,
    handleRefreshAuth,
    handleRefreshRateLimits,
    handleSubmit,
    input,
    modelOptions,
    planSteps,
    provider,
    providerLabel,
    rateLimitSummary,
    rateLimitsBusy,
    replyText,
    respondingRequestId,
    selectedModel,
    setInput,
    setSelectedModel,
    showAuthHelp,
    status,
    statusLabel,
    submitLabel,
    supportsApprovals,
    supportsBrowserLogin,
    supportsBrowserLogout,
    supportsDiff,
    supportsPlan,
    supportsRateLimits,
    transcript: conversation,
    turnDiff,
    turnPlan,
  };
}
