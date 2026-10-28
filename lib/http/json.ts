import "server-only";

/** Bounded JSON parsing for route handlers. Never trust the body size. */

const MAX_BODY_BYTES = 16 * 1024;

export type JsonResult<T> = { ok: true; data: T } | { ok: false; response: Response };

export async function readJson<T = unknown>(request: Request): Promise<JsonResult<T>> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: Response.json({ error: "payload_too_large" }, { status: 413 }),
    };
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, response: Response.json({ error: "invalid_body" }, { status: 400 }) };
  }

  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: Response.json({ error: "payload_too_large" }, { status: 413 }),
    };
  }

  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, response: Response.json({ error: "invalid_json" }, { status: 400 }) };
  }
}

export function jsonError(status: number, error: string, headers?: HeadersInit): Response {
  return Response.json({ error }, { status, headers });
}
