import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { isKnownTag } from "@/lib/api/tags";

/**
 * Webhook called by the API after content changes. Tags are expired
 * immediately (`expire: 0`) so the next visitor sees the published change.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  const provided = request.headers.get("x-revalidate-secret") ?? "";
  if (!secret || !safeEqual(provided, secret)) {
    return Response.json({ revalidated: false, message: "Unauthorized" }, { status: 401 });
  }

  let tags: unknown;
  try {
    ({ tags } = (await request.json()) as { tags?: unknown });
  } catch {
    return Response.json({ revalidated: false, message: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(tags) || tags.length === 0 || tags.length > 50) {
    return Response.json({ revalidated: false, message: "Expected a non-empty tags array" }, { status: 400 });
  }

  const accepted = tags.filter(isKnownTag);
  for (const tag of accepted) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: true, tags: accepted });
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
