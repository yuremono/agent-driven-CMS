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

import { getRingSectorSvgPathD, TAU } from "./ringScrollShowcaseGeometry.js";

const DEFAULT_MEDIA_ITEMS = [
  { src: "/video/001.mp4", kind: "video" },
  { src: "/video/002.mp4", kind: "video" },
  { src: "/video/003.mp4", kind: "video" },
  { src: "/video/004.mp4", kind: "video" },
];

const REVEAL_MS = 2750;

function easeOutCubic(t) {
  const x = 1 - t;
  return 1 - x * x * x;
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
  const revealProgressRef = useRef(0);
  const allReadyRef = useRef(false);
  const revealDoneRef = useRef(false);
  const revealRafRef = useRef(null);
  const revealStartRef = useRef(0);
  const pendingRevealRef = useRef(false);
  const videoRefs = useRef([]);
  const imgRefs = useRef([]);
  const sectorReadyRef = useRef([]);
  const reactId = useId();
  const maskIdBase = `vring-${reactId.replace(/:/g, "")}`;

  const [showLoadingStroke, setShowLoadingStroke] = useState(true);

  const mediaCount = Math.max(1, mediaItems.length);
  const mediaSrcKey = mediaItems.map((m) => `${m.src}:${m.kind ?? "video"}`).join("|");

  const updateMaskAndLoaderPaths = useCallback(() => {
    const geom = geometryRef.current;
    if (!geom) return;

    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      rotation,
      segmentCount,
    } = geom;
    const span = TAU / segmentCount;

    let revealT = 0;
    if (allReadyRef.current) {
      if (revealDoneRef.current) {
        revealT = 1;
      } else {
        revealT = revealProgressRef.current;
      }
    }

    const effectiveOuter =
      innerRadius +
      Math.max(0, outerRadius - innerRadius) * easeOutCubic(revealT);

    for (let i = 0; i < segmentCount; i += 1) {
      const startAngle = rotation + i * span;
      const endAngle = rotation + (i + 1) * span;
      const dMask = getRingSectorSvgPathD(
        cx,
        cy,
        innerRadius,
        effectiveOuter,
        startAngle,
        endAngle,
      );
      maskPathRefs.current[i]?.setAttribute("d", dMask);

      const dStroke = getRingSectorSvgPathD(
        cx,
        cy,
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
      );
      loaderStrokePathRefs.current[i]?.setAttribute("d", dStroke);
    }
  }, []);

  const stopRevealAnimation = useCallback(() => {
    if (revealRafRef.current != null) {
      cancelAnimationFrame(revealRafRef.current);
      revealRafRef.current = null;
    }
  }, []);

  const runRevealAnimation = useCallback(() => {
    stopRevealAnimation();
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      revealProgressRef.current = 1;
      revealDoneRef.current = true;
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
      }
    };
    revealRafRef.current = requestAnimationFrame(tick);
  }, [stopRevealAnimation, updateMaskAndLoaderPaths]);

  const checkAllSectorsReady = useCallback(() => {
    const ready = sectorReadyRef.current;
    for (let i = 0; i < ringSegmentCount; i += 1) {
      if (!ready[i]) return false;
    }
    return true;
  }, [ringSegmentCount]);

  const tryStartReveal = useCallback(() => {
    if (allReadyRef.current || !checkAllSectorsReady()) return;
    allReadyRef.current = true;
    setShowLoadingStroke(false);
    revealProgressRef.current = 0;
    revealDoneRef.current = false;
    if (!geometryRef.current) {
      pendingRevealRef.current = true;
      return;
    }
    pendingRevealRef.current = false;
    runRevealAnimation();
  }, [checkAllSectorsReady, runRevealAnimation]);

  const resetLoadState = useCallback(() => {
    stopRevealAnimation();
    pendingRevealRef.current = false;
    allReadyRef.current = false;
    revealDoneRef.current = false;
    revealProgressRef.current = 0;
    sectorReadyRef.current = Array.from({ length: ringSegmentCount }, () => false);
    setShowLoadingStroke(true);
    updateMaskAndLoaderPaths();
  }, [ringSegmentCount, stopRevealAnimation, updateMaskAndLoaderPaths]);

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
        if (
          pendingRevealRef.current &&
          allReadyRef.current &&
          !revealDoneRef.current
        ) {
          pendingRevealRef.current = false;
          runRevealAnimation();
        }
      },
    }),
    [runRevealAnimation, updateMaskAndLoaderPaths],
  );

  useEffect(() => {
    resetLoadState();
  }, [mediaSrcKey, ringSegmentCount, resetLoadState]);

  const syncCachedMediaReady = useCallback(() => {
    for (let i = 0; i < ringSegmentCount; i += 1) {
      const item = mediaItems[i % mediaCount] ?? mediaItems[0];
      if (item?.kind === "image") {
        const img = imgRefs.current[i];
        if (img?.complete && img.naturalWidth > 0) {
          sectorReadyRef.current[i] = true;
        }
      } else {
        const video = videoRefs.current[i];
        if (
          video instanceof HTMLVideoElement &&
          video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA
        ) {
          sectorReadyRef.current[i] = true;
        }
      }
    }
    tryStartReveal();
  }, [mediaItems, mediaCount, ringSegmentCount, tryStartReveal]);

  useEffect(() => {
    return () => {
      stopRevealAnimation();
    };
  }, [stopRevealAnimation]);

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

  if (!viewportWidth || !viewportHeight) return null;

  return (
    <div
      aria-hidden="true"
      className="SVGwrap pointer-events-none fixed inset-0 z-[1] overflow-hidden"
    >
      <style>
        {`
          @keyframes vring-loader-dash {
            to {
              stroke-dashoffset: -120;
            }
          }
          .vring-loader-stroke-anim path {
            animation: vring-loader-dash 1.2s linear infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .vring-loader-stroke-anim path {
              animation: none;
            }
          }
        `}
      </style>
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
        {showLoadingStroke ? (
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
        ) : null}
      </svg>
      {Array.from({ length: ringSegmentCount }).map((_, sectorIndex) => {
        const item = mediaItems[sectorIndex % mediaCount] ?? mediaItems[0];
        const maskRef = `url(#${maskIdBase}-s${sectorIndex})`;
        const isImage = item?.kind === "image";

        const markReady = () => {
          sectorReadyRef.current[sectorIndex] = true;
          tryStartReveal();
        };

        return (
          <div
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
                onCanPlayThrough={markReady}
              />
            )}
          </div>
        );
      })}
      {innerSize > 0 ? (
        <div
          className="pointer-events-none fixed rounded-full"
          style={{
            // ドーナツの穴を覆う円。動画の上に載せて中央を隠す（色は --TR）
            backgroundColor: "var(--TR)",
            height: `${innerSize}px`,
            left: 0,
            top: `${ringCenterY}px`,
            transform: "translate(-50%, -50%)",
            width: `${innerSize}px`,
          }}
        />
      ) : null}
    </div>
  );
});

export default VideoRingOverlay;
