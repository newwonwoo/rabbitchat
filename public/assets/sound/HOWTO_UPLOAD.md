# 사운드 효과 파일 가이드

코드는 7개 사운드 ID를 호출합니다. 파일 7개를 이 폴더에 넣으면 즉시 재생됩니다.
파일이 없으면 자동으로 무음 처리 (앱은 정상 동작).

## 필요한 파일

| 파일명 | 호출 시점 | 길이 권장 |
|---|---|---|
| `tap_pop.mp3` | 임의 탭 (현재 미사용 — 향후 확장) | 0.1~0.2초 |
| `choice_chime.mp3` | 선택지 클릭해서 다음 장면으로 | 0.3~0.5초 |
| `voice_coo.mp3` | 깡총이 클릭 — 의성어 1 ("코오~") | 0.5~1초 |
| `voice_ya.mp3` | 깡총이 클릭 — 의성어 2 ("와아!") | 0.5~1초 |
| `voice_um.mp3` | 깡총이 클릭 — 의성어 3 ("음~?") | 0.5~1초 |
| `scene_end.mp3` | 이야기 마지막 장면 도달 | 1~2초 |
| `parent_unlock.mp3` | 🔒 3초 long press 성공 | 0.3~0.5초 |

`voice_*` 3개는 깡총이 클릭할 때마다 무작위로 하나가 재생됩니다 — 기계적으로 안 들리게.

## 받아오는 곳 (전부 무료, 상업 사용 가능)

| 사이트 | 비고 |
|---|---|
| https://mixkit.co/free-sound-effects/ | "kids", "pop", "chime" 검색. 회원가입 불필요 |
| https://pixabay.com/sound-effects/ | "baby", "bunny", "soft chime" 검색. 무료 + CC0 |
| https://freesound.org/ | 가입 필요. "cute", "meow", "coo" 등 |

권장 검색어:
- choice_chime: `"soft chime"`, `"toy bell"`
- voice_coo / voice_ya / voice_um: `"baby giggle"`, `"cute squeak"`, `"plush voice"`
- scene_end: `"success chime"`, `"magic sparkle"`
- parent_unlock: `"unlock soft"`, `"toy click"`

## 업로드 방법

GitHub 웹 → `public/assets/sound/` 진입 → "Add file" → "Upload files" → 7개 mp3 드래그 → Commit.

또는:
```powershell
copy "C:\Downloads\*.mp3" "C:\Users\82108\rabbitchat\public\assets\sound\"
git add public/assets/sound/
git commit -m "Add sound effects"
git push
```

## 용량 가이드

- mp3 하나당 100KB 미만 권장 (총 700KB 미만)
- 너무 길거나 큰 파일은 첫 로드가 느려짐
- 모든 사운드는 SoundEngine이 사전 로드 (preload="auto")
