"use client";

const pendingFrames = new Map();
let nextFrameToken = 1;

export function requestEveryOtherAnimationFrame(callback) {
  const token = nextFrameToken;
  nextFrameToken += 1;

  const firstFrame = window.requestAnimationFrame(() => {
    const secondFrame = window.requestAnimationFrame((timestamp) => {
      pendingFrames.delete(token);
      callback(timestamp);
    });

    pendingFrames.set(token, secondFrame);
  });

  pendingFrames.set(token, firstFrame);
  return token;
}

export function cancelEveryOtherAnimationFrame(token) {
  const frame = pendingFrames.get(token);
  if (!frame) return;

  window.cancelAnimationFrame(frame);
  pendingFrames.delete(token);
}
