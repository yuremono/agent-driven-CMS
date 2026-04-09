import { getBridge } from "../../../../lib/bridge.js";
import {
  jsonError,
  readJsonBody,
  sameOriginForbidden,
} from "../../../../lib/bridge-http.js";

export const runtime = "nodejs";

export async function POST(request) {
  const forbidden = sameOriginForbidden(request);
  if (forbidden) return forbidden;

  const bridge = getBridge();
  const body = await readJsonBody(request);
  const type = body.type ?? "chatgpt";

  // Security: never accept API keys or external tokens from the browser.
  if (type !== "chatgpt") {
    return Response.json(
      { error: "only chatgpt login is supported from the browser" },
      { status: 400 },
    );
  }

  try {
    const result = await bridge.startChatgptLogin();
    return Response.json({ result, status: bridge.getStatus() });
  } catch (error) {
    return jsonError(error, "failed to start login");
  }
}
