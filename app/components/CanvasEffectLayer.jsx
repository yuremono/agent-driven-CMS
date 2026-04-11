"use client";

import { useEffect } from "react";

import {
  cancelEveryOtherAnimationFrame,
  requestEveryOtherAnimationFrame,
} from "./everyOtherAnimationFrame.js";

const HOST_CLASS = "CanvasEffect";
const CANVAS_CLASS = "CanvasEffectCanvas";
const STEP_MS = 192;
const ACTIVE_ROOT_MARGIN_RATIO = 0.5;
const ACTIVE_ROOT_MARGIN = "50% 0px";
const DEFAULT_VARIANCE = 0.0;
const DEFAULT_IMAGE_SRC = "/images/home/clip01.png";
const DEFAULT_CLIP_BACKGROUND_VAR = "--WH";
const DEFAULT_IMAGE_ALPHA = 1;

const controllers = new Set();
const controllerByHost = new WeakMap();
let scanObserver = null;
let visibilityObserver = null;
let stepTimer = 0;
let frameStep = 0;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hashString(input) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function pseudoRandom(seed, step, index) {
  const value = Math.sin(seed * 0.0001 + step * 12.9898 + index * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function readVariance(host) {
  const raw = host.dataset.canvasVariance;
  if (!raw) return DEFAULT_VARIANCE;

  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? clamp(parsed, 0.04, 0.5) : DEFAULT_VARIANCE;
}

function readClipBackground(host, styles) {
  const raw = host.dataset.canvasBackground;
  if (raw) {
    return raw.startsWith("--") ? styles.getPropertyValue(raw).trim() || raw : raw;
  }

  return styles.getPropertyValue(DEFAULT_CLIP_BACKGROUND_VAR).trim() || "#fff";
}

function readImageAlpha(host) {
  const raw = host.dataset.canvasImageAlpha;
  if (!raw) return DEFAULT_IMAGE_ALPHA;

  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? clamp(parsed, 0, 1) : DEFAULT_IMAGE_ALPHA;
}

function readText(host) {
  return host.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function syncHostBox(host, canvas, width, height, padding, dpr) {
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.left = `-${padding}px`;
  canvas.style.top = `-${padding}px`;
}

function syncOffscreenBox(canvas, width, height, dpr) {
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
}

function loadImage(src) {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  return image;
}

function isHostNearViewport(host) {
  const rect = host.getBoundingClientRect();
  const viewportHeight = window.innerHeight || 0;
  const viewportWidth = window.innerWidth || 0;
  const verticalMargin = viewportHeight * ACTIVE_ROOT_MARGIN_RATIO;
  const horizontalMargin = viewportWidth * ACTIVE_ROOT_MARGIN_RATIO;

  return (
    rect.bottom >= -verticalMargin &&
    rect.top <= viewportHeight + verticalMargin &&
    rect.right >= -horizontalMargin &&
    rect.left <= viewportWidth + horizontalMargin
  );
}

function drawController(controller, step) {
  const { host, canvas, ctx } = controller;

  if (!host.isConnected) return false;

  const rect = host.getBoundingClientRect();
  if (!rect.width || !rect.height) return true;

  const dpr = window.devicePixelRatio || 1;
  const styles = window.getComputedStyle(host);
  const text = readText(host);
  if (!text) return true;

  controller.seed = hashString(text);

  const fontSize = Number.parseFloat(styles.fontSize) || 16;
  const fontWeight = styles.fontWeight || "400";
  const fontStyle = styles.fontStyle || "normal";
  const fontFamily = styles.fontFamily || "serif";
  const lineHeight = styles.lineHeight === "normal" ? fontSize * 1.00 : Number.parseFloat(styles.lineHeight) || fontSize * 1.00;
  const letterSpacing = styles.letterSpacing === "normal" ? 0 : Number.parseFloat(styles.letterSpacing) || 0;
  const variance = readVariance(host);
  const padding = Math.max(6, Math.ceil(fontSize * (0.18 + variance * 0.4)));
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;
  const imageSrc = host.dataset.canvasImage || DEFAULT_IMAGE_SRC;
  const clipBackground = readClipBackground(host, styles);
  const imageAlpha = readImageAlpha(host);

  syncHostBox(host, canvas, width, height, padding, dpr);
  syncOffscreenBox(controller.fillCanvas, width, height, dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if ("letterSpacing" in ctx) {
    try {
      ctx.letterSpacing = `${letterSpacing}px`;
    } catch {
      // Ignore browsers that expose the property but reject assignment.
    }
  }

  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const stepSeed = controller.seed + step * 97;
  const lineMetrics = lines.map((line) => ctx.measureText(line));
  const textHeight = Math.max(lineHeight, lineMetrics.reduce((max, metrics) => Math.max(max, (metrics.actualBoundingBoxAscent || fontSize * 0.8) + (metrics.actualBoundingBoxDescent || fontSize * 0.2)), 0));
  const topOffset = padding + Math.max(0, (rect.height - textHeight) / 2);
  const fillCtx = controller.fillCtx;
  const fillImage = controller.fillImage;
  const imageReady = fillImage.complete && fillImage.naturalWidth > 0;

  fillCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  fillCtx.clearRect(0, 0, width, height);
  fillCtx.imageSmoothingEnabled = true;
  fillCtx.textAlign = "left";
  fillCtx.textBaseline = "alphabetic";
  fillCtx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  fillCtx.fillStyle = "#000";
  fillCtx.strokeStyle = "#000";
  fillCtx.lineJoin = "round";
  fillCtx.lineCap = "round";
  if ("letterSpacing" in fillCtx) {
    try {
      fillCtx.letterSpacing = `${letterSpacing}px`;
    } catch {
      // Ignore browsers that expose the property but reject assignment.
    }
  }

  fillCtx.globalCompositeOperation = "source-over";

  lines.forEach((line, lineIndex) => {
    const metrics = lineMetrics[lineIndex];
    const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
    const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2;
    const rowCenterY = topOffset + lineIndex * lineHeight + lineHeight / 2;
    const baselineY = rowCenterY + (ascent - descent) / 2;
    const wobble = Math.max(1.2, fontSize * (0.02 + variance * 0.06));
//     const lineWidth = Math.max(1, fontSize * (0.1 + variance * 0));
    const lineWidth = 10;
    const passes = 10;

    ctx.lineWidth = lineWidth;
    fillCtx.lineWidth = lineWidth;

    for (let pass = 0; pass < passes; pass += 1) {
      const localStep = stepSeed + lineIndex * 17 + pass * 13;
      const angle = pseudoRandom(localStep, step, pass) * Math.PI * 2;
      const radius = wobble * (0.55 + pseudoRandom(localStep + 11, step, pass + 1) * 0.95);
      const dx = Math.cos(angle) * radius;
      const dy = Math.sin(angle) * radius;
      fillCtx.strokeText(line, padding + dx, baselineY + dy);
    }

    fillCtx.lineWidth = Math.max(2, lineWidth * 0.9);
    fillCtx.strokeText(line, padding, baselineY);
    fillCtx.fillText(line, padding, baselineY);

    if (descent > 0) {
      fillCtx.strokeText(line, padding, baselineY + 0.5);
    }
  });

  fillCtx.globalCompositeOperation = "source-in";
  fillCtx.fillStyle = clipBackground;
  fillCtx.fillRect(0, 0, width, height);

  if (imageReady && imageAlpha > 0) {
    fillCtx.globalCompositeOperation = "source-atop";
    fillCtx.globalAlpha = imageAlpha;
    fillCtx.drawImage(fillImage, 0, 0, width, height);
    fillCtx.globalAlpha = 1;
  }

  fillCtx.globalCompositeOperation = "source-over";

  if (!fillImage.src || fillImage.src !== new URL(imageSrc, window.location.href).href) {
    fillImage.src = imageSrc;
  }

  ctx.drawImage(controller.fillCanvas, 0, 0, width, height);

  return true;
}

function unbindController(controller) {
  controller.resizeObserver.disconnect();
  visibilityObserver?.unobserve(controller.host);
  controllerByHost.delete(controller.host);
  controller.fillImage.onload = null;
  controller.canvas.remove();
  controllers.delete(controller);
}

function hasActiveControllers() {
  for (const controller of controllers) {
    if (controller.active) return true;
  }

  return false;
}

function drawAll(step) {
  Array.from(controllers).forEach((controller) => {
    if (!controller.host.isConnected) {
      unbindController(controller);
      return;
    }

    if (!controller.active) return;

    const alive = drawController(controller, step);
    if (!alive) {
      unbindController(controller);
    }
  });
}

function ensureTimer() {
  if (stepTimer || !hasActiveControllers()) return;

  stepTimer = window.setInterval(() => {
    frameStep += 1;
    drawAll(frameStep);
  }, STEP_MS);
}

function stopTimerIfIdle() {
  if (hasActiveControllers() || !stepTimer) return;

  window.clearInterval(stepTimer);
  stepTimer = 0;
}

function setControllerActive(controller, active) {
  if (!controller.host.isConnected) {
    unbindController(controller);
    return;
  }

  if (controller.active === active) return;

  controller.active = active;

  if (active) {
    drawController(controller, frameStep);
    ensureTimer();
    return;
  }

  stopTimerIfIdle();
}

function getVisibilityObserver() {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return null;
  }

  if (visibilityObserver) return visibilityObserver;

  visibilityObserver = new window.IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const controller = controllerByHost.get(entry.target);
        if (!controller) return;

        setControllerActive(
          controller,
          entry.isIntersecting || entry.intersectionRatio > 0,
        );
      });
    },
    { rootMargin: ACTIVE_ROOT_MARGIN },
  );

  return visibilityObserver;
}

function bindHost(host) {
  if (host.dataset.canvasEffectBound === "1") return;

  const existingCanvas = host.querySelector(`:scope > .${CANVAS_CLASS}`);
  const canvas = existingCanvas instanceof HTMLCanvasElement ? existingCanvas : document.createElement("canvas");
  if (!existingCanvas) {
    canvas.className = CANVAS_CLASS;
    canvas.setAttribute("aria-hidden", "true");
    host.prepend(canvas);
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const visibility = getVisibilityObserver();
  const controller = {
    active: visibility ? isHostNearViewport(host) : true,
    canvas,
    ctx,
    fillCanvas: document.createElement("canvas"),
    fillImage: loadImage(host.dataset.canvasImage || DEFAULT_IMAGE_SRC),
    host,
    resizeObserver: new ResizeObserver(() => {
      if (controller.active) {
        drawController(controller, frameStep);
      }
    }),
    seed: hashString(readText(host)),
  };

  controller.fillCtx = controller.fillCanvas.getContext("2d");

  if (!controller.fillCtx) return;

  host.dataset.canvasEffectBound = "1";
  host.dataset.canvasEffectSeed = String(hashString(readText(host)));

  controller.fillImage.onload = () => {
    if (controller.active) {
      drawController(controller, frameStep);
    }
  };

  controllerByHost.set(host, controller);
  visibility?.observe(host);
  controller.resizeObserver.observe(host);
  controllers.add(controller);
  if (controller.active) {
    drawController(controller, frameStep);
  }
  ensureTimer();
}

function scanCanvasEffects(root = document) {
  const hosts = Array.from(root.querySelectorAll(`.${HOST_CLASS}`));

  hosts.forEach((host) => {
    if (!(host instanceof HTMLElement)) return;
    bindHost(host);
  });

  controllers.forEach((controller) => {
    if (!controller.host.isConnected) {
      unbindController(controller);
    }
  });

  stopTimerIfIdle();
}

export default function CanvasEffectLayer() {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    let scanFrame = 0;
    const scheduleScan = () => {
      if (scanFrame) return;

      scanFrame = requestEveryOtherAnimationFrame(() => {
        scanFrame = 0;
        scanCanvasEffects();
      });
    };

    scanCanvasEffects();

    scanObserver = new MutationObserver(scheduleScan);

    scanObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      scanObserver?.disconnect();
      scanObserver = null;
      visibilityObserver?.disconnect();
      visibilityObserver = null;

      if (scanFrame) {
        cancelEveryOtherAnimationFrame(scanFrame);
      }

      controllers.forEach((controller) => {
        unbindController(controller);
      });

      stopTimerIfIdle();
    };
  }, []);

  return null;
}
