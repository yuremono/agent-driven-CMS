export function clamp01(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(1, Math.max(0, numeric));
}

export function averageProgress(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;

  let total = 0;
  let count = 0;

  for (const value of values) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) continue;
    total += clamp01(numeric);
    count += 1;
  }

  if (count === 0) return 0;
  return total / count;
}

export function getLoadPercent(values) {
  return Math.round(averageProgress(values) * 100);
}

export function clampPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

export function getTimedLoadPercent(actualPercent, elapsedMs, minimumDurationMs = 1000) {
  const safeActualPercent = clampPercent(actualPercent);
  const safeMinimumDurationMs = Number(minimumDurationMs);

  if (!Number.isFinite(safeMinimumDurationMs) || safeMinimumDurationMs <= 0) {
    return safeActualPercent;
  }

  const safeElapsedMs = Math.max(0, Number(elapsedMs) || 0);
  const timedCap = Math.min(
    100,
    Math.floor((safeElapsedMs / safeMinimumDurationMs) * 100),
  );

  return Math.min(safeActualPercent, timedCap);
}

export function hasAllSectorsReady(readyFlags, segmentCount) {
  if (!Array.isArray(readyFlags)) return false;
  if (!Number.isFinite(segmentCount) || segmentCount <= 0) return false;

  for (let i = 0; i < segmentCount; i += 1) {
    if (!readyFlags[i]) return false;
  }

  return true;
}

export function isVideoReadyForOpening(readyState) {
  const numeric = Number(readyState);
  if (!Number.isFinite(numeric)) return false;
  return numeric >= 3;
}

export function getOpeningCenterX(viewportWidth, progress, startX = viewportWidth / 2, endX = 0) {
  const t = clamp01(progress);
  return startX + (endX - startX) * t;
}
