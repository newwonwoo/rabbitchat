# RabbitChat / 하얀 토끼 깡총 — 추가 반영분 Addendum v1.1

> 기존 `rabbitchat_claude_handoff_v1.md`, `rabbitchat_claude_prompt_harness_v1.md`, `rabbitchat_claude_final_prompt_v1.md`는 유지한다.  
> 아래 내용만 추가 반영한다.

---

# 1. 추가 핵심 방향

기존 MVP 설계에 다음 3가지를 추가한다.

```text
1. Story Auto Generator
2. 내부 대화 분기 최소 5개
3. Image Asset Auto Resolver
```

요지는 다음과 같다.

```text
부모가 장소와 이벤트만 입력하면
→ 시스템이 이야기/질문/선택지/응답/이미지 슬롯을 자동 생성하고
→ 아이 화면에는 텍스트 없이 큰 사진·그림·캐릭터만 보여준다.
```

---

# 2. Story Auto Generator 추가

## 2.1 목적

부모가 직접 대사를 쓰게 하지 않는다.  
부모는 장소와 있었던 일만 입력하고, 시스템이 이야기 구조를 자동 생성한다.

## 2.2 부모 최소 입력

```ts
type StoryAutoGenerateInput = {
  placeName: string;
  eventText: string;
  childPreference?: string;
  photoAssetId?: string;
};
```

예:

```json
{
  "placeName": "마트",
  "eventText": "카트를 밀고 바나나를 골랐어",
  "childPreference": "바나나를 좋아함"
}
```

## 2.3 자동 생성 출력

```ts
type StoryAutoGenerateOutput = {
  story: Story;
  targetVocab: string[];
  extractedObjects: string[];
  extractedActions: string[];
  sequence: string[];
  branchCount: number;
};
```

필수 생성 항목:

```text
- story title
- StoryScene[]
- StoryChoice[]
- parentSummary
- parentLabel
- internal assistantLine
- internal questionLine
- targetVocab[]
- 최소 5개 내부 분기
```

주의:

```text
parentSummary, parentLabel, assistantLine, questionLine은 내부/부모용이다.
아동 화면에는 절대 렌더링하지 않는다.
```

---

# 3. 내부 대화 분기 최소 5개

## 3.1 원칙

분기는 풍부하게, 화면은 단순하게 간다.

```text
내부 분기: 최소 5개
한 화면 노출 선택지: 2개 중심
특수 장면만 3개 허용
```

## 3.2 권장 분기 유형

Story Auto Generator는 다음 중 최소 5개 이상의 분기 후보를 만들어야 한다.

```text
1. 순서 질문
2. 사물 선택
3. 감정 질문
4. 장소 회상
5. 변주 질문
6. 오답 후 재질문
7. 선호 사물 반복 분기
```

예시:

```text
장소: 마트
이벤트: 카트를 밀고 바나나를 골랐어

분기 후보:
1. 먼저 무엇을 했지? → 카트 / 바나나
2. 어떤 과일을 골랐지? → 바나나 / 사과
3. 바나나를 어디에 담았지? → 카트 / 바닥
4. 기분이 어땠지? → 웃는 얼굴 / 졸린 얼굴
5. 또 바나나를 찾을까? → 바나나 / 우유
```

## 3.3 아동 화면 제한

아동 화면에서 선택지는 동시에 5개를 보여주지 않는다.

```text
좋음: 큰 선택지 2개
허용: 특수 장면에서 3개
금지: 한 화면 선택지 5개
```

---

# 4. Image Asset Auto Resolver 추가

## 4.1 목적

이모지 중심 UI를 최종 방향으로 삼지 않는다.  
아동 화면은 큰 사진·큰 그림·캐릭터 중심이어야 한다.

## 4.2 입력

```ts
type ImageAssetResolveInput = {
  placeName: string;
  eventText: string;
  extractedObjects: string[];
};
```

## 4.3 출력

```ts
type ImageAssetResolveOutput = {
  backgroundAsset: VisualAsset;
  choiceAssets: VisualAsset[];
  objectAssets: VisualAsset[];
};
```

## 4.4 Asset 타입

```ts
export type VisualAsset = {
  id: string;
  kind: "background" | "choice" | "object" | "character" | "fallback";
  label: string;          // 부모/로그용
  imageUrl: string;       // MVP에서는 placeholder 가능
  altForParent: string;   // 부모/접근성용
  source: "internal" | "mock_search" | "generated" | "fallback";
};
```

## 4.5 Resolver 규칙

```text
1. 내부 라이브러리 우선
2. 없으면 mock search candidate 반환
3. 최종 선택 결과 캐시 가능 구조
4. 아동 화면은 큰 배경 이미지 + 큰 선택지 이미지로 렌더링
5. MVP에서는 실제 외부 이미지 검색 호출 금지
```

## 4.6 MVP 구현 방식

실제 검색 API는 붙이지 않는다.

```text
MVP: mock asset resolver
v1: 내부 라이브러리 매칭
v2: 외부 이미지 검색 + 안전 필터 + 캐시
```

---

# 5. 추가 파일

기존 폴더 구조에 아래 파일만 추가한다.

```text
data/assets.ts

lib/storyAutoGenerator.ts
lib/imageAssetResolver.ts

types/asset.ts
```

## 5.1 data/assets.ts

역할:

```text
마트, 과일 코너, 카트, 바나나, 사과 등 mock visual asset 정의
```

## 5.2 lib/storyAutoGenerator.ts

필수 함수:

```ts
generateStoryFromEvent(input: StoryAutoGenerateInput): StoryAutoGenerateOutput
extractStorySeeds(input: StoryAutoGenerateInput): {
  place: string;
  objects: string[];
  actions: string[];
  sequence: string[];
}
```

MVP에서는 rule-based mock으로 충분하다.

## 5.3 lib/imageAssetResolver.ts

필수 함수:

```ts
resolveAssetsForStory(input: ImageAssetResolveInput): ImageAssetResolveOutput
pickBackgroundAsset(placeName: string): VisualAsset
pickChoiceAssets(objects: string[]): VisualAsset[]
```

MVP에서는 `data/assets.ts`에서 매칭한다.

---

# 6. 기존 Claude 프롬프트에 추가할 문장

Claude에게 기존 프롬프트 뒤에 아래를 붙인다.

```text
추가 요구사항:

1. Story Auto Generator를 추가하라.
부모가 placeName과 eventText만 입력하면 rule-based mock generator가 Story, StoryScene, StoryChoice, parentSummary, parentLabel, assistantLine, questionLine, targetVocab을 자동 생성해야 한다.

2. 내부 대화 분기는 최소 5개 이상 생성하라.
단, 아동 화면에 동시에 보이는 선택지는 2개 중심, 많아도 3개로 제한하라.

3. Image Asset Auto Resolver를 추가하라.
이모지 중심 UI가 아니라 큰 배경 이미지 + 큰 선택지 이미지 구조를 지원해야 한다.
MVP에서는 실제 외부 이미지 검색을 하지 말고 data/assets.ts의 내부 mock asset library를 우선 사용하라.

4. 다음 파일을 추가하라.
- types/asset.ts
- data/assets.ts
- lib/storyAutoGenerator.ts
- lib/imageAssetResolver.ts

5. 실제 외부 이미지 검색 API, OpenAI, ElevenLabs, Supabase 호출은 금지한다.
```

---

# 7. 하네스 추가 검증 항목

기존 하네스에 아래 항목을 추가한다.

```text
| story auto generator | PASS/FAIL | placeName+eventText로 Story 생성 가능 |
| 내부 분기 5개 이상 | PASS/FAIL | branchCount >= 5 |
| image asset resolver | PASS/FAIL | backgroundAsset/choiceAssets 반환 |
| 큰 이미지 구조 | PASS/FAIL | ChildStoryScreen이 backgroundAsset/choiceAsset을 렌더링 가능 |
| 외부 이미지 검색 없음 | PASS/FAIL | 실제 검색 API 호출 없음 |
```

---

# 8. 최종 수용 기준 추가

기존 수용 기준에 아래를 추가한다.

```text
1. 부모가 장소/이벤트만 넣어도 story가 생성된다.
2. 생성된 story는 내부 분기 5개 이상을 가진다.
3. 아동 화면 선택지는 동시에 2개 중심으로 보인다.
4. 이모지 fallback은 가능하지만, 구조상 큰 배경/큰 선택지 이미지를 받을 수 있다.
5. Image Asset Auto Resolver는 mock asset을 반환한다.
```
