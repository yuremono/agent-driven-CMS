"use client";

import { CaretDown, PaperPlaneRight, Plus } from "@phosphor-icons/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useBridgeSessionContext } from "./BridgeSessionContext.jsx";

function TranscriptMessage({ item }) {
  const isUser = item.role === "user";
  const isError = item.status === "error";
  const label = isUser ? "You" : isError ? "Error" : "Assistant";
  const bubbleClass = isUser
    ? "editorTranscriptBubble editorTranscriptBubbleUser"
    : isError
      ? "editorTranscriptBubble editorTranscriptBubbleError"
      : "editorTranscriptBubble editorTranscriptBubbleAssistant";

  return (
    <article
      className={`editorTranscriptItem ${
        isUser ? "editorTranscriptItemUser" : "editorTranscriptItemAssistant"
      }`}
    >
      <p className="editorTranscriptLabel">{label}</p>
      <div className={bubbleClass}>{item.text || (item.status === "streaming" ? "…" : "")}</div>
    </article>
  );
}

function TranscriptLog({ style, transcript, viewportRef, onScroll }) {
  if (transcript.length === 0) return null;

  return (
    <section
      ref={viewportRef}
      className="editorTranscript"
      style={style}
      aria-label="Conversation transcript"
      aria-live="polite"
      aria-relevant="additions text"
      onScroll={onScroll}
      role="log"
    >
      <div className="editorTranscriptViewport">
        <div className="editorTranscriptList">
          {transcript.map((item) => (
            <TranscriptMessage item={item} key={item.id} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function DevEditorOverlay() {
  const {
    canSubmit,
    handleSubmit,
    input,
    modelOptions,
    providerLabel,
    selectedModel,
    setInput,
    setSelectedModel,
    submitLabel,
    transcript,
  } = useBridgeSessionContext();
  const fileInputRef = useRef(null);
  const dockRef = useRef(null);
  const textareaRef = useRef(null);
  const transcriptViewportRef = useRef(null);
  const stickToBottomRef = useRef(true);
  const [attachmentNames, setAttachmentNames] = useState([]);
  const [dockHeight, setDockHeight] = useState(0);

  useLayoutEffect(() => {
    const node = dockRef.current;
    if (!node) return undefined;

    const updateDockHeight = () => {
      setDockHeight(node.getBoundingClientRect().height);
    };

    updateDockHeight();

    const observer = new ResizeObserver(updateDockHeight);
    observer.observe(node);
    window.addEventListener("resize", updateDockHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateDockHeight);
    };
  }, []);

  useEffect(() => {
    const node = transcriptViewportRef.current;
    if (!node || !stickToBottomRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [transcript]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [input]);

  function handleAttachmentClick() {
    fileInputRef.current?.click();
  }

  function handleAttachmentChange(event) {
    const files = Array.from(event.currentTarget.files ?? []);
    setAttachmentNames(files.map((file) => file.name));
  }

  function handleTranscriptScroll(event) {
    const node = event.currentTarget;
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 24;
  }

  const attachmentLabel =
    attachmentNames.length > 0
      ? attachmentNames.length === 1
        ? attachmentNames[0]
        : `${attachmentNames.length} files attached`
      : "ファイルを添付";
  const showComposerHint = input.trim().length === 0;
  const transcriptStyle = {
    maxHeight: `calc(100dvh - 2rem) - ${dockHeight}px - 0.75rem)`,
  };

  return (
    <div className="editorOverlay pointer-events-none">
      <div className="editorTranscriptRail">
        <TranscriptLog
          style={transcriptStyle}
          onScroll={handleTranscriptScroll}
          transcript={transcript}
          viewportRef={transcriptViewportRef}
        />
      </div>

      <section
        ref={dockRef}
        className="editorDock pointer-events-auto w-full rounded-[38px] border border-[rgba(38,27,18,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(248,242,232,0.64))] px-2 py-2 text-[#1d1712] shadow-[0_22px_72px_rgba(39,24,12,0.14)] backdrop-blur-[28px]"
      >
        <form className="flex items-end gap-2 max-md:flex-wrap" onSubmit={handleSubmit}>
          <button
            aria-label="ファイルを添付"
            className="editorIconButton inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[rgba(38,27,18,0.12)] bg-white/75 text-[#1d1712] transition hover:bg-white"
            onClick={handleAttachmentClick}
            type="button"
            title="ファイルを添付"
          >
            <Plus size={20} weight="regular" />
          </button>

          <input
            ref={fileInputRef}
            className="sr-only"
            multiple
            onChange={handleAttachmentChange}
            type="file"
          />

          <div className="editorComposerField relative flex-1 min-w-0">
            <textarea
              aria-label="Editor prompt"
              ref={textareaRef}
              className="editorComposerInput block w-full resize-none overflow-hidden border-0 bg-transparent px-1 py-2 not-only-of-type: outline-none"
              onChange={(event) => setInput(event.target.value)}
              placeholder=""
              rows={1}
              value={input}
            />
            {showComposerHint ? (
              <div className="w-full text-[var(--GR)] pointer-events-none absolute left-1 top-0 h-full flex flex-wrap items-center gap-1 px-1 text-[0.92rem] leading-7 ">
                <span>レッツバイブコーディング！&nbsp;</span>
                <span className="ml-auto leading-none">provider: {providerLabel}</span>
              </div>
            ) : null}
          </div>

          {/* <div className="editorComposerActions flex shrink-0 items-center gap-2 max-md:w-full max-md:justify-end"> */}
            {modelOptions.length > 0 ? (
              <label className="editorModelSelectWrap relative inline-flex items-center">
                <span className="sr-only">モデルを選択</span>
                <select
                  aria-label="モデルを選択"
                  className="editorModelSelect appearance-none rounded-full border border-[rgba(38,27,18,0.12)] bg-white/76 min-h-10 pl-4 pr-10 text-sm text-[#1d1712] outline-none transition focus:border-[rgba(33,77,102,0.2)] focus:bg-white"
                  value={selectedModel}
                  onChange={(event) => setSelectedModel(event.target.value)}
                >
                  {modelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <CaretDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 text-[rgba(104,95,85,0.82)]"
                  size={16}
                  weight="bold"
                />
              </label>
            ) : null}

            <button
              aria-label={submitLabel}
              className="editorSendButton inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0f0c0a] text-white transition duration-200 hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-65"
              disabled={!canSubmit}
              title={submitLabel}
              type="submit"
            >
              <PaperPlaneRight size={18} weight="fill" />
            </button>
          {/* </div> */}
        </form>

        {attachmentNames.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 px-2 pt-2 text-[0.78rem] leading-6 text-[rgba(104,95,85,0.92)]">
            {attachmentNames.length > 0 ? (
              <span className="inline-flex items-center rounded-full border border-[rgba(38,27,18,0.1)] bg-white/55 px-3 py-1">
                {attachmentLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
