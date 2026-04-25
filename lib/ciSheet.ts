// CI sheet sprite coordinates.
//
// The two CI sheets that the parent uploads to public/assets/ci/ are
// large composite images. We crop individual poses with CSS background-image
// + background-position rather than asking the parent to cut PNGs.
//
// All coordinates are EXPRESSED RELATIVE to the natural intrinsic sheet
// dimensions (width × height in pixels). Each pose is rendered into a
// square frame whose width equals `frameW`. CSS scales the sheet so that
// `frameW` of the sheet maps to the rendered size.
//
// If the parent uploads a sheet at a different resolution, the math still
// works — only the absolute pixel numbers change. The relative ratios in
// the sheets they showed me look stable, so these coords should match
// the typical export.
//
// To re-tune: open public/assets/ci/character-sheet.png in a browser,
// hover the pose you want, note its bounding box, and update the entry.

export type CISpriteFrame = {
  // top-left corner inside the sheet (px, intrinsic)
  x: number;
  y: number;
  // crop size (px, intrinsic)
  w: number;
  h: number;
};

// --- Character expressions sheet -------------------------------------------
// File: public/assets/ci/character-sheet.png
// Source: CHARACTER IDENTITY SHEET (the second uploaded CI image)
// Sheet intrinsic size assumed: 1440 × 1020 (typical export). Edit if
// the actual upload differs.

export const CHARACTER_SHEET = {
  src: "/assets/ci/character-sheet.png",
  intrinsicW: 1440,
  intrinsicH: 1020,
  frames: {
    happy: { x: 50, y: 590, w: 200, h: 360 },
    listening: { x: 240, y: 590, w: 200, h: 360 },
    waving: { x: 430, y: 590, w: 200, h: 360 },
    thinking: { x: 615, y: 590, w: 200, h: 360 },
    jumping: { x: 800, y: 590, w: 200, h: 360 },
    sleepy: { x: 985, y: 590, w: 220, h: 360 },
  } satisfies Record<string, CISpriteFrame>,
} as const;

// --- Food action sheet -----------------------------------------------------
// File: public/assets/ci/food-sheet.png
// Source: 깡총이 푸드 액션 가이드 (the first uploaded CI image)
// Sheet intrinsic size assumed: 1440 × 1020.

export const FOOD_SHEET = {
  src: "/assets/ci/food-sheet.png",
  intrinsicW: 1440,
  intrinsicH: 1020,
  frames: {
    // 과일 먹기 row (top)
    apple_hold: { x: 295, y: 110, w: 130, h: 240 },
    apple_bite: { x: 425, y: 110, w: 130, h: 240 },
    banana_hold: { x: 555, y: 110, w: 130, h: 240 },
    banana_bite: { x: 685, y: 110, w: 130, h: 240 },
    strawberry_hold: { x: 815, y: 110, w: 130, h: 240 },
    strawberry_bite: { x: 945, y: 110, w: 130, h: 240 },
    pear_eat: { x: 1075, y: 110, w: 130, h: 240 },

    // 식사 row
    meal_prep: { x: 295, y: 360, w: 130, h: 240 },
    meal_bite: { x: 425, y: 360, w: 130, h: 240 },
    meal_eat: { x: 555, y: 360, w: 130, h: 240 },
    meal_chew: { x: 685, y: 360, w: 130, h: 240 },
    meal_swallow: { x: 815, y: 360, w: 130, h: 240 },
    meal_done: { x: 945, y: 360, w: 130, h: 240 },

    // 다양한 표정 row
    expr_happy: { x: 770, y: 600, w: 130, h: 240 },
    expr_chew: { x: 900, y: 600, w: 130, h: 240 },
    expr_sip: { x: 1030, y: 600, w: 130, h: 240 },
  } satisfies Record<string, CISpriteFrame>,
} as const;
