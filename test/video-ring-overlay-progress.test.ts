import assert from "node:assert/strict";
import test from "node:test";

import {
  getLoadPercent,
  getOpeningCenterX,
  getTimedLoadPercent,
  hasAllSectorsReady,
  isVideoReadyForOpening,
} from "../app/components/videoRingOverlayProgress";

test("getLoadPercent averages partial sector progress", () => {
  assert.equal(getLoadPercent([0, 0.25, 0.5, 1]), 44);
  assert.equal(getLoadPercent([1, 1, 1, 1]), 100);
  assert.equal(getLoadPercent([]), 0);
});

test("getTimedLoadPercent never outruns real progress and takes at least one second to hit 100", () => {
  assert.equal(getTimedLoadPercent(100, 0, 1000), 0);
  assert.equal(getTimedLoadPercent(100, 250, 1000), 25);
  assert.equal(getTimedLoadPercent(100, 999, 1000), 99);
  assert.equal(getTimedLoadPercent(100, 1000, 1000), 100);
  assert.equal(getTimedLoadPercent(40, 900, 1000), 40);
});

test("getOpeningCenterX moves linearly from viewport center to left edge", () => {
  assert.equal(getOpeningCenterX(1200, 0), 600);
  assert.equal(getOpeningCenterX(1200, 0.5), 300);
  assert.equal(getOpeningCenterX(1200, 1), 0);
});

test("getOpeningCenterX clamps progress outside 0 to 1", () => {
  assert.equal(getOpeningCenterX(1000, -1), 500);
  assert.equal(getOpeningCenterX(1000, 2), 0);
});

test("hasAllSectorsReady only passes when every visible sector is ready", () => {
  assert.equal(hasAllSectorsReady([true, true, true, true], 4), true);
  assert.equal(hasAllSectorsReady([true, false, true, true], 4), false);
  assert.equal(hasAllSectorsReady([], 0), false);
});

test("isVideoReadyForOpening matches the playable readyState threshold", () => {
  assert.equal(isVideoReadyForOpening(0), false);
  assert.equal(isVideoReadyForOpening(2), false);
  assert.equal(isVideoReadyForOpening(3), true);
  assert.equal(isVideoReadyForOpening(4), true);
});
