# 실사·일러스트 이미지 가이드 (addendum §4.1)

설계서 §4.1: **"이모지 중심 UI는 최종 방향이 아님. 큰 사진·큰 그림·캐릭터 중심"**

코드는 png가 들어오면 자동으로 emoji → image로 교체합니다. 단순히 **올바른 파일명**으로 **올바른 폴더**에 떨어뜨리기만 하면 됨.

---

## 공통 스타일 (모든 이미지에 붙일 접미사)

```
soft pastel children's book illustration, dusty pink and cream palette
(#F6F1E8, #EDE8DC, #E4DCCF, #F7D7DA, #DCCFBE), rounded shapes,
subtle felt texture, soft ambient lighting, no harsh outlines,
warm friendly atmosphere, no text
```

이 스타일을 모든 프롬프트 끝에 그대로 붙이면 캐릭터·배경·사물이 한 세계관처럼 보입니다.

---

## 어린이집 (오늘 하루) 스토리에 필요한 이미지

### 배경 5장 (`public/assets/bg_*.png`, 1024×1024 또는 1920×1080)

| 파일명 | 장면 | 프롬프트 |
|---|---|---|
| `bg_kinder_intro.png` | k1 첫 인사 | `Cozy soft children's-book living room corner with morning light, plush bunny waiting, warm welcoming atmosphere, no text, no people` + 공통 스타일, `--ar 16:9` |
| `bg_kindergarten.png` | k2 어린이집 놀이방 | `Soft children's-book Korean kindergarten classroom interior, wooden toy shelves, colorful mat, soft sunlight, no children, no text` + 공통 스타일, `--ar 16:9` |
| `bg_lunch_table.png` | k3 점심·k4 반응 | `Soft children's-book Korean kindergarten lunch table, small wooden chairs, lunch tray placeholder, warm light, no people, no text` + 공통 스타일, `--ar 16:9` |
| `bg_friends_play.png` | k5 친구·k6 시현이 | `Soft children's-book scene of small kids' play area with cushions and stuffed toys, no children, no text` + 공통 스타일, `--ar 16:9` |
| `bg_kinder_close.png` | k7 마무리 | `Cozy children's-book bedroom corner at golden-hour light, plush bunny on rug, warm closing atmosphere, no people, no text` + 공통 스타일, `--ar 16:9` |

### 선택지 사물 8장 (`public/assets/obj_*.png`, 512×512, 투명 배경)

| 파일명 | 선택지 | 프롬프트 |
|---|---|---|
| `obj_blocks.png` | 블록 놀이 | `A small stack of three colorful wooden blocks, friendly chunky shapes, transparent background` + 공통 스타일, `--ar 1:1` |
| `obj_ball_play.png` | 공놀이 | `A single soft pastel rubber ball, friendly round, transparent background` + 공통 스타일, `--ar 1:1` |
| `obj_book_kids.png` | 책 읽기 | `A single small children's picture book, opened slightly with pastel cover, transparent background` + 공통 스타일, `--ar 1:1` |
| `obj_chicken_meal.png` | 닭고기 | `A single small piece of cooked chicken on a tiny plate, Korean kid lunch portion, transparent background` + 공통 스타일, `--ar 1:1` |
| `obj_kimchi.png` | 김치 | `A small bowl of mild Korean kimchi, friendly cartoon-illustration style, transparent background` + 공통 스타일, `--ar 1:1` |
| `obj_noodle.png` | 국수 | `A small bowl of Korean noodles in light broth, kid-friendly portion, transparent background` + 공통 스타일, `--ar 1:1` |
| `obj_friend_other.png` | 다른 친구 | `A friendly anonymous child silhouette with warm smile, no specific facial details, plush-toy aesthetic, transparent background` + 공통 스타일, `--ar 1:1` |
| `obj_arrow_next.png` | ▶️ 시작/다음 | `A simple round soft pink "play" arrow button icon, plush style, transparent background` + 공통 스타일, `--ar 1:1` |

### 시현이 (특별 케이스)

`obj_friend_sihyun.png` — **두 가지 옵션**:

**옵션 A — 실 사진** (개인정보 OK일 때)
- 시현이의 실제 사진 한 장을 정사각형으로 크롭
- 배경 제거 (https://www.remove.bg)
- `obj_friend_sihyun.png`로 저장

**옵션 B — 일러스트** (privacy 우선)
- 프롬프트: `A specific friendly child illustration with brown bowl haircut, warm smile, pastel sweater, plush-toy aesthetic, transparent background` + 공통 스타일, `--ar 1:1`

---

## 이미 있는 다른 이야기 (마트·공원)도 같이 받으면 좋음

`bg_mart_entrance.png`, `bg_fruit_aisle.png`, `bg_checkout.png`, `bg_park_path.png`, `bg_home.png` 등 + 사물 (바나나/사과/딸기/배/카트/나비/꽃/새).

전체 리스트는 `data/assets.ts` 참고. 각각 같은 공통 스타일로 만들면 시리즈로 이쁘게 나옵니다.

---

## 어디서 만드나

### AI 생성 (가장 쉬움)
- **ChatGPT Image (GPT-4o)**: 한국어 가능, 결과 일관성 좋음
- **Midjourney**: 위 프롬프트에 `--style raw --v 6` 추가
- **Imagen / Adobe Firefly**: 무료 크레딧

### 실사 (Pexels / Unsplash, 무료 + CC0)
- **Pexels**: https://www.pexels.com/ko-kr/
  - "korean kindergarten classroom", "wooden blocks toy", "kimchi small bowl" 등 검색
- **Unsplash**: https://unsplash.com/
- 받은 후 정사각형(사물) / 와이드(배경)로 크롭

### 본인 휴대폰으로 직접 촬영 (가장 따뜻한 느낌)
- 시현이 / 원우 어린이집 점심 / 블록 / 책 — 실제 사진 한 장씩
- 배경 흐리게 + 정사각형 크롭

---

## 업로드 방법

### GitHub 웹 (가장 쉬움)

1. https://github.com/newwonwoo/rabbitchat
2. 브랜치 `claude/prioritize-task-list-OA6E0`
3. `public/assets/` 폴더 진입
4. **"Add file" → "Upload files"** → png 드래그
5. 파일명 정확히 (위 표대로) → Commit

### 로컬

```powershell
copy "C:\생성\*.png" "C:\Users\82108\rabbitchat\public\assets\"
git add public/assets/
git commit -m "Add real-image assets for daily story"
git push
```

---

## 동작 확인

업로드 후:

- **k2 (놀이) 화면**: 배경 = 어린이집 놀이방 일러스트, 선택지 = 블록·공·책 일러스트 (지금은 emoji)
- **k3 (점심) 화면**: 배경 = 점심 테이블, 선택지 = 닭고기·김치·국수 일러스트
- **k5 (친구) 화면**: 배경 = 친구들 놀이, 선택지 = 시현이 사진 + 다른 친구 일러스트

파일이 빠진 슬롯은 자동으로 **emoji fallback** 유지 → 일부만 받아도 점진적 업그레이드.

---

## 한 줄 요약

> emoji는 폴백, 진짜 화면은 **png 일러스트/사진 + CI 캐릭터**.
> 모든 이미지에 같은 공통 스타일 접미사를 붙여 톤 통일.
> 어린이집 스토리 = **배경 5장 + 사물 8장** (시현이는 실 사진 옵션).
