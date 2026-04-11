"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
	TR,
	AC,
	BC,
	GR,
	SC,
	CENTER_RATIO,
	DEFAULT_DPR,
	MIN_CANVAS_SIZE,
	MC,
	ORIGIN,
	RING_OUTER_RADIUS_RATIO,
	RING_ROTATION_OFFSET,
	ROTATION_DIRECTION,
	SEGMENT_SPAN,
	TEST_SEGMENT_OPACITY,
	WID_CSS_VAR,
	drawBackground,
	drawRing,
	measureScrollState,
	offsetSectionProgress,
	readWidRatio,
	readShowcasePalette,
	recenterInfiniteScroll,
} from "./ringScrollShowcaseGeometry.js";
import VideoRingOverlay from "./VideoRingOverlay.jsx";

const SHOWCASE_TITLE = "位相で巡るスクロールリング";
const LOOP_COPY_COUNT = 3;
const LOOP_MIDDLE_COPY_INDEX = 1;
const DEFAULT_SECTION_CLASS_NAME = " min-h-[100lvh] content-center";
const DEFAULT_CONTENT_CLASS_NAME = "grid gap-[var(--gap)]";
const DEBUG_SEGMENT_POSITIONS = [
  "absolute right-0 top-0 h-1/2 w-1/2",
  "absolute right-0 bottom-0 h-1/2 w-1/2",
  "absolute left-0 bottom-0 h-1/2 w-1/2",
  "absolute left-0 top-0 h-1/2 w-1/2",
];

// ドーナツの 4 扇。各 colorVar は CSS 変数（--MC 等）→ readShowcasePalette で実色に解決して Canvas に塗る。
const RING_SEGMENTS = [
  { id: "1", colorVar: TR },
  { id: "2", colorVar: TR },
  { id: "3", colorVar: TR },
  { id: "4", colorVar: TR },
];

/**
 * 本文と背景メディアを同じ長さで管理する。`media` は VideoRingOverlay に渡る。
 */
export const DEFAULT_SHOWCASE_SECTIONS = [
	{
		id: "1",
		locator: "ContourSection",
		eyebrow: "section 1",
		title: "輪郭を読む",
		body: "最初の 90 度は、画面の左端で立ち上がる 1 番の面を見せる。ここが全体の基準点になる。",
		media: { src: "/video/001.mp4", kind: "video" },
	},
	{
		id: "2",
		locator: "PhaseSection",
		eyebrow: "section 2",
		title: "位相をずらす",
		body: "1 画面ぶん下へ進むと、2 番の面が前に出る。縦スクロールはそのまま 90 度の移動になる。",
		media: { src: "/video/002.mp4", kind: "video" },
	},
	{
		id: "3",
		locator: "LayerSection",
		eyebrow: "section 3",
		title: "膜を重ねる",
		body: "3 番の面は少し明るくして、他の面の上に薄い膜がのるように見せる。重なりを強くしすぎない。",
		media: { src: "/video/003.mp4", kind: "video" },
	},
	{
		id: "4",
		locator: "LoopSection",
		eyebrow: "section 4",
		title: "循環へ戻す",
		body: "4 番の面まで来たら、次の 90 度で 1 番に戻る。内容は普通の縦長サイトで、位相だけが回る。",
		note: "下へ進むほど、背景の 90 度が次の面へ移る。",
		media: { src: "/video/004.mp4", kind: "video" },
	},
];

// 無限スクロールのために同じセクション群を 3 回描画する。
function SectionCopy({ copyIndex, sections }) {
	const isVisibleCopy = copyIndex === LOOP_MIDDLE_COPY_INDEX;

	return (
		<div data-l={`SectionGroup${copyIndex + 1}`} aria-hidden={!isVisibleCopy}>
			{sections.map((section) => (
				<section
					data-l={`${section.locator}${copyIndex + 1}`}
					key={`${copyIndex}-${section.id}`}
					className={DEFAULT_SECTION_CLASS_NAME}
				>
					<div className={DEFAULT_CONTENT_CLASS_NAME}>
						<p className="text-[0.7rem] uppercase tracking-[0.28em]">
							{section.eyebrow}
						</p>
						{section.title ? (
							<h2 className="text-[clamp(2.5rem,6vw,5.75rem)] leading-[0.9] tracking-[-0.06em]">
								{section.title}
							</h2>
						) : null}
						<p className="text-[0.98rem] leading-8">
							{section.body}
						</p>
						{section.note ? (
							<div className="pt-6 text-sm">{section.note}</div>
						) : null}
					</div>
				</section>
			))}
		</div>
	);
}

export default function RingScrollShowcase({
	sections: sectionsProp = DEFAULT_SHOWCASE_SECTIONS,
}) {
	const mediaItems = useMemo(
		() => sectionsProp.map((section) => section.media),
		[sectionsProp],
	);
	const canvasRef = useRef(null);
	const hostRef = useRef(null);
	const debugRingRef = useRef(null);
	const frameRef = useRef(ORIGIN);
	const overlayStateRef = useRef(null);
	const sectionsRef = useRef(sectionsProp);
	sectionsRef.current = sectionsProp;
	const sizeRef = useRef({
		width: ORIGIN,
		height: ORIGIN,
		dpr: DEFAULT_DPR,
		cycleHeight: MIN_CANVAS_SIZE,
	});
	const videoRingApiRef = useRef(null);
	const scheduleRenderRef = useRef(() => {});
	const requestVideoRingRedraw = useCallback(() => {
		scheduleRenderRef.current?.();
	}, []);
	const [videoOverlayState, setVideoOverlayState] = useState({
		innerSize: ORIGIN,
		ringCenterY: ORIGIN,
		viewportHeight: ORIGIN,
		viewportWidth: ORIGIN,
	});

	useEffect(() => {
		const canvas = canvasRef.current;
		const host = hostRef.current;
		if (!canvas || !host) return undefined;

		const ctx = canvas.getContext("2d");
		if (!ctx) return undefined;

		const render = () => {
			frameRef.current = ORIGIN;
			const { width, height, dpr } = sizeRef.current;
			if (!width || !height) return;

			const sectionCount = Math.max(1, sectionsRef.current.length);
			const ringSegmentCount = RING_SEGMENTS.length;
			const palette = readShowcasePalette();
			const widRatio = readWidRatio(host);
			const { sectionProgress } = measureScrollState(host, sectionCount);
			const phaseProgress = offsetSectionProgress(
				sectionProgress,
				ringSegmentCount,
			);
			const rotation =
				RING_ROTATION_OFFSET +
				phaseProgress * SEGMENT_SPAN * ROTATION_DIRECTION;
			const ringSegments = RING_SEGMENTS.map((segment) => ({
				...segment,
				color: palette[segment.colorVar],
			}));

			ctx.setTransform(dpr, ORIGIN, ORIGIN, dpr, ORIGIN, ORIGIN);
			ctx.clearRect(ORIGIN, ORIGIN, width, height);
			drawBackground(ctx, width, height, palette);

			const outerRadius = width * RING_OUTER_RADIUS_RATIO;
			const innerRadius = width * (1 - widRatio);
			const ringCenterY = height * CENTER_RATIO;
			const nextOverlayState = {
				innerSize: Math.round(innerRadius * 2),
				ringCenterY: Math.round(ringCenterY),
				viewportHeight: height,
				viewportWidth: width,
			};
			const previousOverlayState = overlayStateRef.current;
			if (
				!previousOverlayState ||
				previousOverlayState.innerSize !== nextOverlayState.innerSize ||
				previousOverlayState.ringCenterY !==
					nextOverlayState.ringCenterY ||
				previousOverlayState.viewportHeight !==
					nextOverlayState.viewportHeight ||
				previousOverlayState.viewportWidth !==
					nextOverlayState.viewportWidth
			) {
				overlayStateRef.current = nextOverlayState;
				setVideoOverlayState(nextOverlayState);
			}

			drawRing(
				ctx,
				ORIGIN,
				ringCenterY,
				outerRadius,
				innerRadius,
				rotation,
				ringSegments,
			);

			const debugRing = debugRingRef.current;
			if (debugRing) {
				const ringSize = outerRadius * 2;
				debugRing.style.left = `${-outerRadius}px`;
				debugRing.style.top = `${ringCenterY - outerRadius}px`;
				debugRing.style.width = `${ringSize}px`;
				debugRing.style.height = `${ringSize}px`;
				debugRing.style.transform = `rotate(${rotation}rad)`;
				debugRing.style.setProperty(WID_CSS_VAR, `${widRatio * 100}%`);
				debugRing.dataset.sectionProgress = `${sectionProgress}`;
				debugRing.dataset.progress = `${phaseProgress}`;
			}

			videoRingApiRef.current?.setRingGeometry({
				cx: ORIGIN,
				cy: ringCenterY,
				innerRadius,
				outerRadius,
				rotation,
				segmentCount: ringSegmentCount,
			});
		};

		const resize = () => {
			const width = window.innerWidth;
			const height = window.innerHeight;
			const dpr = window.devicePixelRatio || DEFAULT_DPR;
			const cycleHeight =
				height * Math.max(1, sectionsRef.current.length);
			sizeRef.current = {
				width,
				height,
				dpr,
				cycleHeight,
			};
			canvas.width = Math.max(MIN_CANVAS_SIZE, Math.round(width * dpr));
			canvas.height = Math.max(MIN_CANVAS_SIZE, Math.round(height * dpr));
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			recenterInfiniteScroll(cycleHeight, LOOP_MIDDLE_COPY_INDEX);
			if (!frameRef.current) {
				frameRef.current = window.requestAnimationFrame(render);
			}
		};

		const scheduleRender = () => {
			if (frameRef.current) return;
			frameRef.current = window.requestAnimationFrame(render);
		};

		scheduleRenderRef.current = scheduleRender;

		const handleScroll = () => {
			recenterInfiniteScroll(
				sizeRef.current.cycleHeight,
				LOOP_MIDDLE_COPY_INDEX,
			);
			scheduleRender();
		};

		// ResizeObserver で canvas の実寸とスクロール再中心化を同期する。
		const observer = new ResizeObserver(resize);
		observer.observe(host);
		window.addEventListener("resize", resize);
		window.addEventListener("scroll", handleScroll, { passive: true });

		resize();

		return () => {
			scheduleRenderRef.current = () => {};
			observer.disconnect();
			window.removeEventListener("resize", resize);
			window.removeEventListener("scroll", handleScroll);
			if (frameRef.current) {
				window.cancelAnimationFrame(frameRef.current);
				frameRef.current = ORIGIN;
			}
		};
	}, []);

	useEffect(() => {
		const len = Math.max(1, sectionsProp.length);
		const h = sizeRef.current.height;
		if (h) {
			sizeRef.current.cycleHeight = h * len;
			recenterInfiniteScroll(
				sizeRef.current.cycleHeight,
				LOOP_MIDDLE_COPY_INDEX,
			);
		}
		scheduleRenderRef.current?.();
	}, [sectionsProp.length]);

	return (
		<main
			ref={hostRef}
			aria-labelledby="ring-showcase-title"
			className="relative min-h-screen overflow-x-hidden text-white"
		>
			<h1 id="ring-showcase-title" className="sr-only">
				{SHOWCASE_TITLE}
			</h1>
			<div
				data-l="CanvasLayer"
				aria-hidden="true"
				className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
			>
				<canvas ref={canvasRef} className="block h-full w-full" />
			</div>
			<VideoRingOverlay
				ref={videoRingApiRef}
				innerSize={videoOverlayState.innerSize}
				mediaItems={mediaItems}
				onLayoutReady={requestVideoRingRedraw}
				ringCenterY={videoOverlayState.ringCenterY}
				ringSegmentCount={RING_SEGMENTS.length}
				viewportHeight={videoOverlayState.viewportHeight}
				viewportWidth={videoOverlayState.viewportWidth}
			/>
			<div
				data-l="DebugLayer"
				aria-hidden="true"
				className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
			>
				<div
					data-l="DebugRing"
					ref={debugRingRef}
					className="absolute overflow-hidden rounded-full"
					style={{ transformOrigin: "50% 50%" }}
				>
					{RING_SEGMENTS.map((segment, index) => (
						<div
							data-l={`DebugSegment${index + 1}`}
							key={segment.id}
							className={DEBUG_SEGMENT_POSITIONS[index]}
							style={{
								// デバッグ用：各扇と同じテーマ色（Canvas の RING_SEGMENTS と対応）
								backgroundColor: `var(${segment.colorVar})`,
								opacity: TEST_SEGMENT_OPACITY,
							}}
						/>
					))}
					<div
						data-l="DebugHole"
						className="absolute left-1/2 top-1/2 rounded-full"
						style={{
							// ドーナツの穴（中央の円）。本番は Canvas 上の扇と重ねるデバッグ用。
							backgroundColor: "var(--TR)",
							height: "calc(100% - var(--wid))",
							width: "calc(100% - var(--wid))",
							transform: "translate(-50%, -50%)",
						}}
					/>
				</div>
			</div>
			<article
				data-l="ContentRail"
				className="relative z-10 ml-auto w-[var(--wid)] px-[var(--PX)]"
			>
				{Array.from({ length: LOOP_COPY_COUNT }).map((_, copyIndex) => (
					<SectionCopy
						key={`copy-${copyIndex}`}
						copyIndex={copyIndex}
						sections={sectionsProp}
					/>
				))}
			</article>
		</main>
	);
}
