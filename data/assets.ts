import type { VisualAsset } from "@/types/asset";

// Internal mock asset library. imageUrl points at /assets/<id>.png; the
// actual PNG files are P2 (see ASSET_SWAP_GUIDE.md). Until those land,
// ChildStoryScreen falls back to emojiFallback.

const a = (
  id: string,
  kind: VisualAsset["kind"],
  label: string,
  emoji: string,
  altForParent?: string,
): VisualAsset => ({
  id,
  kind,
  label,
  imageUrl: `/assets/${id}.png`,
  altForParent: altForParent ?? label,
  source: "internal",
  emojiFallback: emoji,
});

export const assets: VisualAsset[] = [
  // Backgrounds (place)
  a("bg_mart_entrance", "background", "마트 입구", "🏬"),
  a("bg_fruit_aisle", "background", "마트 과일 코너", "🍎"),
  a("bg_checkout", "background", "마트 계산대", "🛒"),
  a("bg_park_path", "background", "공원 산책로", "🌳"),
  a("bg_home", "background", "집", "🏠"),

  // Objects / choices — fruits
  a("obj_banana", "choice", "바나나", "🍌"),
  a("obj_apple", "choice", "사과", "🍎"),
  a("obj_strawberry", "choice", "딸기", "🍓"),
  a("obj_pear", "choice", "배", "🍐"),
  a("obj_milk", "choice", "우유", "🥛"),

  // Objects — actions / containers
  a("obj_cart", "choice", "카트", "🛒"),
  a("obj_floor", "choice", "바닥", "🟫"),

  // Park
  a("obj_butterfly", "choice", "나비", "🦋"),
  a("obj_tree", "choice", "큰 나무", "🌳"),
  a("obj_flower", "choice", "꽃", "🌼"),
  a("obj_bird", "choice", "새", "🐦"),
  a("obj_wave", "choice", "인사", "👋"),

  // Emotion / faces
  a("emo_happy", "choice", "웃는 얼굴", "😊"),
  a("emo_sleepy", "choice", "졸린 얼굴", "😴"),
  a("emo_surprised", "choice", "놀란 얼굴", "😮"),

  // Generic fallback
  a("fallback_sparkle", "fallback", "반짝", "✨"),
];

export function findAsset(id: string): VisualAsset | undefined {
  return assets.find((x) => x.id === id);
}

const KEYWORD_TO_ID: Record<string, string> = {
  // places
  마트: "bg_mart_entrance",
  과일: "bg_fruit_aisle",
  계산: "bg_checkout",
  공원: "bg_park_path",
  집: "bg_home",
  // objects
  바나나: "obj_banana",
  사과: "obj_apple",
  딸기: "obj_strawberry",
  배: "obj_pear",
  우유: "obj_milk",
  카트: "obj_cart",
  바닥: "obj_floor",
  나비: "obj_butterfly",
  나무: "obj_tree",
  꽃: "obj_flower",
  새: "obj_bird",
  인사: "obj_wave",
  // emotions
  웃: "emo_happy",
  기분: "emo_happy",
  좋: "emo_happy",
  졸: "emo_sleepy",
  놀: "emo_surprised",
};

export function findAssetByKeyword(keyword: string): VisualAsset | undefined {
  if (!keyword) return undefined;
  // exact match first
  const direct = KEYWORD_TO_ID[keyword];
  if (direct) return findAsset(direct);
  // substring match
  for (const k of Object.keys(KEYWORD_TO_ID)) {
    if (keyword.includes(k)) return findAsset(KEYWORD_TO_ID[k]);
  }
  return undefined;
}
