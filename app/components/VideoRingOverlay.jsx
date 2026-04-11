"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  clampUnit,
  getOpeningRingCenter,
  getRingSectorSvgPathD,
  TAU,
} from "./ringScrollShowcaseGeometry.js";
import {
  getLoadPercent,
  getTimedLoadPercent,
  hasAllSectorsReady,
  isVideoReadyForOpening,
} from "./videoRingOverlayProgress.js";

const DEFAULT_MEDIA_ITEMS = [
  { src: "/video/001.mp4", kind: "video" },
  { src: "/video/002.mp4", kind: "video" },
  { src: "/video/003.mp4", kind: "video" },
  { src: "/video/004.mp4", kind: "video" },
];

const MIN_LOADING_MS = 1000;
const RELOCATE_MS = 1000;
const REVEAL_MS = 2000;

function easeOutCubic(t) {
  const x = 1 - t;
  return 1 - x * x * x;
}

function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function getVideoLoadProgress(video) {
  if (!(video instanceof HTMLVideoElement)) return 0;

  const duration = Number(video.duration);
  if (Number.isFinite(duration) && duration > 0 && video.buffered.length > 0) {
    try {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      return clampUnit(bufferedEnd / duration);
    } catch {
      // buffered range can disappear while a new range is being appended.
    }
  }

  if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) return 1;
  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return 0.75;
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return 0.5;
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return 0.15;
  return 0;
}

const VideoRingOverlay = forwardRef(function VideoRingOverlay(
  {
    innerSize,
    mediaItems = DEFAULT_MEDIA_ITEMS,
    ringCenterY,
    ringSegmentCount,
    viewportWidth,
    viewportHeight,
    onLayoutReady,
  },
  ref,
) {
  const maskPathRefs = useRef([]);
  const loaderStrokePathRefs = useRef([]);
  const geometryRef = useRef(null);
  const openingPhaseRef = useRef("loading");
  const revealProgressRef = useRef(0);
  const revealDoneRef = useRef(false);
  const revealRafRef = useRef(null);
  const revealStartRef = useRef(0);
  const relocateProgressRef = useRef(0);
  const relocateRafRef = useRef(null);
  const relocateStartRef = useRef(0);
  const pendingStartRef = useRef(false);
  const videoRefs = useRef([]);
  const imgRefs = useRef([]);
  const sectorReadyRef = useRef([]);
  const sectorLoadProgressRef = useRef([]);
  const rawLoadPercentRef = useRef(0);
  const displayLoadPercentRef = useRef(0);
  const loadDisplayRafRef = useRef(null);
  const loadingStartRef = useRef(0);
  const reactId = useId();
  const maskIdBase = `vring-${reactId.replace(/:/g, "")}`;

  const [openingPhase, setOpeningPhase] = useState("loading");
  const [loadPercent, setLoadPercent] = useState(0);
  const [displayLoadPercent, setDisplayLoadPercent] = useState(0);
  const [showLoadingStroke, setShowLoadingStroke] = useState(true);
  const [loadingTextOpacity, setLoadingTextOpacity] = useState(1);
  const [mounted, setMounted] = useState(false);

  const mediaCount = Math.max(1, mediaItems.length);
  const mediaSrcKey = mediaItems.map((m) => `${m.src}:${m.kind ?? "video"}`).join("|");

  const setOpeningPhaseState = useCallback((nextPhase) => {
    openingPhaseRef.current = nextPhase;
    setOpeningPhase(nextPhase);
  }, []);

  const getCurrentRingCenter = useCallback(() => {
    const currentPhase = openingPhaseRef.current;
    const progress =
      currentPhase === "loading"
        ? 0
        : currentPhase === "relocating" || currentPhase === "revealing" || currentPhase === "done"
          ? relocateProgressRef.current
          : 1;

    return getOpeningRingCenter(
      viewportWidth,
      viewportHeight,
      ringCenterY,
      progress,
    );
  }, [ringCenterY, viewportHeight, viewportWidth]);

  const setDisplayLoadPercentState = useCallback((nextPercent) => {
    displayLoadPercentRef.current = nextPercent;
    setDisplayLoadPercent(nextPercent);
  }, []);

  const updateLoadPercent = useCallback(() => {
    const nextPercent = getLoadPercent(
      sectorLoadProgressRef.current.slice(0, ringSegmentCount),
    );
    rawLoadPercentRef.current = nextPercent;
    setLoadPercent(nextPercent);
  }, [ringSegmentCount]);

  const commitLoadProgress = useCallback(
    (sectorIndex, nextProgress) => {
      sectorLoadProgressRef.current[sectorIndex] = clampUnit(nextProgress);
      updateLoadPercent();
    },
    [updateLoadPercent],
  );

  const updateMaskAndLoaderPaths = useCallback(() => {
    const geom = geometryRef.current;
    if (!geom) return;

    const { innerRadius, outerRadius, rotation, segmentCount } = geom;
    const span = TAU / segmentCount;
    const ringCenter = getCurrentRingCenter();
    const currentPhase = openingPhaseRef.current;

    let revealT = 0;
    if (currentPhase === "revealing" || currentPhase === "done") {
      revealT = revealDoneRef.current ? 1 : revealProgressRef.current;
    }

    const effectiveOuter =
      innerRadius +
      Math.max(0, outerRadius - innerRadius) * easeOutCubic(revealT);

    for (let i = 0; i < segmentCount; i += 1) {
      const startAngle = rotation + i * span;
      const endAngle = rotation + (i + 1) * span;
      const dMask = getRingSectorSvgPathD(
        ringCenter.cx,
        ringCenter.cy,
        innerRadius,
        effectiveOuter,
        startAngle,
        endAngle,
      );
      maskPathRefs.current[i]?.setAttribute("d", dMask);

      const dStroke = getRingSectorSvgPathD(
        ringCenter.cx,
        ringCenter.cy,
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
      );
      loaderStrokePathRefs.current[i]?.setAttribute("d", dStroke);
    }
  }, [getCurrentRingCenter]);

  const stopRevealAnimation = useCallback(() => {
    if (revealRafRef.current != null) {
      cancelAnimationFrame(revealRafRef.current);
      revealRafRef.current = null;
    }
  }, []);

  const stopRelocateAnimation = useCallback(() => {
    if (relocateRafRef.current != null) {
      cancelAnimationFrame(relocateRafRef.current);
      relocateRafRef.current = null;
    }
  }, []);

  const stopLoadDisplayAnimation = useCallback(() => {
    if (loadDisplayRafRef.current != null) {
      cancelAnimationFrame(loadDisplayRafRef.current);
      loadDisplayRafRef.current = null;
    }
  }, []);

  const runRevealAnimation = useCallback(() => {
    stopRevealAnimation();

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setShowLoadingStroke(false);
    setOpeningPhaseState("revealing");

    if (reducedMotion) {
      revealProgressRef.current = 1;
      revealDoneRef.current = true;
      setOpeningPhaseState("done");
      updateMaskAndLoaderPaths();
      return;
    }

    revealStartRef.current = performance.now();
    const tick = (now) => {
      const elapsed = now - revealStartRef.current;
      const t = Math.min(1, elapsed / REVEAL_MS);
      revealProgressRef.current = t;
      updateMaskAndLoaderPaths();
      if (t < 1) {
        revealRafRef.current = requestAnimationFrame(tick);
      } else {
        revealDoneRef.current = true;
        revealRafRef.current = null;
        setOpeningPhaseState("done");
      }
    };
    revealRafRef.current = requestAnimationFrame(tick);
  }, [setOpeningPhaseState, stopRevealAnimation, updateMaskAndLoaderPaths]);

  const runRelocateAnimation = useCallback(() => {
    stopRelocateAnimation();

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setOpeningPhaseState("relocating");

    if (reducedMotion) {
      relocateProgressRef.current = 1;
      setLoadingTextOpacity(0);
      updateMaskAndLoaderPaths();
      runRevealAnimation();
      return;
    }

    relocateStartRef.current = performance.now();
    const tick = (now) => {
      const elapsed = now - relocateStartRef.current;
      const t = Math.min(1, elapsed / RELOCATE_MS);
      const relocateEased = easeOutCubic(t);
      const loadingEased = easeInOutSine(t);
      relocateProgressRef.current = relocateEased;
      setLoadingTextOpacity(1 - loadingEased);
      updateMaskAndLoaderPaths();
      if (t < 1) {
        relocateRafRef.current = requestAnimationFrame(tick);
      } else {
        relocateProgressRef.current = 1;
        relocateRafRef.current = null;
        setLoadingTextOpacity(0);
        runRevealAnimation();
      }
    };
    relocateRafRef.current = requestAnimationFrame(tick);
  }, [runRevealAnimation, setOpeningPhaseState, stopRelocateAnimation, updateMaskAndLoaderPaths]);

  const checkAllSectorsReady = useCallback(() => {
    return hasAllSectorsReady(sectorReadyRef.current, ringSegmentCount);
  }, [ringSegmentCount]);

  const tryStartOpeningSequence = useCallback(() => {
    updateLoadPercent();
    if (!checkAllSectorsReady()) return;
    if (displayLoadPercentRef.current < 100) return;
    if (!geometryRef.current) {
      pendingStartRef.current = true;
      return;
    }
    if (openingPhaseRef.current !== "loading") return;
    pendingStartRef.current = false;
    runRelocateAnimation();
  }, [checkAllSectorsReady, runRelocateAnimation, updateLoadPercent]);

  const markSectorReady = useCallback(
    (sectorIndex) => {
      if (sectorReadyRef.current[sectorIndex]) return;
      sectorReadyRef.current[sectorIndex] = true;
      sectorLoadProgressRef.current[sectorIndex] = 1;
      updateLoadPercent();
      tryStartOpeningSequence();
    },
    [tryStartOpeningSequence, updateLoadPercent],
  );

  const resetLoadState = useCallback(() => {
    stopRevealAnimation();
    stopRelocateAnimation();
    stopLoadDisplayAnimation();
    pendingStartRef.current = false;
    revealDoneRef.current = false;
    revealProgressRef.current = 0;
    relocateProgressRef.current = 0;
    sectorReadyRef.current = Array.from({ length: ringSegmentCount }, () => false);
    sectorLoadProgressRef.current = Array.from({ length: ringSegmentCount }, () => 0);
    rawLoadPercentRef.current = 0;
    displayLoadPercentRef.current = 0;
    loadingStartRef.current = typeof performance !== "undefined" ? performance.now() : 0;
    setOpeningPhaseState("loading");
    setLoadPercent(0);
    setDisplayLoadPercent(0);
    setLoadingTextOpacity(1);
    setShowLoadingStroke(true);
    updateMaskAndLoaderPaths();
  }, [
    ringSegmentCount,
    setOpeningPhaseState,
    stopLoadDisplayAnimation,
    stopRevealAnimation,
    stopRelocateAnimation,
    updateMaskAndLoaderPaths,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      setRingGeometry(payload) {
        if (
          !payload ||
          typeof payload.cx !== "number" ||
          typeof payload.cy !== "number" ||
          typeof payload.innerRadius !== "number" ||
          typeof payload.outerRadius !== "number" ||
          typeof payload.rotation !== "number" ||
          typeof payload.segmentCount !== "number"
        ) {
          return;
        }
        geometryRef.current = payload;
        updateMaskAndLoaderPaths();
        if (pendingStartRef.current && openingPhaseRef.current === "loading") {
          pendingStartRef.current = false;
          runRelocateAnimation();
        }
      },
    }),
    [runRelocateAnimation, updateMaskAndLoaderPaths],
  );

  useEffect(() => {
    resetLoadState();
  }, [mediaSrcKey, ringSegmentCount, resetLoadState]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const syncCachedMediaReady = useCallback(() => {
    for (let i = 0; i < ringSegmentCount; i += 1) {
      const item = mediaItems[i % mediaCount] ?? mediaItems[0];
      if (item?.kind === "image") {
        const img = imgRefs.current[i];
        if (img?.complete && img.naturalWidth > 0) {
          markSectorReady(i);
        }
      } else {
        const video = videoRefs.current[i];
        if (video instanceof HTMLVideoElement) {
          if (isVideoReadyForOpening(video.readyState)) {
            markSectorReady(i);
          } else {
            commitLoadProgress(i, getVideoLoadProgress(video));
          }
        }
      }
    }
  }, [commitLoadProgress, markSectorReady, mediaItems, mediaCount, ringSegmentCount]);

  useEffect(() => {
    return () => {
      stopLoadDisplayAnimation();
      stopRevealAnimation();
      stopRelocateAnimation();
    };
  }, [stopLoadDisplayAnimation, stopRevealAnimation, stopRelocateAnimation]);

  useEffect(() => {
    videoRefs.current.forEach((node) => {
      if (!node) return;
      if (node instanceof HTMLVideoElement) {
        node.load();
        node.play().catch(() => {});
      }
    });
    const id = requestAnimationFrame(() => {
      syncCachedMediaReady();
    });
    return () => cancelAnimationFrame(id);
  }, [ringSegmentCount, mediaSrcKey, syncCachedMediaReady]);

  useEffect(() => {
    if (!viewportWidth || !viewportHeight) return;
    onLayoutReady?.();
  }, [viewportWidth, viewportHeight, innerSize, onLayoutReady]);

  useEffect(() => {
    updateMaskAndLoaderPaths();
  }, [loadingTextOpacity, openingPhase, updateMaskAndLoaderPaths]);

  useEffect(() => {
    if (openingPhase !== "loading") {
      stopLoadDisplayAnimation();
      return;
    }

    const shouldAnimate =
      displayLoadPercentRef.current < loadPercent ||
      (loadPercent >= 100 && displayLoadPercentRef.current < 100);

    if (!shouldAnimate) {
      if (loadPercent >= 100 && displayLoadPercentRef.current >= 100) {
        tryStartOpeningSequence();
      }
      return;
    }

    const tick = (now) => {
      if (!loadingStartRef.current) {
        loadingStartRef.current = now;
      }

      const nextPercent = getTimedLoadPercent(
        rawLoadPercentRef.current,
        now - loadingStartRef.current,
        MIN_LOADING_MS,
      );

      setDisplayLoadPercentState(nextPercent);

      const shouldContinue =
        openingPhaseRef.current === "loading" &&
        (nextPercent < rawLoadPercentRef.current ||
          (rawLoadPercentRef.current >= 100 && nextPercent < 100));

      if (shouldContinue) {
        loadDisplayRafRef.current = requestAnimationFrame(tick);
        return;
      }

      loadDisplayRafRef.current = null;
      if (nextPercent >= 100) {
        tryStartOpeningSequence();
      }
    };

    if (loadDisplayRafRef.current == null) {
      loadDisplayRafRef.current = requestAnimationFrame(tick);
    }
  }, [
    loadPercent,
    openingPhase,
    setDisplayLoadPercentState,
    stopLoadDisplayAnimation,
    tryStartOpeningSequence,
  ]);

  const progressLabel = `${displayLoadPercent}%`;
  const loadingTextVisible = openingPhase === "loading" || loadingTextOpacity > 0;
  const loadingOverlayOpacity =
    openingPhase === "loading" ? 1 : clampUnit(loadingTextOpacity);
  const loadingTextShift = (1 - loadingOverlayOpacity) * -36;
  const canRenderMedia = viewportWidth > 0 && viewportHeight > 0;
  const ringCenter = canRenderMedia
    ? getCurrentRingCenter()
    : { cx: 0, cy: 0 };
  const holeX = ringCenter.cx - innerSize / 2;
  const holeY = ringCenter.cy - innerSize / 2;
  const loadingPortalTarget =
    mounted && typeof document !== "undefined" ? document.body : null;
  const loadingLayer = (
    <div
      data-l="LoadingLayer"
      aria-hidden="true"
      className={`fixed inset-0 z-[120] bg-[var(--WH)] transition-opacity duration-[1000ms] ease-out ${
        openingPhase === "done" ? "pointer-events-none" : "pointer-events-auto"
      }`}
      style={{ opacity: loadingOverlayOpacity }}
    >
      <div data-l="LoadingStage" className="relative h-full w-full">
        {loadingTextVisible ? (
          <div
            data-l="LoadingValue"
            className="absolute left-1/2 top-1/2 text-[clamp(2.5rem,6vw,5.75rem)] italic leading-none tracking-[-0.06em] text-[var(--TC)] transition-[transform,opacity] duration-[1000ms] ease-out"
            style={{
              opacity: loadingOverlayOpacity,
              transform: `translate(-50%, -50%) translateX(${loadingTextShift}vw)`,
            }}
          >
            {progressLabel}
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      {loadingPortalTarget
        ? createPortal(loadingLayer, loadingPortalTarget)
        : loadingLayer}
      {canRenderMedia ? (
        <div
          data-l="VideoRingLayer"
          aria-hidden="true"
          className="SVGwrap pointer-events-none fixed inset-0 z-[1] overflow-hidden"
        >
          <svg
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 block"
            height={viewportHeight}
            width={viewportWidth}
          >
            <defs>
              {Array.from({ length: ringSegmentCount }).map((_, sectorIndex) => (
                <mask
                  key={`mask-${sectorIndex}`}
                  height={viewportHeight}
                  id={`${maskIdBase}-s${sectorIndex}`}
                  maskContentUnits="userSpaceOnUse"
                  maskUnits="userSpaceOnUse"
                  width={viewportWidth}
                  x={0}
                  y={0}
                >
                  <rect fill="black" height={viewportHeight} width={viewportWidth} x={0} y={0} />
                  <path
                    ref={(node) => {
                      maskPathRefs.current[sectorIndex] = node;
                    }}
                    fill="white"
                  />
                </mask>
              ))}
            </defs>
            {/* {showLoadingStroke ? (
              <g
                className="vring-loader-stroke-anim text-white/70"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              >
                {Array.from({ length: ringSegmentCount }).map((_, sectorIndex) => (
                  <path
                    key={`loader-${sectorIndex}`}
                    ref={(node) => {
                      loaderStrokePathRefs.current[sectorIndex] = node;
                    }}
                    strokeDasharray="14 22"
                    strokeDashoffset={0}
                  />
                ))}
              </g>
            ) : null} */}
          </svg>
          {Array.from({ length: ringSegmentCount }).map((_, sectorIndex) => {
            const item = mediaItems[sectorIndex % mediaCount] ?? mediaItems[0];
            const maskRef = `url(#${maskIdBase}-s${sectorIndex})`;
            const isImage = item?.kind === "image";

            const markReady = () => {
              markSectorReady(sectorIndex);
            };

            const markProgress = (event) => {
              const video = event.currentTarget;
              if (isVideoReadyForOpening(video.readyState)) {
                markSectorReady(sectorIndex);
                return;
              }
              commitLoadProgress(sectorIndex, getVideoLoadProgress(video));
            };

            return (
              <div
                data-l={`MediaSector${sectorIndex + 1}`}
                key={`sector-${sectorIndex}`}
                className="pointer-events-none fixed inset-0"
                style={{
                  height: "100vh",
                  maskImage: maskRef,
                  maskRepeat: "no-repeat",
                  maskSize: `${viewportWidth}px ${viewportHeight}px`,
                  width: "100vw",
                  WebkitMaskImage: maskRef,
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskSize: `${viewportWidth}px ${viewportHeight}px`,
                }}
              >
                {isImage ? (
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    ref={(node) => {
                      imgRefs.current[sectorIndex] = node;
                    }}
                    src={item.src}
                    onError={markReady}
                    onLoad={markReady}
                  />
                ) : (
                  <video
                    autoPlay
                    className="h-full w-full object-cover"
                    loop
                    muted
                    playsInline
                    preload="auto"
                    ref={(node) => {
                      videoRefs.current[sectorIndex] = node;
                    }}
                    src={item.src}
                    onCanPlay={markReady}
                    onCanPlayThrough={markReady}
                    onError={markReady}
                    onLoadedData={markProgress}
                    onLoadedMetadata={markProgress}
                    onProgress={markProgress}
                  />
                )}
              </div>
            );
          })}
          {innerSize > 0 ? (
            <div
              data-l="CenterHole"
              className="pointer-events-none fixed rounded-full"
              style={{
                backgroundColor: "var(--TR)",
                height: `${innerSize}px`,
                left: `${holeX}px`,
                top: `${holeY}px`,
                width: `${innerSize}px`,
              }}
            />
          ) : null}
        </div>
      ) : null}
    </>
  );
});

export default VideoRingOverlay;
