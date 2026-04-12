"use client";

import {
	ArrowsOutLineHorizontalIcon,
	ArrowsOutLineVerticalIcon,
	CaretUp,
	PaperPlaneRight,
	Plus,
} from "@phosphor-icons/react";
import {
	type ChangeEvent,
	type CSSProperties,
	type RefObject,
	type UIEvent,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

import { useBridgeSessionContext } from "./BridgeSessionContext";
import {
	cancelEveryOtherAnimationFrame,
	requestEveryOtherAnimationFrame,
} from "./everyOtherAnimationFrame";

const imageExtensionPattern = /\.(?:apng|avif|gif|jpe?g|png|svg|webp)$/i;

type TranscriptItem = {
	id: number;
	role: "assistant" | "user";
	text: string;
	status: "complete" | "error" | "streaming";
};

type Attachment = {
	id: string;
	name: string;
	previewUrl: string | null;
};

function TranscriptMessage({ item }: { item: TranscriptItem }) {
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
				isUser
					? "editorTranscriptItemUser"
					: "editorTranscriptItemAssistant"
			}`}
		>
			<p className="editorTranscriptLabel">{label}</p>
			<div className={bubbleClass}>
				{item.text || (item.status === "streaming" ? "…" : "")}
			</div>
		</article>
	);
}

function TranscriptLog({
	style,
	transcript,
	viewportRef,
	onScroll,
}: {
	style: CSSProperties;
	transcript: TranscriptItem[];
	viewportRef: RefObject<HTMLElement | null>;
	onScroll: (event: UIEvent<HTMLElement>) => void;
}) {
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
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const dockRef = useRef<HTMLElement | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const transcriptViewportRef = useRef<HTMLElement | null>(null);
	const stickToBottomRef = useRef(true);
	const attachmentPreviewUrlsRef = useRef<string[]>([]);
	const [attachments, setAttachments] = useState<Attachment[]>([]);
	const [dockHeight, setDockHeight] = useState(0);
	const [isComposerCollapsed, setIsComposerCollapsed] = useState(false);
	const [isTranscriptCollapsed, setIsTranscriptCollapsed] = useState(false);

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
		const frame = requestEveryOtherAnimationFrame(() => {
			node.scrollTop = node.scrollHeight;
		});

		return () => cancelEveryOtherAnimationFrame(frame);
	}, [transcript]);

	useEffect(() => {
		return () => {
			for (const url of attachmentPreviewUrlsRef.current) {
				URL.revokeObjectURL(url);
			}
		};
	}, []);

	useLayoutEffect(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		textarea.style.height = "auto";
		textarea.style.height = `${textarea.scrollHeight}px`;
	}, [input]);

	function handleAttachmentClick() {
		fileInputRef.current?.click();
	}

	function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
		const files = Array.from(event.currentTarget.files ?? []);
		for (const url of attachmentPreviewUrlsRef.current) {
			URL.revokeObjectURL(url);
		}

		const nextAttachments = files.map((file, index) => {
			const previewUrl = imageExtensionPattern.test(file.name)
				? URL.createObjectURL(file)
				: null;

			return {
				id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
				name: file.name,
				previewUrl,
			};
		});
		attachmentPreviewUrlsRef.current = nextAttachments
			.map((attachment) => attachment.previewUrl)
			.filter((url): url is string => Boolean(url));
		setAttachments(nextAttachments);
	}

	function handleAttachmentRemove(attachmentId: string) {
		const nextAttachments = attachments.filter(
			(attachment) => attachment.id !== attachmentId,
		);
		const removedAttachment = attachments.find(
			(attachment) => attachment.id === attachmentId,
		);

		if (removedAttachment?.previewUrl) {
			URL.revokeObjectURL(removedAttachment.previewUrl);
		}
		if (nextAttachments.length === 0 && fileInputRef.current) {
			fileInputRef.current.value = "";
		}

		attachmentPreviewUrlsRef.current = nextAttachments
			.map((attachment) => attachment.previewUrl)
			.filter((url): url is string => Boolean(url));
		setAttachments(nextAttachments);
	}

	function handleTranscriptScroll(event: UIEvent<HTMLElement>) {
		const node = event.currentTarget;
		const distanceFromBottom =
			node.scrollHeight - node.scrollTop - node.clientHeight;
		stickToBottomRef.current = distanceFromBottom < 24;
	}

	const showComposerHint = input.trim().length === 0;
	const hasUserTranscript = transcript.some((item) => item.role === "user");
	const isTranscriptHidden = isComposerCollapsed || isTranscriptCollapsed;
	const composerVisibilityClass = isComposerCollapsed
		? "pointer-events-none opacity-0"
		: "pointer-events-auto opacity-100";
	const transcriptVisibilityClass = isTranscriptHidden
		? "pointer-events-none opacity-0"
		: "pointer-events-auto opacity-100";
	const transcriptToggleVisibilityClass = isComposerCollapsed
		? "pointer-events-none opacity-0"
		: "pointer-events-auto opacity-100";
	const transcriptStyle: CSSProperties = {
		maxHeight: `calc(100dvh - 2rem - ${dockHeight}px - 0.75rem)`,
	};

	return (
		<div className="editorOverlay pointer-events-none">
			<div className="relative min-h-10">
				<div
					aria-hidden={isTranscriptHidden}
					className={`editorTranscriptRail bg-[var(--WH40)] backdrop-blur-lg transition-opacity duration-200 ${transcriptVisibilityClass}`}
					id="editor-transcript-log"
				>
					<TranscriptLog
						style={transcriptStyle}
						onScroll={handleTranscriptScroll}
						transcript={transcript}
						viewportRef={transcriptViewportRef}
					/>
				</div>
				{hasUserTranscript ? (
					<button
						aria-controls="editor-transcript-log"
						aria-label={
							isTranscriptCollapsed
								? "チャットログを表示"
								: "チャットログを閉じる"
						}
						aria-pressed={isTranscriptCollapsed}
						className={`editorIconButton absolute bottom-2 right-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--GR10)] bg-[var(--WH70)] transition hover:bg-[var(--WH)] ${transcriptToggleVisibilityClass}`}
						onClick={() => setIsTranscriptCollapsed((current) => !current)}
						tabIndex={isComposerCollapsed ? -1 : undefined}
						type="button"
						title={
							isTranscriptCollapsed
								? "チャットログを表示"
								: "ログを閉じる"
						}
					>
						<ArrowsOutLineVerticalIcon size={20} weight="regular" />
					</button>
				) : null}
			</div>

			<div className="relative">
				<section
					aria-hidden={isComposerCollapsed}
					id="editor-composer-panel"
					inert={isComposerCollapsed || undefined}
					ref={dockRef}
					className={`editorDock w-full rounded-[30px] bg-[var(--WH40)] py-2 pl-14 pr-2 backdrop-blur-lg transition-opacity duration-200 ${composerVisibilityClass}`}
				>
					{attachments.length > 0 ? (
						<div className="mb-2 flex flex-wrap items-center gap-2 px-2 text-[0.78rem] leading-6 text-[var(--GR10)]">
							{attachments.map((attachment) => (
								<figure
									className="relative m-0 inline-flex max-w-full items-center gap-2 rounded-[8px] border border-[var(--GR10)] bg-[var(--WH50)] px-2 py-1"
									key={attachment.id}
								>
									<button
										aria-label={`${attachment.name} の添付を解除`}
										className="absolute right-0 top-0 inline-flex size-5 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[8px] border border-[var(--GR10)] bg-[var(--WH)] leading-none text-[var(--BK)]"
										onClick={() => handleAttachmentRemove(attachment.id)}
										type="button"
										title="添付を解除"
									>
										×
									</button>
									{attachment.previewUrl ? (
										<img
											alt={attachment.name}
											className="size-12 shrink-0 rounded-[8px] object-cover"
											src={attachment.previewUrl}
										/>
									) : null}
									<figcaption className="max-w-48 truncate text-black">
										{attachment.name}
									</figcaption>
								</figure>
							))}
						</div>
					) : null}
					<form
						className="flex items-end gap-2 max-md:flex-wrap"
						onSubmit={handleSubmit}
					>
						<button
							aria-label="ファイルを添付"
							className="editorIconButton inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--GR10)] bg-[var(--WH70)] transition hover:bg-[var(--WH)]"
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

						<div className="editorComposerField relative min-w-0 flex-1">
							<textarea
								aria-label="Editor prompt"
								ref={textareaRef}
								className="editorComposerInput block w-full resize-none overflow-hidden border-0 bg-transparent px-1 py-1 not-only-of-type: outline-none"
								onChange={(event) => setInput(event.target.value)}
								placeholder=""
								rows={1}
								value={input}
							/>
							{showComposerHint ? (
								<div className="pointer-events-none absolute left-1 top-0 flex h-full w-full flex-wrap items-center gap-1 px-1 text-[0.92rem] leading-7 text-[var(--TC50)] ">
									<span>レッツバイブコーディング！&nbsp;</span>
									<span className="ml-auto leading-none">
										provider: {providerLabel}
									</span>
								</div>
							) : null}
						</div>

						{/* <div className="editorComposerActions flex shrink-0 items-center gap-2 max-md:w-full max-md:justify-end"> */}
						{modelOptions.length > 0 ? (
							<label className="editorModelSelectWrap relative inline-flex items-center">
								<span className="sr-only">モデルを選択</span>
								<select
									aria-label="モデルを選択"
									className="editorModelSelect min-h-10 appearance-none rounded-full border border-[var(--GR10)] bg-[var(--WH70)] pl-4 pr-10 text-sm outline-none transition focus:border-[var(--BK10)] focus:bg-[var(--WH)]"
									value={selectedModel}
									onChange={(event) =>
										setSelectedModel(event.target.value)
									}
								>
									{modelOptions.map((option) => (
										<option
											key={option.value}
											value={option.value}
										>
											{option.label}
										</option>
									))}
								</select>
								<CaretUp
									aria-hidden="true"
									className="pointer-events-none absolute right-3 "
									size={16}
									weight="bold"
								/>
							</label>
						) : null}

						<button
							aria-label={submitLabel}
							className="editorSendButton inline-flex size-10 shrink-0 items-center justify-center rounded-full  bg-[var(--BK70)] text-white transition duration-200 hover:bg-[var(--BK)] disabled:cursor-progress disabled:opacity-65"
							disabled={!canSubmit}
							title={submitLabel}
							type="submit"
						>
							<PaperPlaneRight size={18} weight="fill" />
						</button>
						{/* </div> */}
					</form>
				</section>
				<button
					aria-controls="editor-composer-panel editor-transcript-log"
					aria-label={
						isComposerCollapsed
							? "チャットインプットを表示"
							: "チャットインプットを小さくする"
					}
					aria-pressed={isComposerCollapsed}
					className="editorIconButton pointer-events-auto absolute bottom-2 left-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--GR10)] bg-[var(--WH70)] transition hover:bg-[var(--WH)]"
					onClick={() => setIsComposerCollapsed((current) => !current)}
					type="button"
					title={
						isComposerCollapsed
							? "チャットインプットを表示"
							: "チャットインプットを小さくする"
					}
				>
					<ArrowsOutLineHorizontalIcon size={20} weight="regular" />
				</button>
			</div>
		</div>
	);
}
