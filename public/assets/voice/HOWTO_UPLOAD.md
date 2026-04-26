# 엄마 녹음 음성 파일 업로드 가이드

이 폴더(`public/assets/voice/`)에 들어가는 mp3는 **각 장면이 로드될 때 자동 재생**됩니다.
ElevenLabs로 합성하지 않고 **녹음 파일 그대로** 재생되므로 비용 0, 음질 100%.

## 원우 — "오늘 어린이집" 이야기 7개

| 파일명 | 스크립트 | 어떤 장면에서 재생 |
|---|---|---|
| `hi.mp3` | "안녕 원우야" | k1: 첫 진입 인사 |
| `kinder.mp3` | "어린이집 잘 다녀왔어? 오늘은 무슨 놀이하고 놀았어?" | k2: 놀이 묻기 (블록/공/책 선택지) |
| `lunch.mp3` | "원우야 오늘은 무슨 반찬에 밥을 먹었어?" | k3: 반찬 묻기 (닭고기/김치/국수 선택지) |
| `goodfood.mp3` | "와 맛있었겠다. 원우가 좋아하는 반찬이었네 나도 먹고 싶어" | k4: 맛있었구나 반응 |
| `whowith.mp3` | "어떤 친구랑 가장 재미있게 놀았어?" | k5: 친구 묻기 (시현이/다른 친구) |
| `withsihyun.mp3` | "아~ 시현이랑 재미있게 놀았구나" | k6: 시현이 골랐을 때만 |
| `wonwoobestwithfriend.mp3` | "우리 원우 오늘도 친구들과 같이 사이좋게 보냈어요!" | k7: 마지막 마무리 |

## 업로드 방법

### GitHub 웹 (가장 쉬움)
1. https://github.com/newwonwoo/rabbitchat 접속 → 브랜치 `claude/prioritize-task-list-OA6E0` 선택
2. `public` → `assets` → `voice` 폴더 진입
3. **"Add file" → "Upload files"** → 7개 mp3 드래그앤드롭
4. **파일명을 위 표대로 정확히** (`hi.mp3`, `kinder.mp3` 등)
5. Commit changes

### 로컬에서
```powershell
copy "C:\녹음\*.mp3" "C:\Users\82108\rabbitchat\public\assets\voice\"
git add public/assets/voice/
git commit -m "Add Wonwoo voice recordings"
git push
```

## 동작 흐름

```
앱 진입
  → theme = "오늘 하루" (기본)
  → 첫 장면 k1 로드
  → ChildStoryScreen이 hi.mp3 자동 재생 ("안녕 원우야")
  → 원우가 ▶️ 누르면
  → k2 로드 → kinder.mp3 자동 재생
  → 🧱/⚽/📚 중 하나 누르면
  → k3 로드 → lunch.mp3 자동 재생
  → ...
  → k7 wonwoobestwithfriend.mp3 → 이야기 종료
```

각 장면 진입 시:
- mp3 파일이 있으면 → 그 mp3 재생 (TTS 안 거침, 비용 0)
- 파일이 없으면 → 조용히 스킵 (다음 단계에서 TTS로 fallback 예정)

## 다른 이야기에도 음성 넣고 싶다면

`data/stories.ts`의 다른 Story 객체들의 각 Scene에도 `audioFile` 필드를 추가하면 됩니다:

```ts
{
  id: "s1",
  visual: "🏬🛒",
  audioFile: "/assets/voice/mart_intro.mp3",   // 추가
  parentSummary: "...",
  choices: [...]
}
```

해당 mp3를 `public/assets/voice/`에 같이 두면 자동 매칭.

## 음질 권장

| 항목 | 권장 |
|---|---|
| 형식 | mp3 (m4a/wav도 브라우저 지원) |
| 비트레이트 | 96~128 kbps |
| 길이 | 1~5초 권장, 10초 이내 |
| 크기 | 파일당 50KB 미만 |
| 환경 | 조용한 방, 휴대폰 음성 메모도 충분 |

## 주의

- 파일명 대소문자 구분됨 (`Hi.mp3` ≠ `hi.mp3`)
- 한글 파일명은 피하기 (영어/숫자/언더스코어 권장)
- 첫 자동 재생은 **사용자가 화면을 한 번 터치한 후**부터 가능 (브라우저 정책)
  → 깡총이 캐릭터 클릭 또는 ▶️ 버튼이 첫 터치 역할을 해줌
