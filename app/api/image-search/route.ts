// Pexels image search proxy.
//
// Why a server route, not a direct client fetch:
//   - Keeps PEXELS_API_KEY out of the client bundle.
//   - Avoids CORS by talking to the Pexels API server-to-server.
//   - Lets us add safety filters / rate limits / caching server-side
//     before returning to the child UI.
//
// License: Pexels images are free for commercial and non-commercial use,
// no attribution required (https://www.pexels.com/license/).
//
// Addendum §4.5 notes "MVP에서는 실제 외부 이미지 검색 호출 금지" —
// this route activates a v2 capability (handoff §4.6) gated by env.

import { NextResponse } from "next/server";

const PEXELS_ENDPOINT = "https://api.pexels.com/v1/search";

type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
};

type PexelsSearchResponse = {
  total_results: number;
  photos: PexelsPhoto[];
};

export async function POST(req: Request) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    return NextResponse.json(
      { ok: false, error: "PEXELS_API_KEY not set" },
      { status: 503 },
    );
  }

  let body: { query?: string; orientation?: "landscape" | "portrait" | "square" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid json" },
      { status: 400 },
    );
  }

  const query = (body.query ?? "").trim();
  if (!query) {
    return NextResponse.json(
      { ok: false, error: "empty query" },
      { status: 400 },
    );
  }

  const params = new URLSearchParams({
    query,
    per_page: "5",
    locale: "ko-KR",
  });
  if (body.orientation) params.set("orientation", body.orientation);

  let res: Response;
  try {
    res = await fetch(`${PEXELS_ENDPOINT}?${params.toString()}`, {
      headers: { Authorization: key },
      // Cache search results at the platform level for 1 day so repeat
      // queries are free even on cold cache.
      next: { revalidate: 86400 },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `network: ${(e as Error).message}` },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: `pexels ${res.status}` },
      { status: 502 },
    );
  }

  const json = (await res.json()) as PexelsSearchResponse;
  const first = json.photos?.[0];
  if (!first) {
    return NextResponse.json({ ok: true, found: false });
  }

  const orientation = body.orientation ?? "square";
  const url =
    orientation === "landscape"
      ? first.src.landscape
      : orientation === "portrait"
        ? first.src.portrait
        : first.src.medium;

  return NextResponse.json({
    ok: true,
    found: true,
    url,
    photographer: first.photographer,
    photographer_url: first.photographer_url,
    pexels_url: first.url,
    alt: first.alt,
  });
}
