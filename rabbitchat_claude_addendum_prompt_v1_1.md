# RabbitChat / 하얀 토끼 깡총 — Claude 추가 프롬프트 Addendum v1.1

아래 내용을 기존 Claude Code 프롬프트 뒤에 그대로 추가하세요.

---

추가 요구사항을 반영하라.

기존 MVP 구조는 유지하되, 이번 작업에서는 다음 3가지를 반드시 추가한다.

```text
1. Story Auto Generator
2. 내부 대화 분기 최소 5개
3. Image Asset Auto Resolver
```

## 1. Story Auto Generator

부모가 대사를 직접 쓰지 않도록 한다.

부모 입력은 최소값만 받는다.

```ts
type StoryAutoGenerateInput = {
  placeName: string;
  eventText: string;
  childPreference?: string;
  photoAssetId?: string;
};
```

예:

```ts
generateStoryFromEvent({
  placeName: "마트",
  eventText: "카트를 밀고 바나나를 골랐어",
  childPreference: "바나나를 좋아함"
});
```

출력은 다음 구조를 포함해야 한다.

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

필수 규칙:

- rule-based mock generator로 구현한다.
- 실제 LLM 호출 금지.
- placeName과 eventText에서 장소, 사물, 행동, 순서를 추출한다.
- 장면은 최소 3개 이상 생성한다.
- 내부 대화 분기는 최소 5개 이상 생성한다.
- parentSummary, parentLabel, assistantLine, questionLine은 내부/부모용이다.
- 아동 화면에는 parentSummary, parentLabel, assistantLine, questionLine을 표시하지 않는다.

필수 파일:

```text
lib/storyAutoGenerator.ts
```

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

## 2. 내부 대화 분기 최소 5개

Story Auto Generator는 다음 유형 중 최소 5개 이상의 분기 후보를 만들어야 한다.

```text
1. 순서 질문
2. 사물 선택
3. 감정 질문
4. 장소 회상
5. 변주 질문
6. 오답 후 재질문
7. 선호 사물 반복 분기
```

주의:

```text
내부 분기 수는 최소 5개 이상이어야 한다.
하지만 아동 화면에 동시에 보이는 선택지는 2개 중심으로 제한한다.
특수 장면만 3개까지 허용한다.
한 화면에 선택지 5개를 전부 보여주지 말라.
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

## 3. Image Asset Auto Resolver

아동 화면은 이모지 중심이 아니라 **큰 사진·큰 그림·캐릭터 중심** 구조로 설계한다.

MVP에서는 실제 외부 이미지 검색을 하지 않는다.  
대신 내부 mock asset library를 사용한다.

입력:

```ts
type ImageAssetResolveInput = {
  placeName: string;
  eventText: string;
  extractedObjects: string[];
};
```

출력:

```ts
type ImageAssetResolveOutput = {
  backgroundAsset: VisualAsset;
  choiceAssets: VisualAsset[];
  objectAssets: VisualAsset[];
};
```

Asset 타입:

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

필수 파일:

```text
types/asset.ts
data/assets.ts
lib/imageAssetResolver.ts
```

필수 함수:

```ts
resolveAssetsForStory(input: ImageAssetResolveInput): ImageAssetResolveOutput
pickBackgroundAsset(placeName: string): VisualAsset
pickChoiceAssets(objects: string[]): VisualAsset[]
```

Resolver 규칙:

```text
1. 내부 라이브러리 우선
2. 없으면 mock search candidate 반환
3. 최종 선택 결과 캐시 가능 구조
4. 아동 화면은 큰 배경 이미지 + 큰 선택지 이미지로 렌더링
5. 실제 외부 이미지 검색 API 호출 금지
```

## 4. ChildStoryScreen 반영

ChildStoryScreen은 이모지 fallback만 쓰는 구조가 아니라, 다음을 받을 수 있어야 한다.

```ts
backgroundAsset?: VisualAsset;
choiceAssets?: VisualAsset[];
```

렌더링 규칙:

- backgroundAsset이 있으면 큰 배경 이미지/placeholder로 렌더링
- choiceAsset이 있으면 큰 선택지 이미지/placeholder로 렌더링
- asset이 없으면 기존 이모지 fallback 사용
- parentLabel은 화면에 표시하지 않고 aria-label로만 사용

## 5. 하네스 검증 추가

최종 보고의 하네스 검증 표에 아래 항목을 추가하라.

```text
| story auto generator | PASS/FAIL | placeName+eventText로 Story 생성 가능 |
| 내부 분기 5개 이상 | PASS/FAIL | branchCount >= 5 |
| image asset resolver | PASS/FAIL | backgroundAsset/choiceAssets 반환 |
| 큰 이미지 구조 | PASS/FAIL | ChildStoryScreen이 backgroundAsset/choiceAsset을 렌더링 가능 |
| 외부 이미지 검색 없음 | PASS/FAIL | 실제 검색 API 호출 없음 |
```

## 6. 금지

다음은 하지 말라.

```text
실제 외부 이미지 검색 API 호출
실제 OpenAI API 호출
실제 ElevenLabs API 호출
Supabase 연결
아동 화면 텍스트 표시
한 화면에 선택지 5개 동시 노출
```

## 7. 성공 기준 추가

기존 성공 기준에 아래를 추가한다.

```text
1. 부모가 장소/이벤트만 넣어도 story가 생성된다.
2. 생성된 story는 내부 분기 5개 이상을 가진다.
3. 아동 화면 선택지는 동시에 2개 중심으로 보인다.
4. 이모지 fallback은 가능하지만, 구조상 큰 배경/큰 선택지 이미지를 받을 수 있다.
5. Image Asset Auto Resolver는 mock asset을 반환한다.
```

핵심 통제 문장:

```text
분기는 풍부하게, 화면은 단순하게.
텍스트는 부모 화면에만, 아이 화면에는 큰 그림만.
```
