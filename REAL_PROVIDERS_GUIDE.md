# 실제 음성 인식·엄마 목소리 연동 가이드

코드는 **이미 다 깔려 있습니다**. 키 3개만 받으면 mock → real로 즉시 전환.

## 어떤 키가 필요한가

| 키 | 용도 | 발급처 | 비용 |
|---|---|---|---|
| `OPENAI_API_KEY` | **음성 인식 (STT)** + 응답 생성 (LLM) | https://platform.openai.com/api-keys | 사용량당 (Whisper: $0.006/분) |
| `ELEVENLABS_API_KEY` | **엄마 목소리 (TTS voice clone)** | https://elevenlabs.io/app/settings/api-keys | 무료 10k 글자/월, 유료 $5~ |
| `ELEVENLABS_VOICE_ID` | 엄마 음성 클론 ID (아래 절차) | ElevenLabs 대시보드 | 위 무료 티어 포함 |

## 엄마 목소리 클론 만들기 (ElevenLabs)

1. ElevenLabs 가입 → Voices → **"Add Voice" → "Instant Voice Cloning"**
2. **엄마 음성 샘플 1~3분** 업로드 (mp3 / m4a / wav, 잡음 적은 깨끗한 녹음)
   - 추천: 동화책 읽어주는 음성 / 평소 말하는 음성
   - 한 번에 1개 파일도 OK, 여러 개 합치면 더 풍부함
3. 이름 지정 (예: "엄마") → 생성 → 잠시 후 voice ID 발급
4. 우측 점 세 개 → "Copy Voice ID" → 그게 `ELEVENLABS_VOICE_ID`

## 키 셋업 (랩탑 로컬에서 즉시 테스트)

레포 루트에 **`.env.local` 파일 생성** (이미 `.gitignore`에 들어있어 절대 푸시 안 됨):

```
NEXT_PUBLIC_PROVIDER=real
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=xi_...
ELEVENLABS_VOICE_ID=...
```

저장 후 dev 서버 재시작:
```powershell
# Ctrl+C로 기존 서버 종료
.\scripts\start-rabbitchat.bat
```

## 즉시 테스트 (키 없이도 가능)

키 받기 전에도 부모 화면 → **설정 → 마이크 테스트** 카드에서:
- 🎙️ 녹음 시작 → 정지 → 본인 음성 즉시 재생 (마이크 권한 확인용)
- "이 녹음을 텍스트로 변환" → mock 모드면 `(mock-transcript)` 반환, real 모드면 Whisper 결과

키 들어오면 똑같은 버튼이 진짜 인식 결과를 띄웁니다.

## 동작 흐름 (키 들어온 뒤)

1. 아이가 마이크 버튼 누르고 말함 → `useAudioRecorder` 가 webm Blob 캡처
2. `getSTTProvider().transcribe(blob)` → OpenAI Whisper에 한국어로 전송 → 텍스트
3. `getLLMProvider().generateReply(prompt)` → gpt-4o-mini에 깡총이 시스템 프롬프트와 함께 전송 → 응답
4. `sanitizeCharacterVoice(reply)` → "엄마가 ~" 패턴이 있으면 자동 치환 (인계서 §3.3)
5. `getTTSProvider().speak(reply)` → ElevenLabs voice clone(엄마 음성)로 mp3 생성 → Audio 재생

전부 **server-side fetch가 아니라 client-side fetch**라 keys는 NEXT_PUBLIC이 아닌 일반 env로 두면 빌드 시 노출됨.
민감한 production 환경이면 다음 단계로 server route(`app/api/`)를 한 겹 두는 걸 권장 — 그건 키 들어오면 같이 작업.

## 비용 가늠

- Whisper: 30초 발화당 약 $0.003 (한 세션 100번 = $0.30)
- gpt-4o-mini: 100 토큰 응답당 약 $0.0001
- ElevenLabs voice clone: 글자 기준 — 100자 응답 100번 = 10k자 = 무료 티어 안

월 1만번 사용 가정 시 OpenAI ~$30, ElevenLabs $5 정도.

## 보류 항목

- **Supabase 영속 저장** (`lib/storage/turnStore.ts` stub만 있음) — 인증 없이 멀티 디바이스 동기화는 키만으론 부족, 별도 설계 필요
- **server-side proxy** — 위 키들을 클라이언트에 노출하지 않으려면 `app/api/stt/route.ts` 등 추가 (production 가기 직전에)
