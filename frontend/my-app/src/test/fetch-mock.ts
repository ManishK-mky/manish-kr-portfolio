import { vi } from "vitest";

type Handler = (url: URL, init: RequestInit) => { status?: number; body: unknown } | undefined;

/** Routes `fetch` calls to handlers; unmatched requests fail loudly. */
export function mockFetch(handler: Handler) {
  const calls: { url: URL; init: RequestInit }[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(typeof input === "string" ? input : input.toString(), "http://localhost");
    calls.push({ url, init });
    const result = handler(url, init);
    if (!result) throw new Error(`Unexpected fetch ${init.method ?? "GET"} ${url.pathname}`);
    return new Response(JSON.stringify(result.body), {
      status: result.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fn);
  return calls;
}

export const ok = <T,>(data: T, status = 200) => ({ status, body: { success: true, data } });
export const fail = (status: number, message: string, details?: unknown) => ({
  status,
  body: { success: false, error: { statusCode: status, code: "ERR", message, details } },
});
