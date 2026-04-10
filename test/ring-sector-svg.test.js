import assert from "node:assert/strict";
import test from "node:test";

import {
  getRingSectorSvgPathD,
  getRingSectorSvgPathDs,
  getViewportRingSectorSvgPathDs,
  TAU,
} from "../app/components/ringScrollShowcaseGeometry.js";

test("getRingSectorSvgPathD returns closed path with arcs", () => {
  const d = getRingSectorSvgPathD(100, 100, 20, 80, 0, TAU / 4);
  assert.match(d, /^M /);
  assert.match(d, / Z$/);
  assert.ok(d.includes("A "));
});

test("getRingSectorSvgPathDs returns one path per segment", () => {
  const paths = getRingSectorSvgPathDs(50, 50, 10, 40, 4);
  assert.equal(paths.length, 4);
  for (const p of paths) {
    assert.ok(p.length > 20);
  }
});

test("getViewportRingSectorSvgPathDs bakes rotation into paths", () => {
  const a = getViewportRingSectorSvgPathDs(0, 100, 10, 80, 4, 0);
  const b = getViewportRingSectorSvgPathDs(0, 100, 10, 80, 4, TAU / 8);
  assert.notEqual(a[0], b[0]);
  assert.equal(a.length, 4);
});

test("getRingSectorSvgPathD is degenerate when outer equals inner", () => {
  const d = getRingSectorSvgPathD(100, 100, 40, 40, 0, TAU / 4);
  assert.match(d, /^M /);
  assert.match(d, / Z$/);
  assert.ok(d.length < 120, "collapsed sector path should stay short");
});
