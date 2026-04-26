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

  // Today (kindergarten) — backgrounds
  a("bg_kinder_intro", "background", "어린이집 인사", "🐰"),
  a("bg_kindergarten", "background", "어린이집 놀이방", "🏫"),
  a("bg_lunch_table", "background", "어린이집 점심", "🍱"),
  a("bg_friends_play", "background", "친구들과 놀이", "👫"),
  a("bg_kinder_close", "background", "어린이집 마무리", "🌟"),

  // Today — play activity choices
  a("obj_blocks", "choice", "블록 놀이", "🧱"),
  a("obj_ball_play", "choice", "공놀이", "⚽"),
  a("obj_book_kids", "choice", "책 읽기", "📚"),

  // Today — lunch food choices
  a("obj_chicken_meal", "choice", "닭고기 반찬", "🍗"),
  a("obj_kimchi", "choice", "김치 반찬", "🥬"),
  a("obj_noodle", "choice", "국수", "🍜"),

  // Today — friend choices
  a("obj_friend_sihyun", "choice", "시현이", "🧒"),
  a("obj_friend_other", "choice", "다른 친구", "👦"),

  // Today — UI
  a("obj_arrow_next", "choice", "다음", "▶️"),

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
  어린이집: "bg_kindergarten",
  점심: "bg_lunch_table",
  친구: "bg_friends_play",
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
  // today story — play activities
  블록: "obj_blocks",
  공놀이: "obj_ball_play",
  공: "obj_ball_play",
  책: "obj_book_kids",
  // today — foods
  닭고기: "obj_chicken_meal",
  김치: "obj_kimchi",
  국수: "obj_noodle",
  // today — friends
  시현: "obj_friend_sihyun",
  // today — ui
  시작: "obj_arrow_next",
  다음: "obj_arrow_next",
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
