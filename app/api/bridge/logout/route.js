import { getBridge } from "../../../../lib/bridge.js";

export const runtime = "nodejs";

function enforceSameOrigin(request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return null;

  try {
    const originUrl = new URL(origin);
    if (originUrl.host !== host) {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  return null;
}

export async function POST(request) {
  const forbidden = enforceSameOrigin(request);
  if (forbidden) return forbidden;

  const bridge = getBridge();

  try {
    const result = await bridge.logout();
    return Response.json({ result, status: bridge.getStatus() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "failed to logout" },
      { status: 500 },
    );
  }
}
