/** Push 32×32 hexframes to grokpool relay for menubar preview. */

const RELAY_FRAME_URL = "http://127.0.0.1:2420/frame";
const MIN_INTERVAL_MS = 2000;
let lastPushAt = 0;
let inflight = false;

export function pushHexFrameToGrokpool(msg, source = "qbpm") {
  if (!msg?.hex?.length || !msg.res) return;
  const now = performance.now();
  if (now - lastPushAt < MIN_INTERVAL_MS || inflight) return;
  lastPushAt = now;
  inflight = true;

  const headers = { "Content-Type": "application/json" };
  const secret = globalThis.GROKPOOL_SECRET || globalThis.localStorage?.getItem?.("grokpool-secret");
  if (secret) headers["X-Pool-Secret"] = String(secret).trim();

  fetch(RELAY_FRAME_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "hexframe",
      hex: msg.hex,
      res: msg.res,
      mode: msg.mode ?? "gray",
      feedKey: msg.feedKey ?? source,
      source,
      t: msg.t ?? now,
    }),
  })
    .catch(() => {})
    .finally(() => {
      inflight = false;
    });
}