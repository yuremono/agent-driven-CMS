"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const emptyStatus = {
  state: "idle",
  threadId: null,
  pid: null,
  error: null,
};

function upsertByRequestId(list, request) {
  const index = list.findIndex((item) => item.requestId === request.requestId);
  if (index === -1) return [request, ...list];
  const next = list.slice();
  next[index] = { ...next[index], ...request };
  return next;
}

function removeByRequestId(list, requestId) {
  return list.filter((item) => item.requestId !== requestId);
}

function getRateLimitSummary(rateLimits) {
  if (!rateLimits?.primary) return null;
  return {
    label: rateLimits.limitName ?? rateLimits.limitId ?? "codex",
    usedPercent: rateLimits.primary.usedPercent,
    windowDurationMins: rateLimits.primary.windowDurationMins,
    resetsAt: rateLimits.primary.resetsAt,
  };
}

export function formatPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "n/a";
  return `${Math.round(value)}%`;
}

export function formatWindow(minutes) {
  if (typeof minutes !== "number" || Number.isNaN(minutes)) return "unknown";
  return `${minutes}分`;
}

export function formatResetAt(timestamp) {
  if (typeof timestamp !== "number" || Number.isNaN(timestamp)) return "unknown";
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp * 1000));
}

export function requestTitle(method) {
  if (method === "item/fileChange/requestApproval") return "File change approval";
  if (method === "item/commandExecution/requestApproval") return "Command approval";
  if (method === "tool/requestUserInput") return "Tool input";
  return method ?? "request";
}

export function decisionOptions(method) {
  if (method === "item/fileChange/requestApproval") {
    return ["accept", "acceptForSession", "decline", "cancel"];
  }
  if (method === "item/commandExecution/requestApproval") {
    return ["accept", "acceptForSession", "decline", "cancel"];
  }
  return [];
}

function createTranscriptEntry(id, role, text, status) {
  return { id, role, text, status };
}

function updateEntryById(list, entryId, updater) {
  const index = list.findIndex((item) => item.id === entryId);
  if (index === -1) return list;
  const next = list.slice();
  next[index] = updater(next[index]);
  return next;
}

function getLatestAssistantText(entries) {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const item = entries[index];
    if (item.role === "assistant") {
      return item.text ?? "";
    }
  }
  return "";
}

export function useBridgeSession() {
  const [status, setStatus] = useState(emptyStatus);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [events, setEvents] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [currentTurnId, setCurrentTurnId] = useState(null);
  const [turnDiff, setTurnDiff] = useState("");
  const [turnPlan, setTurnPlan] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [respondingRequestId, setRespondingRequestId] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [rateLimitsBusy, setRateLimitsBusy] = useState(false);
  const transcriptIdRef = useRef(1);
  const activeAssistantIdRef = useRef(null);
  const [authRoutes, setAuthRoutes] = useState({
    account: false,
    login: false,
    logout: false,
  });

  useEffect(() => {
    let mounted = true;

    fetch("/api/bridge/status")
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setStatus(data);
      })
      .catch(() => {});

    const probe = async (path) => {
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
      const payload = JSON.parse(event.data);
      setEvents((current) => [payload, ...current].slice(0, 80));

      if (payload.type === "status") {
        setStatus(payload.status);
        if (typeof payload.diff === "string") {
          setTurnDiff(payload.diff);
        }
        if (payload.plan) {
          setTurnPlan(payload.plan);
        }
        return;
      }

      if (payload.method === "turn/started") {
        setCurrentTurnId(payload.params?.turn?.id ?? null);
        setTurnDiff("");
        setTurnPlan(null);
        setApprovals([]);
        return;
      }

      if (payload.method === "turn/diff/updated") {
        setTurnDiff(payload.params?.diff ?? "");
        return;
      }

      if (payload.method === "turn/plan/updated") {
        setTurnPlan(payload.params ?? null);
        return;
      }

      if (payload.method === "item/started") {
        const item = payload.params?.item;
        if (item?.type === "agentMessage") {
          setCurrentTurnId(payload.params?.turnId ?? null);
          if (activeAssistantIdRef.current == null) {
            const assistantId = transcriptIdRef.current++;
            activeAssistantIdRef.current = assistantId;
            setConversation((current) => [
              ...current,
              createTranscriptEntry(assistantId, "assistant", "", "streaming"),
            ]);
          } else {
            setConversation((current) =>
              updateEntryById(current, activeAssistantIdRef.current, (entry) => ({
                ...entry,
                status: "streaming",
              })),
            );
          }
        }
        return;
      }

      if (
        payload.method === "item/fileChange/requestApproval" ||
        payload.method === "item/commandExecution/requestApproval" ||
        payload.method === "tool/requestUserInput"
      ) {
        const requestId = payload.id ?? payload.params?.itemId ?? payload.params?.requestId;
        if (requestId != null) {
          setApprovals((current) =>
            upsertByRequestId(current, {
              requestId,
              method: payload.method,
              params: payload.params ?? {},
            }),
          );
        }
        return;
      }

      if (payload.method === "serverRequest/resolved") {
        const requestId = payload.params?.requestId;
        if (requestId != null) {
          setApprovals((current) => removeByRequestId(current, requestId));
        }
        return;
      }

      if (payload.method === "item/agentMessage/delta") {
        const delta = payload.params?.delta ?? "";
        if (!delta) return;
        if (activeAssistantIdRef.current == null) {
          const assistantId = transcriptIdRef.current++;
          activeAssistantIdRef.current = assistantId;
          setConversation((current) => [
            ...current,
            createTranscriptEntry(assistantId, "assistant", delta, "streaming"),
          ]);
          return;
        }
        setConversation((current) =>
          updateEntryById(current, activeAssistantIdRef.current, (entry) => ({
            ...entry,
            text: `${entry.text ?? ""}${delta}`,
            status: "streaming",
          })),
        );
        return;
      }

      if (payload.method === "item/completed") {
        const item = payload.params?.item;
        if (item?.type === "agentMessage") {
          const text = item.text ?? "";
          if (activeAssistantIdRef.current == null) {
            const assistantId = transcriptIdRef.current++;
            setConversation((current) => [
              ...current,
              createTranscriptEntry(assistantId, "assistant", text, "complete"),
            ]);
          } else {
            setConversation((current) =>
              updateEntryById(current, activeAssistantIdRef.current, (entry) => ({
                ...entry,
                text,
                status: "complete",
              })),
            );
          }
          activeAssistantIdRef.current = null;
        }
      }
    };

    return () => {
      mounted = false;
      source.close();
    };
  }, []);

  const statusLabel = useMemo(() => {
    if (status.error) return `error: ${status.error}`;
    if (status.threadId) return "ready";
    return status.state ?? "idle";
  }, [status]);

  const authLabel = useMemo(() => {
    if (status.authMode) return status.authMode;
    if (status.requiresOpenaiAuth === true) return "auth required";
    if (status.requiresOpenaiAuth === false) return "not required";
    return "unknown";
  }, [status.authMode, status.requiresOpenaiAuth]);

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
        ? "Codex に送る"
        : "接続待ち...";
  const showAuthHelp = status.requiresOpenaiAuth === true && !status.authMode;
  const replyText = useMemo(() => getLatestAssistantText(conversation), [conversation]);

  async function refreshStatus() {
    const data = await fetch("/api/bridge/status").then((res) => res.json());
    setStatus(data);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const value = input.trim();
    if (!value || sending) return;
    if (!status.threadId || status.error) {
      setEvents((current) => [
        {
          type: "local-error",
          message: status.error ?? "Codex app-server がまだ ready ではありません。",
        },
        ...current,
      ]);
      return;
    }

    setSending(true);
    const userId = transcriptIdRef.current++;
    const assistantId = transcriptIdRef.current++;
    activeAssistantIdRef.current = assistantId;
    setConversation((current) => [
      ...current,
      createTranscriptEntry(userId, "user", value, "complete"),
      createTranscriptEntry(assistantId, "assistant", "", "streaming"),
    ]);
    try {
      const response = await fetch("/api/bridge/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: value }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "failed to submit prompt");
      }
      setInput("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      setConversation((current) =>
        updateEntryById(current, assistantId, (entry) => ({
          ...entry,
          text: message,
          status: "error",
        })),
      );
      activeAssistantIdRef.current = null;
      setEvents((current) => [
        {
          type: "local-error",
          message,
        },
        ...current,
      ]);
    } finally {
      setSending(false);
    }
  }

  async function handleApproval(request, decision) {
    setRespondingRequestId(request.requestId);
    try {
      const response = await fetch("/api/bridge/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.requestId,
          result: decision,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "failed to respond");
      }
    } catch (error) {
      setEvents((current) => [
        {
          type: "local-error",
          message: error instanceof Error ? error.message : "unknown error",
        },
        ...current,
      ]);
    } finally {
      setRespondingRequestId(null);
    }
  }

  async function handleLogin() {
    if (!authRoutes.login || authBusy) return;
    setAuthBusy(true);
    try {
      const response = await fetch("/api/bridge/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "chatgpt" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? "failed to start login");
      }
      if (typeof data.authUrl === "string" && data.authUrl) {
        window.open(data.authUrl, "_blank", "noopener,noreferrer");
      }
      await refreshStatus();
    } catch (error) {
      setEvents((current) => [
        {
          type: "local-error",
          message: error instanceof Error ? error.message : "login failed",
        },
        ...current,
      ]);
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    if (!authRoutes.logout || authBusy) return;
    setAuthBusy(true);
    try {
      const response = await fetch("/api/bridge/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? "failed to logout");
      }
      await refreshStatus();
    } catch (error) {
      setEvents((current) => [
        {
          type: "local-error",
          message: error instanceof Error ? error.message : "logout failed",
        },
        ...current,
      ]);
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
      const response = await fetch("/api/bridge/account", { method: "GET" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? "failed to refresh account");
      }
      await refreshStatus();
    } catch (error) {
      setEvents((current) => [
        {
          type: "local-error",
          message: error instanceof Error ? error.message : "refresh failed",
        },
        ...current,
      ]);
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleRefreshRateLimits() {
    if (rateLimitsBusy) return;
    setRateLimitsBusy(true);
    try {
      const response = await fetch("/api/bridge/rate-limits", { method: "GET" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? "failed to refresh rate limits");
      }
      await refreshStatus();
    } catch (error) {
      setEvents((current) => [
        {
          type: "local-error",
          message: error instanceof Error ? error.message : "rate limit refresh failed",
        },
        ...current,
      ]);
    } finally {
      setRateLimitsBusy(false);
    }
  }

  return {
    approvals,
    authBusy,
    authLabel,
    authRoutes,
    canSubmit,
    currentTurnId,
    events,
    handleApproval,
    handleLogin,
    handleLogout,
    handleRefreshAuth,
    handleRefreshRateLimits,
    handleSubmit,
    input,
    planSteps,
    rateLimitSummary,
    rateLimitsBusy,
    replyText,
    respondingRequestId,
    setInput,
    showAuthHelp,
    status,
    statusLabel,
    submitLabel,
    transcript: conversation,
    turnDiff,
    turnPlan,
  };
}
