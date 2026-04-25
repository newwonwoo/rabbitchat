# CI 시트 업로드 가이드

코드는 이미 두 시트를 **CSS 스프라이트 방식**으로 받을 준비가 되어 있습니다.
사용자분이 할 일은 **두 파일을 이 폴더에 떨어뜨리는 것** 뿐 — 별도 컷팅·배경 제거 작업 0.

## 업로드할 파일

| 파일 경로 | 출처 | 용도 |
|---|---|---|
| `public/assets/ci/character-sheet.png` | "CHARACTER IDENTITY SHEET" 이미지 (turnaround + EXPRESSIONS & POSES + LOGO 포함된 CI 시트) | 깡총이 6 표정 |
| `public/assets/ci/food-sheet.png` | "깡총이 푸드 액션 가이드" 이미지 (과일 먹기 / 식사 / 음료 마시기 / 표정 포함) | 음식 선택 시 한입→씹기→삼키기→맛있어 시퀀스 |

## 업로드 방법 — 둘 중 편한 거

### 방법 A — GitHub 웹에서 드래그앤드롭 (가장 쉬움)

1. https://github.com/newwonwoo/rabbitchat 접속
2. `claude/prioritize-task-list-OA6E0` 브랜치 선택
3. `public/assets/ci/` 폴더 진입
4. **"Add file" → "Upload files"** 버튼
5. 두 파일을 드래그앤드롭 (파일명을 위 표대로 정확히)
6. "Commit changes" 클릭

5분 안에 끝. 별도 도구 필요 없음.

### 방법 B — 로컬에서 직접

```powershell
# Windows PowerShell
copy "C:\Downloads\character-sheet.png" "C:\Users\82108\rabbitchat\public\assets\ci\"
copy "C:\Downloads\food-sheet.png" "C:\Users\82108\rabbitchat\public\assets\ci\"
cd C:\Users\82108\rabbitchat
git add public/assets/ci/
git commit -m "Add CI sheets for sprite rendering"
git push
```

## 업로드 후 확인

브라우저로 `http://localhost:3000` 새로고침 → 깡총이가 CSS 실루엣 → **실제 CI 사진**으로 즉시 교체됩니다.

음식 선택 시(🍌/🍎/🍓) 한입→씹기→삼키기→맛있어 4단계 사진 시퀀스가 재생됩니다.

## 좌표가 안 맞으면

CSS 스프라이트는 시트 안의 픽셀 좌표를 알아야 정확히 잘립니다. 만약 업로드 후 캐릭터가 이상한 부분에서 잘리거나 다른 표정이 나오면, `lib/ciSheet.ts`의 `frames` 좌표를 그 시트의 실제 픽셀에 맞춰 조정해야 합니다.

알려주시면 제가 시트 보고 좌표 다시 잡습니다 — 시트 한 장당 5분.

## 시트 권장 사이즈

| 권장 | 비고 |
|---|---|
| **1448 × 1086** (현재 코드 기준) | 이 사이즈로 업로드하면 좌표 100% 일치 |
| 다른 사이즈도 OK | 비율만 비슷하면 약간만 어긋남, 그러면 좌표 재조정 |
| PNG | JPG도 OK. 투명 배경 불필요 (시트 자체가 배경 있음) |
| ~1.5MB | 첫 로드만 느림, 캐시됨 |

## 시트 외 배경 이미지는 추후 별도

마트/공원 장면 배경 (`bg_*.png`)은 이번 단계에서는 안 받습니다.
시트 두 장만 들어와도 깡총이 + 음식 액션 비주얼이 통째로 살아납니다.
