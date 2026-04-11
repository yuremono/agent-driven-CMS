const EFFECT_WARP = {
  baseFrequency: "0.015 0.03",
  keyTimes: "0;0.12;0.24;0.41;0.57;0.73;0.88;1",
  scale: [14, 24, 10, 28, 16, 21, 12, 14],
  scaleDur: "2s",
  seed: 7,
};

export default function EffectWarpDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      height="0"
      width="0"
      style={{
        left: 0,
        overflow: "hidden",
        pointerEvents: "none",
        position: "absolute",
        top: 0,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter
          id="effect-warp"
          x="-35%"
          y="-35%"
          width="170%"
          height="170%"
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency={EFFECT_WARP.baseFrequency}
            numOctaves="2"
            seed={EFFECT_WARP.seed}
            stitchTiles="stitch"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              calcMode="discrete"
              dur="2s"
              repeatCount="indefinite"
              keyTimes="0;0.12;0.24;0.41;0.57;0.73;0.88;1"
              values="0.015 0.03;0.023 0.018;0.011 0.04;0.019 0.025;0.014 0.034;0.021 0.02;0.016 0.028;0.015 0.03"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="18"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          >
            <animate
              attributeName="scale"
              calcMode="discrete"
              dur={EFFECT_WARP.scaleDur}
              repeatCount="indefinite"
              keyTimes={EFFECT_WARP.keyTimes}
              values={EFFECT_WARP.scale.join(";")}
            />
          </feDisplacementMap>
        </filter>
      </defs>
    </svg>
  );
}
