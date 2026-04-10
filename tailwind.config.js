/** @type {import('tailwindcss').Config} */
import plugin from "tailwindcss/plugin";

/** Default Tailwind font sizes as plain strings: only font-size, no line-height on text-* utilities. */
const fontSizeWithoutLineHeight = {
	xs: "0.75rem",
	sm: "0.875rem",
	base: "1rem",
	lg: "1.125rem",
	xl: "1.25rem",
	"2xl": "1.5rem",
	"3xl": "1.875rem",
	"4xl": "2.25rem",
	"5xl": "3rem",
	"6xl": "3.75rem",
	"7xl": "4.5rem",
	"8xl": "6rem",
	"9xl": "8rem",
};

export default {
	content: [ "./app/**/*.{js,ts,jsx,tsx}"],
	theme: {
		// Replaces default fontSize (which pairs each size with line-height). Strings → font-size only.
                fontSize: fontSizeWithoutLineHeight,
                // 文字列のみにする（オブジェクト形式を混ぜると max-md / min-* が無効になる）
		extend: {
			screens: {
				xs: "479px",
			},
		},
	},
	plugins: [
		plugin(function ({ matchUtilities }) {
			// text-shadow with arbitrary value (CSS variable)
			matchUtilities(
				{
					"text-shadow": (value) => ({
						"text-shadow": value,
					}),
				},
				{ type: ["any"] },
			);

			// drop-shadow with arbitrary value
			matchUtilities(
				{
					"drop-shadow": (value) => ({
						filter: `drop-shadow(${value})`,
					}),
				},
				{ type: ["any"] },
			);

			// box-shadow with arbitrary value
			matchUtilities(
				{
					"box-shadow": (value) => ({
						"box-shadow": value,
					}),
				},
				{ type: ["any"] },
			);

			// webkit-text-stroke with arbitrary value
			matchUtilities(
				{
					"text-stroke": (value) => ({
						"-webkit-text-stroke": value,
					}),
				},
				{ type: ["any"] },
			);
		}),
	],
};
