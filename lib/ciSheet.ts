// CI sheet sprite coordinates.
//
// The two CI sheets that the parent uploads to public/assets/ci/ are
// large composite images. We crop individual poses with CSS background-image
// + background-position rather than asking the parent to cut PNGs.
//
// Both sheets exported at 1448 × 1086 px (confirmed). Coordinates below
// are best-effort visual reads of the published CI sheets — if a pose
// renders cropped off-center after upload, just tweak that frame's
// {x, y, w, h} and the change is live on next reload.

export type CISpriteFrame = {
  x: number; // top-left corner inside the sheet (px, intrinsic)
  y: number;
  w: number; // crop size (px, intrinsic)
  h: number;
};

// --- Character expressions sheet -------------------------------------------
// File: public/assets/ci/character-sheet.png
// Source: CHARACTER IDENTITY SHEET (turnaround + EXPRESSIONS & POSES + LOGO)

export const CHARACTER_SHEET = {
  src: "/assets/ci/character-sheet.png",
  intrinsicW: 1448,
  intrinsicH: 1086,
  frames: {
    // 6 expression poses live in the middle-bottom band of the sheet.
    // Roughly y=600..955, each pose ~165 px wide, JUMPING + SLEEPY a bit wider.
    happy: { x: 60, y: 600, w: 170, h: 355 },
    listening: { x: 235, y: 600, w: 170, h: 355 },
    waving: { x: 410, y: 600, w: 180, h: 355 },
    thinking: { x: 595, y: 600, w: 170, h: 355 },
    jumping: { x: 770, y: 600, w: 200, h: 355 },
    sleepy: { x: 985, y: 600, w: 200, h: 355 },
  } satisfies Record<string, CISpriteFrame>,
} as const;

// --- Food action sheet -----------------------------------------------------
// File: public/assets/ci/food-sheet.png
// Source: 깡총이 푸드 액션 가이드

export const FOOD_SHEET = {
  src: "/assets/ci/food-sheet.png",
  intrinsicW: 1448,
  intrinsicH: 1086,
  frames: {
    // 과일 먹기 row (top): 7 frames spanning x≈290..1280, y≈110..360
    apple_hold: { x: 290, y: 110, w: 140, h: 250 },
    apple_bite: { x: 430, y: 110, w: 140, h: 250 },
    banana_hold: { x: 570, y: 110, w: 140, h: 250 },
    banana_bite: { x: 710, y: 110, w: 140, h: 250 },
    strawberry_hold: { x: 850, y: 110, w: 140, h: 250 },
    strawberry_bite: { x: 990, y: 110, w: 140, h: 250 },
    pear_eat: { x: 1130, y: 110, w: 140, h: 250 },

    // 식사 row (mid): 6 frames spanning x≈290..1130, y≈380..620
    meal_prep: { x: 290, y: 380, w: 140, h: 240 },
    meal_bite: { x: 430, y: 380, w: 140, h: 240 },
    meal_eat: { x: 570, y: 380, w: 140, h: 240 },
    meal_chew: { x: 710, y: 380, w: 140, h: 240 },
    meal_swallow: { x: 850, y: 380, w: 140, h: 240 },
    meal_done: { x: 990, y: 380, w: 140, h: 240 },

    // 다양한 표정 row (lower): 3 frames in the bottom-right band
    expr_happy: { x: 770, y: 640, w: 130, h: 240 },
    expr_chew: { x: 900, y: 640, w: 130, h: 240 },
    expr_sip: { x: 1030, y: 640, w: 130, h: 240 },
  } satisfies Record<string, CISpriteFrame>,
} as const;
