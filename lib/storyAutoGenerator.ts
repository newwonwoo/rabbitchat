// Addendum v1.1 §2. Rule-based mock — NO real LLM call.
// Parent supplies placeName + eventText; generator extracts objects/actions
// and returns a Story with at least 3 scenes plus ≥5 internal branch
// candidates (handoff §3 — 화면엔 최대 2~3개만 보임).

import { sanitizeCharacterVoice } from "@/lib/characterVoice";
import type { Choice, Scene, Story } from "@/types/story";

export type StoryAutoGenerateInput = {
  placeName: string;
  eventText: string;
  childPreference?: string;
  photoAssetId?: string;
};

export type BranchCategory =
  | "sequence"
  | "object_pick"
  | "emotion"
  | "place_recall"
  | "variation"
  | "redo_after_miss"
  | "preference_repeat";

export type Branch = {
  id: string;
  category: BranchCategory;
  questionLine: string; // 부모/내부용 — 아동 화면에 표시 X
  options: { id: string; emoji: string; parentLabel: string }[];
};

export type StoryAutoGenerateOutput = {
  story: Story;
  targetVocab: string[];
  extractedObjects: string[];
  extractedActions: string[];
  sequence: string[];
  branchCount: number;
  branches: Branch[];
  assistantLine: string; // 부모/내부용
  questionLine: string; // 부모/내부용
};

// --- Korean keyword dictionaries (rule-based extraction) ---

const OBJECT_KEYWORDS: Record<string, string> = {
  바나나: "🍌",
  사과: "🍎",
  딸기: "🍓",
  배: "🍐",
  우유: "🥛",
  카트: "🛒",
  바닥: "🟫",
  나비: "🦋",
  나무: "🌳",
  꽃: "🌼",
  새: "🐦",
  인사: "👋",
};

// action stem → infinitive (mock 형태 분석)
const ACTION_KEYWORDS: Array<[RegExp, string]> = [
  [/밀(?:었|고|어|었어|었다)?/, "밀다"],
  [/골(?:랐|라|랐어|랐다|랐는)?/, "고르다"],
  [/담(?:았|아|았어|았다)?/, "담다"],
  [/먹(?:었|고|어|었어|었다)?/, "먹다"],
  [/봤(?:다|어)?/, "보다"],
  [/걸(?:었|어|었어|었다)?/, "걷다"],
  [/(?:따라)?(?:갔|가)(?:다|어|었어)?/, "가다"],
  [/만났(?:다|어)?/, "만나다"],
];

const SEQUENCE_HINTS = [
  "먼저",
  "그다음",
  "그 다음",
  "그리고",
  "마지막으로",
  "끝에",
];

function extractObjects(text: string): string[] {
  const out: string[] = [];
  for (const k of Object.keys(OBJECT_KEYWORDS)) {
    if (text.includes(k) && !out.includes(k)) out.push(k);
  }
  return out;
}

function extractActions(text: string): string[] {
  const out: string[] = [];
  for (const [re, infin] of ACTION_KEYWORDS) {
    if (re.test(text) && !out.includes(infin)) out.push(infin);
  }
  return out;
}

function extractSequence(text: string): string[] {
  const out: string[] = [];
  for (const h of SEQUENCE_HINTS) {
    if (text.includes(h)) out.push(h);
  }
  return out;
}

export function extractStorySeeds(input: StoryAutoGenerateInput): {
  place: string;
  objects: string[];
  actions: string[];
  sequence: string[];
} {
  const objects = extractObjects(input.eventText);
  const actions = extractActions(input.eventText);
  const sequence = extractSequence(input.eventText);
  return { place: input.placeName, objects, actions, sequence };
}

function emojiFor(obj: string): string {
  return OBJECT_KEYWORDS[obj] ?? "✨";
}

function buildBranches(
  objects: string[],
  actions: string[],
  preference: string | undefined,
): Branch[] {
  const fruit = objects.find((o) =>
    ["바나나", "사과", "딸기", "배", "우유"].includes(o),
  );
  const tool = objects.find((o) => ["카트", "바닥"].includes(o));
  const pref =
    preference && objects.find((o) => preference.includes(o))
      ? objects.find((o) => preference.includes(o))!
      : (fruit ?? objects[0] ?? "✨");

  const branches: Branch[] = [];

  if (objects.length >= 2) {
    branches.push({
      id: "b_seq_first",
      category: "sequence",
      questionLine: "먼저 무엇을 했지?",
      options: [
        {
          id: "first_a",
          emoji: emojiFor(objects[0]),
          parentLabel: objects[0],
        },
        {
          id: "first_b",
          emoji: emojiFor(objects[1]),
          parentLabel: objects[1],
        },
      ],
    });
  }

  if (fruit) {
    const other = objects.find((o) => o !== fruit && OBJECT_KEYWORDS[o]) ?? "사과";
    branches.push({
      id: "b_obj_pick",
      category: "object_pick",
      questionLine: "어떤 것을 골랐지?",
      options: [
        { id: "pick_a", emoji: emojiFor(fruit), parentLabel: fruit },
        { id: "pick_b", emoji: emojiFor(other), parentLabel: other },
      ],
    });
  }

  if (fruit && tool) {
    branches.push({
      id: "b_place_recall",
      category: "place_recall",
      questionLine: `${fruit}를 어디에 담았지?`,
      options: [
        { id: "in_tool", emoji: emojiFor(tool), parentLabel: tool },
        { id: "in_floor", emoji: "🟫", parentLabel: "바닥" },
      ],
    });
  }

  branches.push({
    id: "b_emotion",
    category: "emotion",
    questionLine: "기분이 어땠지?",
    options: [
      { id: "emo_happy", emoji: "😊", parentLabel: "웃는 얼굴" },
      { id: "emo_sleepy", emoji: "😴", parentLabel: "졸린 얼굴" },
    ],
  });

  if (fruit) {
    branches.push({
      id: "b_variation",
      category: "variation",
      questionLine: `또 ${fruit}를 찾을까?`,
      options: [
        { id: "again_yes", emoji: emojiFor(fruit), parentLabel: fruit },
        { id: "again_milk", emoji: "🥛", parentLabel: "우유" },
      ],
    });
  }

  // ensure ≥5
  if (branches.length < 5) {
    branches.push({
      id: "b_redo",
      category: "redo_after_miss",
      questionLine: "다시 한번 해볼까?",
      options: [
        { id: "redo_yes", emoji: "🔁", parentLabel: "다시" },
        { id: "redo_no", emoji: "✨", parentLabel: "넘어가기" },
      ],
    });
  }

  if (branches.length < 5) {
    branches.push({
      id: "b_pref_repeat",
      category: "preference_repeat",
      questionLine: "좋아하는 걸 또 해볼까?",
      options: [
        { id: "pref_yes", emoji: emojiFor(pref), parentLabel: pref },
        { id: "pref_other", emoji: "🌳", parentLabel: "다른 것" },
      ],
    });
  }

  return branches;
}

function branchToChoices(b: Branch): Choice[] {
  // 한 화면 노출은 2개 중심 (handoff §3.3).
  return b.options.slice(0, 2).map((o) => ({
    id: `${b.id}_${o.id}`,
    emoji: o.emoji,
    nextSceneId: null, // generator는 단일 트리, 다음 scene 연결은 페이지가 결정
    parentLabel: o.parentLabel,
  }));
}

export function generateStoryFromEvent(
  input: StoryAutoGenerateInput,
): StoryAutoGenerateOutput {
  const seeds = extractStorySeeds(input);
  const branches = buildBranches(
    seeds.objects,
    seeds.actions,
    input.childPreference,
  );

  // ≥3 scenes: intro / mid / closing. Each takes one branch's choices.
  const intro = branches[0] ?? branches[branches.length - 1];
  const mid = branches[1] ?? branches[0];
  const closing = branches[2] ?? branches[branches.length - 1];

  const id = `auto_${Date.now().toString(36)}`;
  const scenes: Scene[] = [
    {
      id: `${id}_s1`,
      placeId: "auto_place",
      visual: `${seedEmoji(seeds.place)}${
        seeds.objects[0] ? emojiFor(seeds.objects[0]) : ""
      }`,
      parentSummary: sanitizeCharacterVoice(
        `${seeds.place}에서 ${seeds.objects[0] ?? "장소"}를 봄.`,
      ),
      choices: branchToChoices(intro).map((c) => ({
        ...c,
        nextSceneId: `${id}_s2`,
      })),
    },
    {
      id: `${id}_s2`,
      placeId: "auto_place",
      visual: seeds.objects.slice(0, 2).map(emojiFor).join("") || "✨",
      parentSummary: sanitizeCharacterVoice(
        `${seeds.objects[0] ?? "사물"} 중 하나를 고름.`,
      ),
      choices: branchToChoices(mid).map((c) => ({
        ...c,
        nextSceneId: `${id}_s3`,
      })),
    },
    {
      id: `${id}_s3`,
      placeId: "auto_place",
      visual: `${
        seeds.objects.find((o) => ["바나나", "사과", "딸기"].includes(o))
          ? emojiFor(
              seeds.objects.find((o) =>
                ["바나나", "사과", "딸기"].includes(o),
              )!,
            )
          : "✨"
      }✨`,
      parentSummary: sanitizeCharacterVoice("이야기 마무리. 즐거워함."),
      choices: branchToChoices(closing).map((c) => ({
        ...c,
        nextSceneId: null,
      })),
    },
  ];

  const story: Story = {
    id,
    themeId: "auto_theme",
    title: `${seeds.place}에서의 이야기`,
    startSceneId: scenes[0].id,
    scenes,
  };

  const targetVocab = Array.from(new Set([...seeds.objects, ...seeds.actions]));

  const assistantLine = sanitizeCharacterVoice(
    `${seeds.place}에서 ${seeds.objects[0] ?? "여러 가지"}를 봤구나. 우리 같이 해볼까?`,
  );
  const questionLine = sanitizeCharacterVoice(
    `${seeds.place}에서 무엇을 먼저 했지?`,
  );

  return {
    story,
    targetVocab,
    extractedObjects: seeds.objects,
    extractedActions: seeds.actions,
    sequence: seeds.sequence,
    // Addendum v1.1 §3.1 — branchCount must be >= 5
    branchCount: branches.length,
    branches,
    assistantLine,
    questionLine,
  };
}

function seedEmoji(place: string): string {
  if (place.includes("마트")) return "🏬";
  if (place.includes("공원")) return "🌳";
  if (place.includes("집")) return "🏠";
  return "📍";
}
