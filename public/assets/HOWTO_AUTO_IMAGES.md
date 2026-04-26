# 자동 이미지 검색 셋업 (Pexels)

부모가 일일이 이미지를 받아오지 않아도, 시스템이 **선택지·배경 이름**으로 Pexels에서 라이센스 안전한 이미지를 자동으로 받아 캐시합니다.

## 동작 흐름

```
선택지 / 배경 렌더링
  ↓
1) 로컬 PNG (public/assets/*.png) 있나?  → 있으면 그거 사용
  ↓ 없거나 404
2) /api/image-search 호출 (Pexels 프록시)
   → 첫 결과 URL을 IndexedDB에 캐시
   → <img src="..."> 로 렌더
  ↓ 결과 없음 / 키 없음
3) emoji fallback
```

## Pexels API 키 발급 (3분, 무료)

1. https://www.pexels.com/api/new/ 접속 → 가입 (이메일 또는 Google)
2. "Your API Key" 자동 표시 → 복사
3. 무료 한도: **시간당 200회, 월 2만회** — 캐시되니 평생 안 모자람
4. 카드 등록 X, 자동 결제 X

## 셋업

`.env.local`에 한 줄 추가:

```
PEXELS_API_KEY=여기에_복사한_키
```

dev 서버 재시작:
```powershell
.\scripts\start-rabbitchat.bat
```

## 우선순위

코드는 `로컬 PNG` 가 있으면 우선 그걸 씁니다. Pexels 검색은 **로컬에 없을 때만** 호출:
- `public/assets/obj_blocks.png` 있음 → 그거 사용
- 없음 → "블록 놀이" 키워드로 Pexels 검색 → 결과 캐시 → 사용
- 검색도 결과 없음 → emoji 🧱

따라서:
- 마음에 드는 이미지는 직접 받아 `public/assets/`에 두면 우선 적용
- 안 받은 슬롯은 자동으로 채워짐

## 검색어 매핑

`lib/imageSearcher.ts`의 `QUERY_HINTS` 사전이 한국어 라벨을 영어 검색어로 자동 변환 (Pexels는 영어가 정확):

| 한국어 라벨 | Pexels 검색어 |
|---|---|
| 블록 놀이 | wooden toy blocks kids |
| 닭고기 | kids chicken meal |
| 김치 | korean kimchi small bowl |
| 어린이집 | kindergarten classroom korean |
| ... | (총 30개 매핑) |

매핑에 없는 라벨은 한국어 그대로 검색.

## 캐시 확인

부모 화면 → 설정 → **응답 캐시** 카드에 이미지 캐시 항목 카운트가 함께 표시됩니다 (앞으로 추가 예정 — 일단 IndexedDB의 `img` 스토어에 저장).

## 라이센스

Pexels 이미지는 **상업·비상업 모두 무료**, 출처 표기 의무 없음 (https://www.pexels.com/license/).

이 채널 외 다른 검색은 코드에 들어가지 않습니다 (구글/빙 이미지 검색은 라이센스 불명확 + 안전성 이슈로 차단됨, 하네스 §14).

## 한 줄 요약

> Pexels 키 한 줄 넣으면 PNG 없는 슬롯이 자동 채워짐.
> 마음에 드는 건 직접 PNG로 덮어씀.
