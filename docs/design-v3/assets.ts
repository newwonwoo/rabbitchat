/**
 * data/assets.ts
 * ----------------------------------------------------------
 * 깡총이 PNG 자산 30개 + 키워드 인덱스.
 * imageSearcher.ts의 4단 폴백 체인 중 1단계(local) 데이터 소스.
 *
 * 검색 흐름:
 *   storyPipeline에서 선택지 키워드 도착 → findAssetByKeyword(keyword)
 *   → 키워드 태그 매칭 → 가장 점수 높은 자산 반환 → API 호출 0
 *
 * 자산 추가 시:
 *   1. public/assets/character/ 에 PNG 업로드
 *   2. 아래 CHARACTER_ASSETS 배열에 entry 추가
 *   3. keywords에 한국어/영어 변형을 충분히 넣어주기 (fuzzy 매칭 정확도 ↑)
 */

// ── 카테고리 정의 ─────────────────────────────────────────
// 자산을 5개 카테고리로 분류 — UI에서 갤러리 필터링 등에 활용
export type AssetCategory =
  | 'expression' // 표정 (happy, smile, sleepy 등)
  | 'pose'       // 포즈 (standing, hi, handsup 등)
  | 'food-action'// 음식 먹기 액션 (eatapple, eatbanana 등)
  | 'food-item'  // 음식 자체 (apple, banana, rice 등)
  | 'daily'      // 일상 액션 (bathtub, cleanteeth, washhands 등)

// ── 자산 타입 ───────────────────────────────────────────
export interface CharacterAsset {
  /** 자산 키 (파일명에서 .png 제거) — 식별자 */
  key: string
  /** 정적 자산 경로 (public 기준) */
  src: string
  /** UI 표시용 한국어 이름 */
  label: string
  /** 카테고리 */
  category: AssetCategory
  /** fuzzy 매칭용 키워드 (한/영 변형 다양하게) */
  keywords: string[]
  /** 추천 모션 (선택 사항) — 부모 검토 시 자동 추천 */
  suggestedMotion?: 'still' | 'breathing' | 'jumping'
}

// ── 30개 자산 인덱스 ──────────────────────────────────────
export const CHARACTER_ASSETS: CharacterAsset[] = [
  // ── 표정 ────────────────────────────────────────────
  {
    key: 'happy',
    src: '/assets/character/happy.png',
    label: '기뻐',
    category: 'expression',
    keywords: ['happy', '기뻐', '신나', '좋아', '행복', '재밌', '즐거', '웃'],
    suggestedMotion: 'jumping',
  },
  {
    key: 'smile',
    src: '/assets/character/smile.png',
    label: '미소',
    category: 'expression',
    keywords: ['smile', '미소', '웃', '편안', '잔잔'],
  },
  {
    key: 'curious',
    src: '/assets/character/curious.png',
    label: '궁금해',
    category: 'expression',
    keywords: ['curious', 'listening', 'thinking', '궁금', '들어', '생각', '뭐야', '왜'],
  },
  {
    key: 'sleepy',
    src: '/assets/character/sleepy.png',
    label: '졸려',
    category: 'expression',
    // 단음절 '자', '쉬'는 다른 동사에 잘못 매칭되므로 복합어만 사용
    keywords: ['sleepy', '졸려', '졸림', '잘자', '잘 자', '자고', '자자', '잠자', '잠들', '낮잠', '꿈', '굿나잇', '나이트'],
  },

  // ── 포즈 ────────────────────────────────────────────
  {
    key: 'standing',
    src: '/assets/character/standing.png',
    label: '서있어',
    category: 'pose',
    keywords: ['standing', '서있', '서다', '기본'],
  },
  {
    key: 'hi',
    src: '/assets/character/hi.png',
    label: '인사',
    category: 'pose',
    keywords: ['hi', 'hello', 'waving', '안녕', '인사', '반가워', '만나'],
  },
  {
    key: 'handsup',
    src: '/assets/character/handsup.png',
    label: '만세',
    category: 'pose',
    keywords: ['handsup', 'jumping', '만세', '신나', '점프', '우와', '와'],
    suggestedMotion: 'jumping',
  },
  {
    key: 'side',
    src: '/assets/character/side.png',
    label: '옆모습',
    category: 'pose',
    keywords: ['side', '옆', '옆모습'],
  },
  {
    key: 'back',
    src: '/assets/character/back.png',
    label: '뒷모습',
    category: 'pose',
    keywords: ['back', '뒤', '뒷모습'],
  },

  // ── 음식 먹기 액션 ───────────────────────────────────
  {
    key: 'eatapple',
    src: '/assets/character/eatapple.png',
    label: '사과 먹기',
    category: 'food-action',
    keywords: ['사과', 'apple', '사과 먹', '과일', '아삭'],
  },
  {
    key: 'eatbanana',
    src: '/assets/character/eatbanana.png',
    label: '바나나 먹기',
    category: 'food-action',
    keywords: ['바나나', 'banana', '바나나 먹', '과일'],
  },
  {
    key: 'eatstrawberry',
    src: '/assets/character/eatstrawberry.png',
    label: '딸기 먹기',
    category: 'food-action',
    keywords: ['딸기', 'strawberry', '딸기 먹', '과일', '빨간'],
  },
  {
    key: 'eatmeal',
    src: '/assets/character/eatmeal.png',
    label: '밥 먹기',
    category: 'food-action',
    keywords: ['밥', 'meal', '밥 먹', '식사', '먹', '점심', '저녁', '아침'],
  },
  {
    key: 'eatmealready',
    src: '/assets/character/eatmealready.png',
    label: '밥 먹을 준비',
    category: 'food-action',
    keywords: ['식사 준비', '밥 준비', 'ready', '준비'],
  },
  {
    key: 'yummy',
    src: '/assets/character/yummy.png',
    label: '맛있어',
    category: 'food-action',
    keywords: ['맛있', 'yummy', 'delicious', '냠냠', '잘먹', '꿀맛'],
  },

  // ── 음식 자체 ───────────────────────────────────────
  // 부모 검토 화면이나 보조 이미지에 활용
  {
    key: 'apple',
    src: '/assets/character/apple.png',
    label: '사과',
    category: 'food-item',
    keywords: ['사과', 'apple', '과일', '빨간'],
  },
  {
    key: 'banana',
    src: '/assets/character/banana.png',
    label: '바나나',
    category: 'food-item',
    keywords: ['바나나', 'banana', '과일', '노란'],
  },
  {
    key: 'starawberry',
    src: '/assets/character/starawberry.png', // 원본 파일명 오타 그대로 유지
    label: '딸기',
    category: 'food-item',
    keywords: ['딸기', 'strawberry', '과일', '빨간'],
  },
  {
    key: 'rice',
    src: '/assets/character/rice.png',
    label: '밥',
    category: 'food-item',
    keywords: ['밥', 'rice', '쌀', '식사'],
  },
  {
    key: 'bibimbop',
    src: '/assets/character/bibimbop.png',
    label: '비빔밥',
    category: 'food-item',
    keywords: ['비빔밥', 'bibimbap', '밥', '한식'],
  },
  {
    key: 'water',
    src: '/assets/character/water.png',
    label: '물',
    category: 'food-item',
    keywords: ['물', 'water', '음료'],
  },

  // ── 일상 액션 ───────────────────────────────────────
  {
    key: 'drinkwater',
    src: '/assets/character/drinkwater.png',
    label: '물 마시기',
    category: 'daily',
    keywords: ['물 마시', 'drink water', '꿀꺽', '음료'],
  },
  {
    key: 'juice',
    src: '/assets/character/juice.png',
    label: '주스 마시기',
    category: 'daily',
    keywords: ['주스', 'juice', '음료 마시', '시원'],
  },
  {
    key: 'bathtub',
    src: '/assets/character/bathtub.png',
    label: '목욕',
    category: 'daily',
    keywords: ['목욕', 'bathtub', 'bath', '씻', '욕조', '거품', '뽀득'],
  },
  {
    key: 'cleanteeth',
    src: '/assets/character/cleanteeth.png',
    label: '양치',
    category: 'daily',
    keywords: ['양치', '이 닦', '이닦', '이를 닦', '이를닦', '치카', '치카치카', 'teeth', 'brush', 'brushing', '깨끗한 이'],
  },
  {
    key: 'washhands',
    src: '/assets/character/washhands.png',
    label: '손 씻기',
    category: 'daily',
    keywords: ['손 씻', 'wash', '손', '비누', '깨끗'],
  },
  {
    key: 'pupu',
    src: '/assets/character/pupu.png',
    label: '응가',
    category: 'daily',
    keywords: ['응가', '쉬', '화장실', 'toilet', 'pupu', '변기'],
  },
  {
    key: 'dooyoo',
    src: '/assets/character/dooyoo.png',
    label: '두유',
    category: 'daily',
    keywords: ['두유', 'soy milk', '음료'],
  },

  // ── 보너스 (jpg) ────────────────────────────────────
  {
    key: 'mtdaemowithfamily',
    src: '/assets/character/mtdaemowithfamily.jpg',
    label: '대모산 가족',
    category: 'pose',
    keywords: ['대모산', '가족', '산', '나들이', 'family', '엄마와', '아빠와'],
  },
]

// ── 키 → 자산 직접 조회용 인덱스 (빠른 lookup) ──────────────
// 모듈 로드 시 한 번만 생성됨
const ASSET_BY_KEY: Record<string, CharacterAsset> = Object.fromEntries(
  CHARACTER_ASSETS.map((a) => [a.key, a])
)

/**
 * 자산 키로 직접 조회.
 * 키가 없으면 null.
 */
export function getAssetByKey(key: string): CharacterAsset | null {
  return ASSET_BY_KEY[key] ?? null
}

// ── fuzzy 매칭 ───────────────────────────────────────────
/**
 * 입력 키워드와 자산 키워드 간 매칭 점수 계산.
 * - 정확 일치: +10
 * - 자산 키워드가 입력에 포함: +5
 * - 입력이 자산 키워드에 포함: +3
 * - 부분 일치 (2글자 이상): +1
 *
 * 한국어/영어 모두 소문자/공백 정규화 후 비교.
 */
function scoreMatch(input: string, asset: CharacterAsset): number {
  const normInput = input.toLowerCase().trim()
  if (!normInput) return 0

  let score = 0
  for (const kw of asset.keywords) {
    const normKw = kw.toLowerCase().trim()
    if (!normKw) continue

    if (normInput === normKw) {
      score += 10
    } else if (normInput.includes(normKw)) {
      score += 5
    } else if (normKw.includes(normInput)) {
      score += 3
    } else if (normInput.length >= 2 && normKw.length >= 2) {
      // 2글자 이상의 부분 겹침 감지
      for (let i = 0; i <= normInput.length - 2; i++) {
        const fragment = normInput.slice(i, i + 2)
        if (normKw.includes(fragment)) {
          score += 1
          break
        }
      }
    }
  }
  return score
}

/**
 * 키워드로 가장 잘 맞는 자산 1개 찾기 (fuzzy match).
 * 점수가 0이면 null 반환 → 다음 폴백 단계로 넘어감.
 *
 * @example
 *   findAssetByKeyword('사과 먹은 이야기') → eatapple
 *   findAssetByKeyword('목욕할 시간')     → bathtub
 *   findAssetByKeyword('전혀 모르는 단어') → null
 */
export function findAssetByKeyword(keyword: string): CharacterAsset | null {
  if (!keyword || !keyword.trim()) return null

  let bestAsset: CharacterAsset | null = null
  let bestScore = 0

  for (const asset of CHARACTER_ASSETS) {
    const score = scoreMatch(keyword, asset)
    if (score > bestScore) {
      bestScore = score
      bestAsset = asset
    }
  }

  // 점수 0 = 매칭 없음
  return bestScore > 0 ? bestAsset : null
}

/**
 * 키워드로 상위 N개 자산 반환 (디버그·검토 화면용).
 */
export function findAssetsByKeyword(
  keyword: string,
  limit = 5
): Array<{ asset: CharacterAsset; score: number }> {
  if (!keyword || !keyword.trim()) return []

  return CHARACTER_ASSETS
    .map((asset) => ({ asset, score: scoreMatch(keyword, asset) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * 카테고리로 자산 필터링 (갤러리 화면용).
 */
export function getAssetsByCategory(category: AssetCategory): CharacterAsset[] {
  return CHARACTER_ASSETS.filter((a) => a.category === category)
}
