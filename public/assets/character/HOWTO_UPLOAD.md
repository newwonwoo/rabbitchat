# 깡총이 캐릭터 컷 업로드 — 자유 이름 OK

여기에 PNG/JPG/WEBP를 떨어뜨리면 코드가 **파일명을 fuzzy 매칭**해서 알아서 씁니다.
파일명을 정확히 맞출 필요 없음.

## 어떤 이름이 먹히나

코드는 mood 키워드 + 한글/영어 동의어로 검색합니다. 다음 중 아무 거나:

| Mood | 매칭되는 파일명 예시 (모두 OK, 대소문자 무관) |
|---|---|
| `happy` | `happy.png`, `kkang_happy.png`, `행복.png`, `웃는얼굴.png`, `kkangchong_smile_v2.png`, `joy.png` |
| `listening` | `listening.png`, `idle.png`, `기본.png`, `default.png`, `듣기.png`, `kkang_listen.PNG` |
| `waving` | `waving.png`, `wave.png`, `인사.png`, `손인사.png`, `hi_kkang.png`, `반가워.png` |
| `thinking` | `thinking.png`, `생각.png`, `궁금.png`, `wonder.png`, `의문.png` |
| `jumping` | `jumping.png`, `jump.png`, `점프.png`, `신난.png`, `kkang_jump_a.png` |
| `sleepy` | `sleepy.png`, `sleep.png`, `졸림.png`, `잠.png`, `drowsy.png` |

**규칙**: 파일명 안에 위 키워드 중 하나가 들어 있으면 매칭. 첫 매칭 파일이 사용됨.

## 권장 사양

| 항목 | 값 |
|---|---|
| 형식 | PNG (투명 배경) 권장. JPG / WEBP도 OK |
| 크기 | 정사각형 권장. 한 변 512~1024px |
| 캐릭터 위치 | 정중앙. 위/아래 약간 여백 |

투명 배경 안 만드셔도 동작은 합니다. 다만 투명이면 어떤 배경에서도 자연스러움.

## 업로드 방법

### 로컬에서 PowerShell로 (가장 빠름)

```powershell
cd C:\Users\82108\rabbitchat
git pull
copy "C:\잘라둔폴더\*.png" "public\assets\character\"
git add public/assets/character/
git commit -m "Add character poses"
git push
```

이름 100장이어도 한 번에 처리.

### 또는 GitHub 웹

1. https://github.com/newwonwoo/rabbitchat → 브랜치 `claude/prioritize-task-list-OA6E0`
2. `public/assets/character/` 폴더 진입
3. **Add file → Upload files** → 드래그앤드롭
4. Commit

## 동작 확인

업로드 후:
```powershell
git pull
.\scripts\start-rabbitchat.bat
```

→ dev 서버 재시작 → 새로고침. 깡총이가 mood별로 매칭된 사진으로 자동 교체.

## 매칭이 안 되면

브라우저 주소창에서 직접 확인:
- https://localhost:3000/api/character-pose?mood=happy
- 응답에 `url: "/assets/character/..."` 가 떠야 함
- `url: null` 이면 매칭 실패 → 파일명에 위 키워드 중 하나 포함시키기

여러 파일이 같은 키워드를 포함할 때는 **알파벳 순으로 첫 번째**가 선택됩니다. 특정 컷을 우선시키려면 파일명에 `0_` `1_` 같은 prefix:

```
0_kkang_happy.png   ← 우선 사용
2_kkang_happy_alt.png
```

## 푸드 액션 등 추가 컷

표정 6개 외 푸드 액션 (apple_bite, banana_chew 등)도 같이 올려두면 좋음. 현재 코드에서는 아직 매핑 안 했지만, 어떤 이름들 올리셨는지 알려주시면 매핑 추가합니다.

예시 폴더 정리:
```
public/assets/character/
  kkang_happy.png
  kkang_listening.png
  kkang_waving.png
  kkang_thinking.png
  kkang_jumping.png
  kkang_sleepy.png
  kkang_apple_hold.png      ← 향후 매핑
  kkang_apple_bite.png
  kkang_banana_hold.png
  ...
```
