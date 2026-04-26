// Lookup a character pose PNG by mood, with fuzzy filename matching.
//
// Why this exists: the parent crops dozens of poses with non-standard names
// like "kkangchong_happy.png", "행복.png", "웃는얼굴_v2.png", "kkang_smile.PNG"
// — making them all match exactly is annoying. This route reads the
// public/assets/character/ folder at request time and picks the best
// filename whose lowercased name contains any synonym for the requested
// mood.
//
// Returns { ok, url } where url is "/assets/character/<file>" or null
// when no match.

import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

const POSE_DIR = path.join(process.cwd(), "public", "assets", "character");

// Synonyms checked in order; first hit wins.
const SYNONYMS: Record<string, string[]> = {
  happy: ["happy", "smile", "joy", "기쁨", "기쁜", "행복", "웃"],
  listening: [
    "listening",
    "listen",
    "idle",
    "default",
    "기본",
    "듣기",
    "기다",
  ],
  waving: ["waving", "wave", "hi", "greet", "인사", "반가워", "손인사"],
  thinking: [
    "thinking",
    "think",
    "wonder",
    "curious",
    "생각",
    "궁금",
    "의문",
  ],
  jumping: ["jumping", "jump", "happy_jump", "점프", "신난", "뛰는"],
  sleepy: ["sleepy", "sleep", "drowsy", "졸림", "졸린", "잠"],
};

let cachedFiles: string[] | null = null;
let cachedAt = 0;
const CACHE_MS = 30_000; // refresh every 30s in dev

async function listFiles(): Promise<string[]> {
  const now = Date.now();
  if (cachedFiles && now - cachedAt < CACHE_MS) return cachedFiles;
  try {
    const all = await fs.readdir(POSE_DIR);
    cachedFiles = all.filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
    cachedAt = now;
    return cachedFiles;
  } catch {
    cachedFiles = [];
    cachedAt = now;
    return [];
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mood = (searchParams.get("mood") ?? "").toLowerCase().trim();
  if (!mood) {
    return NextResponse.json({ ok: false, error: "missing mood" });
  }

  const files = await listFiles();
  if (files.length === 0) {
    return NextResponse.json({ ok: true, url: null, reason: "no files" });
  }

  const synonyms = SYNONYMS[mood] ?? [mood];

  for (const syn of synonyms) {
    const lower = syn.toLowerCase();
    const match = files.find((f) => f.toLowerCase().includes(lower));
    if (match) {
      return NextResponse.json({
        ok: true,
        url: `/assets/character/${match}`,
        matched: match,
        via: syn,
      });
    }
  }

  return NextResponse.json({ ok: true, url: null, reason: "no match" });
}
