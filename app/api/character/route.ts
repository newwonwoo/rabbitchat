// Generic asset finder by label.
//
// Reads public/assets/character/ at request time and picks the best
// filename whose lowercased name contains any synonym for the requested
// label. Same folder holds character poses (happy/listening/...), food
// actions (banana_bite/apple_hold/...), choice items (blocks/cart/...),
// and place backdrops if the parent drops them in.
//
// Param: ?label=<thing>   (also accepts ?mood=<thing> for backward compat)
//
// Returns { ok, url, matched, via }.

import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

const POSE_DIR = path.join(process.cwd(), "public", "assets", "character");

// Synonyms — Korean + English. Each group lists every alias / typo /
// phrase fragment that should resolve to the same asset. Substring
// match against the lowercased filename, so partial keys are fine.
const SYNONYMS: Record<string, string[]> = {
  // --- moods / expressions ---
  happy: ["happy", "smile", "joy", "yummy", "맛있", "기쁨", "기쁜", "행복", "웃"],
  listening: [
    "listening",
    "listen",
    "idle",
    "default",
    "standing",
    "기본",
    "듣기",
    "기다",
    "서있",
  ],
  waving: ["waving", "wave", "hi", "greet", "인사", "반가워", "손인사"],
  thinking: ["thinking", "think", "wonder", "curious", "생각", "궁금", "의문"],
  jumping: [
    "jumping",
    "jump",
    "happy_jump",
    "handsup",
    "점프",
    "신난",
    "뛰는",
    "만세",
  ],
  sleepy: ["sleepy", "sleep", "drowsy", "졸림", "졸린", "잠"],

  // character orientation views
  back: ["backview", "뒷모습", "back"],
  side: ["sideview", "옆모습", "side"],

  // --- food: fruits / drinks ---
  // (substring match → "eatapple" matches "apple")
  apple: ["apple", "사과"],
  banana: ["banana", "바나나"],
  // includes parent typo "starawberry"
  strawberry: ["strawberry", "starawberry", "딸기"],
  pear: ["pear", "배"],
  milk: ["milk", "우유"],
  soymilk: ["soymilk", "두유", "dooyoo"],
  water: ["water", "물"],
  juice: ["juice", "주스", "음료"],
  rice: ["rice", "밥"],

  // --- food: meals ---
  meal: ["meal", "식사", "반찬"],
  chicken: ["chicken", "닭고기", "닭"],
  kimchi: ["kimchi", "김치"],
  noodle: ["noodle", "국수", "면"],
  bibimbop: ["bibimbop", "bibimbap", "비빔밥"],

  // --- food / drink actions ---
  bite: ["bite", "eat", "한입", "먹기"],
  drink: ["drink", "drinkwater", "마시"],
  chew: ["chew", "씹"],
  swallow: ["swallow", "삼키"],

  // --- hygiene / daily routines ---
  bath: ["bath", "bathtub", "욕조", "목욕"],
  brushteeth: ["brushteeth", "cleanteeth", "양치", "이닦기"],
  washhands: ["washhands", "손씻기"],
  potty: ["potty", "pupu", "응가", "쉬", "화장실"],

  // --- play activities ---
  blocks: ["blocks", "block", "블록"],
  ball: ["ball", "공놀이", "공"],
  book: ["book", "책읽기", "책"],
  cart: ["cart", "카트"],

  // --- places ---
  kindergarten: ["kindergarten", "kinder", "어린이집", "유치원"],
  mart: ["mart", "supermarket", "마트"],
  park: ["park", "공원"],
  mountain: ["mountain", "mtdaemo", "daemo", "산", "대모산"],
  home: ["home", "집"],
  bedroom: ["bedroom", "bed", "침실", "잠자리"],

  // --- friends / people / family ---
  sihyun: ["sihyun", "시현"],
  friend: ["friend", "친구"],
  family: ["family", "withfamily", "가족"],
  mom: ["mom", "엄마"],
  dad: ["dad", "아빠"],

  // --- misc ---
  butterfly: ["butterfly", "나비"],
  flower: ["flower", "꽃"],
  bird: ["bird", "새"],
  tree: ["tree", "나무"],
};

let cachedFiles: string[] | null = null;
let cachedAt = 0;
const CACHE_MS = 30_000;

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

function expandSynonyms(label: string): string[] {
  const lc = label.toLowerCase();
  // Direct key match
  if (SYNONYMS[lc]) return SYNONYMS[lc];
  // Synonym in any group → return that group
  for (const group of Object.values(SYNONYMS)) {
    if (group.some((g) => g.toLowerCase() === lc)) return group;
  }
  // Substring partial match
  for (const group of Object.values(SYNONYMS)) {
    if (group.some((g) => lc.includes(g.toLowerCase()) || g.toLowerCase().includes(lc))) {
      return [lc, ...group];
    }
  }
  return [lc];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const label = (searchParams.get("label") ?? searchParams.get("mood") ?? "")
    .toLowerCase()
    .trim();
  if (!label) {
    return NextResponse.json({ ok: false, error: "missing label" });
  }

  const files = await listFiles();
  if (files.length === 0) {
    return NextResponse.json({ ok: true, url: null, reason: "no files" });
  }

  const candidates = expandSynonyms(label);

  for (const syn of candidates) {
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
