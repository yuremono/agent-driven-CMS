"use client";

import { useEffect, useRef } from "react";

const VIDEO_SOURCES = [
  "/video/001.mp4",
  "/video/002.mp4",
  "/video/003.mp4",
  "/video/004.mp4",
  "/video/005.mp4",
];

const SECTOR_CLIP_PATHS = [
  "polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)",
  "polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)",
  "polygon(0% 50%, 50% 50%, 50% 100%, 0% 100%)",
  "polygon(0% 0%, 50% 0%, 50% 50%, 0% 50%)",
];

export default function VideoRingOverlay({
  innerSize,
  ringSize,
  top,
  left,
  videoStep,
  ringSegmentCount,
}) {
  const videoRefs = useRef([]);

  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (!video) return;
      video.load();
      video.play().catch(() => {});
    });
  }, [ringSegmentCount, videoStep]);

  if (!ringSize) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      <div
        className="absolute overflow-hidden rounded-full"
        style={{
          height: `${ringSize}px`,
          left: `${left}px`,
          top: `${top}px`,
          width: `${ringSize}px`,
        }}
      >
        {Array.from({ length: ringSegmentCount }).map((_, sectorIndex) => {
          const videoIndex = (videoStep + sectorIndex) % VIDEO_SOURCES.length;

          return (
            <div
              key={`sector-${sectorIndex}-video-${videoIndex}`}
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: SECTOR_CLIP_PATHS[sectorIndex] }}
            >
              <video
                autoPlay
                className="absolute inset-0 h-full w-full object-cover"
                loop
                muted
                playsInline
                preload="auto"
                ref={(node) => {
                  videoRefs.current[sectorIndex] = node;
                }}
                src={VIDEO_SOURCES[videoIndex]}
              />
            </div>
          );
        })}
        <div
          className="absolute left-1/2 top-1/2 rounded-full bg-[--BC]"
          style={{
            height: `${innerSize}px`,
            transform: "translate(-50%, -50%)",
            width: `${innerSize}px`,
          }}
        />
      </div>
    </div>
  );
}
