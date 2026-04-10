"use client";

import { useEffect, useRef, useState } from "react";

import {
  AC,
  BC,
  BK,
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
  TAU,
  SHADOW_BLUR,
  SHADOW_OFFSET_Y,
  TEST_SEGMENT_OPACITY,
  WID_CSS_VAR,
  drawBackground,
  drawRing,
  getVideoPhaseStep,
  measureScrollState,
  offsetSectionProgress,
  readWidRatio,
  readShowcasePalette,
  recenterInfiniteScroll,
  toRgba,
  wrapAngle,
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

// リング自体は常に 4 分割のまま扱う。
const RING_SEGMENTS = [
  { id: "1", colorVar: MC },
  { id: "2", colorVar: SC },
  { id: "3", colorVar: AC },
  { id: "4", colorVar: BC },
];

// スクロール本文はこの配列だけを増減させればよい。
const SECTIONS = [
  {
    id: "1",
    eyebrow: "section 1",
    title: "輪郭を読む",
    body: "最初の 90 度は、画面の左端で立ち上がる 1 番の面を見せる。ここが全体の基準点になる。",
  },
  {
    id: "2",
    eyebrow: "section 2",
    title: "位相をずらす",
    body: "1 画面ぶん下へ進むと、2 番の面が前に出る。縦スクロールはそのまま 90 度の移動になる。",
  },
  {
    id: "3",
    eyebrow: "section 3",
    title: "膜を重ねる",
    body: "3 番の面は少し明るくして、他の面の上に薄い膜がのるように見せる。重なりを強くしすぎない。",
  },
  {
    id: "4",
    eyebrow: "section 4",
    title: "循環へ戻す",
    body: "4 番の面まで来たら、次の 90 度で 1 番に戻る。内容は普通の縦長サイトで、位相だけが回る。",
    note: "下へ進むほど、背景の 90 度が次の面へ移る。",
  },
  {
    id: "5",
    eyebrow: "section 5",
    body: "4 番の面まで来たら、次の 90 度で 1 番に戻る。内容は普通の縦長サイトで、位相だけが回る。",
  },
];

// 無限スクロールのために同じセクション群を 3 回描画する。
function SectionCopy({ copyIndex }) {
  const isVisibleCopy = copyIndex === LOOP_MIDDLE_COPY_INDEX;

  return (
    <div aria-hidden={!isVisibleCopy}>
      {SECTIONS.map((section) => (
        <section key={`${copyIndex}-${section.id}`} className={DEFAULT_SECTION_CLASS_NAME}>
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
              <div className="pt-6 text-sm">
                {section.note}
              </div>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function RingScrollShowcase() {
  const canvasRef = useRef(null);
  const hostRef = useRef(null);
  const debugRingRef = useRef(null);
  const frameRef = useRef(ORIGIN);
  const overlayStateRef = useRef(null);
  const sizeRef = useRef({
    width: ORIGIN,
    height: ORIGIN,
    dpr: DEFAULT_DPR,
    cycleHeight: MIN_CANVAS_SIZE,
  });
  const [videoOverlayState, setVideoOverlayState] = useState({
    innerSize: ORIGIN,
    left: ORIGIN,
    ringSize: ORIGIN,
    top: ORIGIN,
    videoStep: ORIGIN,
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

      const sectionCount = SECTIONS.length;
      const ringSegmentCount = RING_SEGMENTS.length;
      const palette = readShowcasePalette();
      const widRatio = readWidRatio(host);
      const { sectionProgress } = measureScrollState(host, sectionCount);
      const phaseProgress = offsetSectionProgress(sectionProgress, ringSegmentCount);
      const videoStep = getVideoPhaseStep(phaseProgress, ringSegmentCount);
      const progress = wrapAngle(phaseProgress * SEGMENT_SPAN) / TAU;
      const rotation = RING_ROTATION_OFFSET + phaseProgress * SEGMENT_SPAN * ROTATION_DIRECTION;
      const ringSegments = RING_SEGMENTS.map((segment) => ({
        ...segment,
        color: palette[segment.colorVar],
      }));

      ctx.setTransform(dpr, ORIGIN, ORIGIN, dpr, ORIGIN, ORIGIN);
      ctx.clearRect(ORIGIN, ORIGIN, width, height);
      drawBackground(ctx, width, height, progress, palette);

      const outerRadius = width * RING_OUTER_RADIUS_RATIO;
      const innerRadius = width * (1 - widRatio);
      const ringCenterY = height * CENTER_RATIO;
      const ringSize = outerRadius * 2;
      const nextOverlayState = {
        innerSize: Math.round(innerRadius * 2),
        left: Math.round(-outerRadius),
        ringSize: Math.round(ringSize),
        top: Math.round(ringCenterY - outerRadius),
        videoStep,
      };
      const previousOverlayState = overlayStateRef.current;
      if (
        !previousOverlayState ||
        previousOverlayState.innerSize !== nextOverlayState.innerSize ||
        previousOverlayState.left !== nextOverlayState.left ||
        previousOverlayState.ringSize !== nextOverlayState.ringSize ||
        previousOverlayState.top !== nextOverlayState.top ||
        previousOverlayState.videoStep !== nextOverlayState.videoStep
      ) {
        overlayStateRef.current = nextOverlayState;
        setVideoOverlayState(nextOverlayState);
      }

      ctx.shadowColor = toRgba(palette[BK], 0.07);
      ctx.shadowBlur = SHADOW_BLUR;
      ctx.shadowOffsetY = SHADOW_OFFSET_Y;
      drawRing(ctx, ORIGIN, ringCenterY, outerRadius, innerRadius, rotation, ringSegments);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = ORIGIN;
      ctx.shadowOffsetY = ORIGIN;

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
    };

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || DEFAULT_DPR;
      const cycleHeight = height * SECTIONS.length;
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

    const handleScroll = () => {
      recenterInfiniteScroll(sizeRef.current.cycleHeight, LOOP_MIDDLE_COPY_INDEX);
      scheduleRender();
    };

    // ResizeObserver で canvas の実寸とスクロール再中心化を同期する。
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", handleScroll, { passive: true });

    resize();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = ORIGIN;
      }
    };
  }, []);

  return (
    <main
      ref={hostRef}
      aria-labelledby="ring-showcase-title"
      className="relative min-h-screen overflow-x-hidden bg-[--BC] "
    >
      <h1 id="ring-showcase-title" className="sr-only">
        {SHOWCASE_TITLE}
      </h1>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
      <VideoRingOverlay
        innerSize={videoOverlayState.innerSize}
        left={videoOverlayState.left}
        ringSegmentCount={RING_SEGMENTS.length}
        ringSize={videoOverlayState.ringSize}
        top={videoOverlayState.top}
        videoStep={videoOverlayState.videoStep}
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          ref={debugRingRef}
          className="absolute overflow-hidden rounded-full"
          style={{ transformOrigin: "50% 50%" }}
        >
          {RING_SEGMENTS.map((segment, index) => (
            <div
              key={segment.id}
              className={DEBUG_SEGMENT_POSITIONS[index]}
              style={{ backgroundColor: `var(${segment.colorVar})`, opacity: TEST_SEGMENT_OPACITY }}
            />
          ))}
          <div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              backgroundColor: "var(--BC)",
              height: "calc(100% - var(--wid))",
              width: "calc(100% - var(--wid))",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      </div>
      <article className="relative z-10 ml-auto w-[var(--wid)] px-[var(--PX)]">
        {Array.from({ length: LOOP_COPY_COUNT }).map((_, copyIndex) => (
          <SectionCopy key={`copy-${copyIndex}`} copyIndex={copyIndex} />
        ))}
      </article>
    </main>
  );
}
