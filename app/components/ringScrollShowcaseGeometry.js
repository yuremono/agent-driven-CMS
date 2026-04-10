// --- Canvas / テーマ用 CSS 変数名（:root の --MC などと対応）---
export const MC = "--MC"; // メインカラー（ドーナツの扇形 1）
export const SC = "--SC"; // セカンダリ（扇形 2）
export const AC = "--AC"; // アクセント（扇形 3）
export const BC = "--BC"; // ベース背景色（扇形 4・本文まわりで参照）
export const TC = "--TC"; // テキスト色
export const GR = "--GR"; // グレー（スクロールバー等）
export const BK = "--BK"; // 黒（パレット解決用。キャンバス背景には使わない）
export const WH = "--WH"; // 白（パレット解決用）
export const TR = "--TR"; // トランスペアレント／下地：ドーナツ4扇「以外」のキャンバス塗り

// 座標や描画の基準になる共通値。
export const ORIGIN = 0;
export const HALF_RATIO = 0.5;
export const CENTER_RATIO = 0.5;
export const MIN_CANVAS_SIZE = 1;
export const DEFAULT_DPR = 1;

// リングの幾何（扇の色は RING_SEGMENTS の CSS 変数）。
export const RING_OUTER_RADIUS_RATIO = 1;
export const RING_HOLE_RADIUS_RATIO = 0.2;
export const RING_ROTATION_OFFSET = -(Math.PI * HALF_RATIO);
export const RING_VISIBLE_RATIO_FALLBACK = 1 - RING_HOLE_RADIUS_RATIO;
export const TEST_SEGMENT_OPACITY = 0;
export const WID_CSS_VAR = "--wid";

// 角度とスクロールの単位を作るための定数。
const FULL_TURN_MULTIPLIER = 2;
const SEGMENT_COUNT = 4;
export const ROTATION_DIRECTION = -1;
export const TAU = Math.PI * FULL_TURN_MULTIPLIER;
export const SEGMENT_SPAN = TAU / SEGMENT_COUNT;
export const SCROLL_PHASE_OFFSET_SECTIONS = 0.5;

/** 文字列の色を RGB に分解（toRgba 用） */
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

/** 解決済み色文字列にアルファを付与（将来の装飾用） */
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

// ドーナツの各 90° 扇形を塗る（色は segments[].color = 解決済みの --MC 等）。
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

/**
 * キャンバス全体の下地。ドーナツ 4 扇以外は単色 `--TR`（線形／放射グラデーションは使わない）。
 */
export function drawBackground(ctx, width, height, palette) {
  ctx.fillStyle = palette[TR];
  ctx.fillRect(ORIGIN, ORIGIN, width, height);
}

// Canvas の drawSegmentBand と同じドーナツ扇形を SVG path の d にする（マスク用）。
function fmtPathCoord(value) {
  if (!Number.isFinite(value)) return "0";
  const rounded = Number(value.toFixed(4));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/**
 * @param {number} cx - 扇の中心 x（リングローカル座標）
 * @param {number} cy - 扇の中心 y
 * @param {number} innerRadius - 内半径
 * @param {number} outerRadius - 外半径
 * @param {number} startAngle - ラジアン（drawRing 内の未回転座標系）
 * @param {number} endAngle - ラジアン
 */
export function getRingSectorSvgPathD(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
  const startCos = Math.cos(startAngle);
  const startSin = Math.sin(startAngle);
  const endCos = Math.cos(endAngle);
  const endSin = Math.sin(endAngle);

  const x0 = cx + startCos * innerRadius;
  const y0 = cy + startSin * innerRadius;
  const x1 = cx + startCos * outerRadius;
  const y1 = cy + startSin * outerRadius;
  const x2 = cx + endCos * outerRadius;
  const y2 = cy + endSin * outerRadius;
  const x3 = cx + endCos * innerRadius;
  const y3 = cy + endSin * innerRadius;

  // 外周: Canvas arc と同様に時計回り (sweep 1)。内周: anticlockwise 相当 (sweep 0)。
  return [
    `M ${fmtPathCoord(x0)} ${fmtPathCoord(y0)}`,
    `L ${fmtPathCoord(x1)} ${fmtPathCoord(y1)}`,
    `A ${fmtPathCoord(outerRadius)} ${fmtPathCoord(outerRadius)} 0 0 1 ${fmtPathCoord(x2)} ${fmtPathCoord(y2)}`,
    `L ${fmtPathCoord(x3)} ${fmtPathCoord(y3)}`,
    `A ${fmtPathCoord(innerRadius)} ${fmtPathCoord(innerRadius)} 0 0 0 ${fmtPathCoord(x0)} ${fmtPathCoord(y0)}`,
    "Z",
  ].join(" ");
}

/**
 * リングの各セクタ用 SVG path（index 0..segmentCount-1）。角度は drawRing と同じ基準。
 */
export function getRingSectorSvgPathDs(cx, cy, innerRadius, outerRadius, segmentCount) {
  const span = TAU / segmentCount;
  return Array.from({ length: segmentCount }, (_, index) => {
    const startAngle = index * span;
    const endAngle = startAngle + span;
    return getRingSectorSvgPathD(cx, cy, innerRadius, outerRadius, startAngle, endAngle);
  });
}

/**
 * ビューポート座標系（Canvas と同じ cx, cy）で、drawRing と同じく rotation を扇の角に加えたマスク用 path。
 * 動画を fixed 全画面に置くときはラッパを回転させず、この配列だけ更新する。
 */
export function getViewportRingSectorSvgPathDs(
  cx,
  cy,
  innerRadius,
  outerRadius,
  segmentCount,
  rotation,
) {
  const span = TAU / segmentCount;
  return Array.from({ length: segmentCount }, (_, index) => {
    const startAngle = rotation + index * span;
    const endAngle = rotation + (index + 1) * span;
    return getRingSectorSvgPathD(cx, cy, innerRadius, outerRadius, startAngle, endAngle);
  });
}

export function clampUnit(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function getMediaReadyPercent(readyCount, totalCount) {
  if (!Number.isFinite(totalCount) || totalCount <= 0) return 0;
  const safeReadyCount = Number.isFinite(readyCount) ? readyCount : 0;
  return Math.round((Math.min(totalCount, Math.max(0, safeReadyCount)) / totalCount) * 100);
}

export function getOpeningRingCenter(viewportWidth, viewportHeight, ringCenterY, progress) {
  const t = clampUnit(progress);
  const startX = viewportWidth * HALF_RATIO;
  const startY = viewportHeight * HALF_RATIO;
  const endX = ORIGIN;
  const endY = ringCenterY;

  return {
    cx: startX + (endX - startX) * t,
    cy: startY + (endY - startY) * t,
  };
}

// 4 区画を塗りつぶしの扇形として描く（各 segment.color は --MC〜--BC の解決値）。
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

// CSS 変数から、canvas 用に解決済みの色パレットを作る（getPropertyValue で実色の文字列が入る）。
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
    [TR]: rootStyle.getPropertyValue(TR).trim(),
  };
}
