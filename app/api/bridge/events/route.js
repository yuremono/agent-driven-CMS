import { getBridge } from "../../../../lib/bridge.js";

export const runtime = "nodejs";

export async function GET() {
  const bridge = getBridge();
  await bridge.start().catch(() => {});

  let cleanup = null;
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const push = (payload) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };

      push(bridge.snapshot());

      const listener = (event) => push(event);
      bridge.on("event", listener);

      cleanup = () => bridge.off("event", listener);
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
