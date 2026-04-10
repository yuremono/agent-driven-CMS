// トップページで使う、既存の CSS 変数名をそのまま参照する。
export const MC = "--MC";
export const SC = "--SC";
export const AC = "--AC";
export const BC = "--BC";
export const TC = "--TC";
export const GR = "--GR";
export const BK = "--BK";
export const WH = "--WH";

// 座標や描画の基準になる共通値。
export const ORIGIN = 0;
export const HALF_RATIO = 0.5;
export const CENTER_RATIO = 0.5;
export const MIN_CANVAS_SIZE = 1;
export const DEFAULT_DPR = 1;

// 影やリングの見え方を決める定数。
export const SHADOW_BLUR = 24;
export const SHADOW_OFFSET_Y = 8;
export const RING_OUTER_RADIUS_RATIO = 1;
export const RING_HOLE_RADIUS_RATIO = 0.2;
export const RING_ROTATION_OFFSET = -(Math.PI * HALF_RATIO);
export const RING_VISIBLE_RATIO_FALLBACK = 1 - RING_HOLE_RADIUS_RATIO;
export const TEST_SEGMENT_OPACITY = 0.3;
export const WID_CSS_VAR = "--wid";

// 角度とスクロールの単位を作るための定数。
const FULL_TURN_MULTIPLIER = 2;
const SEGMENT_COUNT = 4;
export const ROTATION_DIRECTION = -1;
export const TAU = Math.PI * FULL_TURN_MULTIPLIER;
export const SEGMENT_SPAN = TAU / SEGMENT_COUNT;
export const SCROLL_PHASE_OFFSET_SECTIONS = 0.5;

// 背景のグラデーションや光の輪に使う比率。
export const COLOR_STOP_START = 0;
export const COLOR_STOP_MIDDLE = 0.45;
export const COLOR_STOP_END = 1;
export const GLOW_CENTER_X_RATIO = 0.8;
export const GLOW_CENTER_Y_RATIO = 0.2;
export const GRADIENT_MIN_RADIUS = 0;
export const GLOW_RADIUS_RATIO = 0.65;
export const SHADOW_CENTER_X_RATIO = 0.24;
export const SHADOW_CENTER_Y_RATIO = 0.52;
export const SHADOW_RADIUS_RATIO = 0.34;
export const SHADOW_SHIFT_RATIO = 0.03;
export const SHADOW_STOP_MIDDLE = 0.35;

function parseCssColor(color) {
  if (typeof color !== "string") return null;

  const trimmed = color.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      const r = Number.parseInt(hex[0] + hex[0], 16);
      const g = Number.parseInt(hex[1] + hex[1], 16);
      const b = Number.parseInt(hex[2] + hex[2], 16);
      return { r, g, b };
    }

    if (hex.length === 6) {
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
  }

  const match = trimmed.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return null;

  const [r = 0, g = 0, b = 0] = match[1]
    .split(",")
    .map((part) => Number.parseFloat(part.trim()));
  return { r, g, b };
}

export function toRgba(color, alpha) {
  const rgb = parseCssColor(color);
  if (!rgb) return typeof color === "string" ? color : "transparent";

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

// 1周分の角度を扱いやすくするため、値を 0〜2π に折り返す。
export function wrapAngle(value) {
  const wrapped = value % TAU;
  return wrapped < ORIGIN ? wrapped + TAU : wrapped;
}

// CSS カスタムプロパティの値を 0〜1 の比率へ正規化する。
function normalizeRatio(value, fallback) {
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const numeric = Number.parseFloat(trimmed);
  if (!Number.isFinite(numeric)) return fallback;

  if (trimmed.endsWith("%")) {
    return Math.min(1, Math.max(0, numeric / 100));
  }

  if (numeric > 1) {
    return Math.min(1, Math.max(0, numeric / 100));
  }

  return Math.min(1, Math.max(0, numeric));
}

// 扇形を塗りつぶすための最小単位。
function drawSegmentBand(ctx, cx, cy, innerRadius, outerRadius, startAngle, endAngle, fillStyle) {
  const startCos = Math.cos(startAngle);
  const startSin = Math.sin(startAngle);
  const endCos = Math.cos(endAngle);
  const endSin = Math.sin(endAngle);

  ctx.save();
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(cx + startCos * innerRadius, cy + startSin * innerRadius);
  ctx.lineTo(cx + startCos * outerRadius, cy + startSin * outerRadius);
  ctx.arc(cx, cy, outerRadius, startAngle, endAngle);
  ctx.lineTo(cx + endCos * innerRadius, cy + endSin * innerRadius);
  ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ring の見える幅は CSS 変数 `--wid` から読む。
export function readWidRatio(host) {
  const rawValue = window.getComputedStyle(host).getPropertyValue(WID_CSS_VAR);
  return normalizeRatio(rawValue, RING_VISIBLE_RATIO_FALLBACK);
}

// いまのスクロール位置を、現在のセクション総数に対する進行度へ変換する。
export function measureScrollState(host, sectionCount) {
  const viewportHeight = window.innerHeight || MIN_CANVAS_SIZE;
  const hostTop = host.getBoundingClientRect().top + window.scrollY;
  const cycleHeight = viewportHeight * sectionCount;
  const localScroll = ((window.scrollY - hostTop) % cycleHeight + cycleHeight) % cycleHeight;

  return {
    cycleHeight,
    localScroll,
    sectionProgress: localScroll / viewportHeight,
  };
}

function wrapSectionProgress(value, sectionCount) {
  const wrapped = value % sectionCount;
  return wrapped < ORIGIN ? wrapped + sectionCount : wrapped;
}

// スクロールの基準点を、セクションの開始ではなく見せたい位相へずらす。
export function offsetSectionProgress(
  sectionProgress,
  sectionCount,
  offsetSections = SCROLL_PHASE_OFFSET_SECTIONS,
) {
  return wrapSectionProgress(sectionProgress + offsetSections, sectionCount);
}

// 無限スクロール用に、中央コピーの範囲へスクロール位置を戻す。
export function recenterInfiniteScroll(cycleHeight, middleCopyIndex) {
  if (!cycleHeight) return;

  const lowerBound = cycleHeight * middleCopyIndex;
  const upperBound = cycleHeight * (middleCopyIndex + 1);
  const currentScrollY = window.scrollY;

  if (currentScrollY < lowerBound) {
    window.scrollTo(0, currentScrollY + cycleHeight);
  } else if (currentScrollY >= upperBound) {
    window.scrollTo(0, currentScrollY - cycleHeight);
  }
}

// Canvas 背景のベース、光、影を順番に重ねる。
export function drawBackground(ctx, width, height, progress, palette) {
  const background = ctx.createLinearGradient(ORIGIN, ORIGIN, width, height);
  background.addColorStop(COLOR_STOP_START, palette[BC]);
  background.addColorStop(COLOR_STOP_MIDDLE, palette[WH]);
  background.addColorStop(COLOR_STOP_END, palette[BC]);
  ctx.fillStyle = background;
  ctx.fillRect(ORIGIN, ORIGIN, width, height);

  const glow = ctx.createRadialGradient(
    width * GLOW_CENTER_X_RATIO,
    height * GLOW_CENTER_Y_RATIO,
    GRADIENT_MIN_RADIUS,
    width * GLOW_CENTER_X_RATIO,
    height * GLOW_CENTER_Y_RATIO,
    Math.max(width, height) * GLOW_RADIUS_RATIO,
  );
  glow.addColorStop(COLOR_STOP_START, toRgba(palette[MC], 0.14));
  glow.addColorStop(COLOR_STOP_MIDDLE, toRgba(palette[MC], 0.04));
  glow.addColorStop(COLOR_STOP_END, toRgba(palette[MC], 0));
  ctx.fillStyle = glow;
  ctx.fillRect(ORIGIN, ORIGIN, width, height);

  const shadowShift = Math.sin(progress * TAU) * width * SHADOW_SHIFT_RATIO;
  const shadow = ctx.createRadialGradient(
    width * SHADOW_CENTER_X_RATIO + shadowShift,
    height * SHADOW_CENTER_Y_RATIO,
    GRADIENT_MIN_RADIUS,
    width * SHADOW_CENTER_X_RATIO + shadowShift,
    height * SHADOW_CENTER_Y_RATIO,
    Math.max(width, height) * SHADOW_RADIUS_RATIO,
  );
  shadow.addColorStop(COLOR_STOP_START, toRgba(palette[BK], 0.14));
  shadow.addColorStop(SHADOW_STOP_MIDDLE, toRgba(palette[BK], 0.07));
  shadow.addColorStop(COLOR_STOP_END, toRgba(palette[BK], 0));
  ctx.fillStyle = shadow;
  ctx.fillRect(ORIGIN, ORIGIN, width, height);
}

// 4 区画を塗りつぶしの扇形として描く。
export function drawRing(ctx, cx, cy, outerRadius, innerRadius, rotation, segments) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  segments.forEach((segment, index) => {
    const start = index * SEGMENT_SPAN;
    const end = start + SEGMENT_SPAN;
    drawSegmentBand(ctx, ORIGIN, ORIGIN, innerRadius, outerRadius, start, end, segment.color);
  });
  ctx.restore();
}

// CSS 変数から、canvas 用に解決済みの色パレットを作る。
export function readShowcasePalette() {
  const rootStyle = window.getComputedStyle(document.documentElement);

  return {
    [MC]: rootStyle.getPropertyValue(MC).trim(),
    [SC]: rootStyle.getPropertyValue(SC).trim(),
    [AC]: rootStyle.getPropertyValue(AC).trim(),
    [BC]: rootStyle.getPropertyValue(BC).trim(),
    [TC]: rootStyle.getPropertyValue(TC).trim(),
    [GR]: rootStyle.getPropertyValue(GR).trim(),
    [BK]: rootStyle.getPropertyValue(BK).trim(),
    [WH]: rootStyle.getPropertyValue(WH).trim(),
  };
}
