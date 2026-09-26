# MOAKIT 5class 홍보영상

- `moakit-5class-promo.mp4` — 1920×1080, 30fps, 약 58초, 배경음악 + 하단 한국어 자막 포함
- 실제 앱 화면(10차시 흐름, 1차시 유물 관찰, 2차시 문장 검증, 교과서 자료실 비교, 사람과 AI의 분류 비교, 낱말 분석·관계도, 우리 모둠 역사관, 교사 자료)을 녹화해 자막과 함께 편집했습니다.
- 화면에 나오는 모둠 기록(학교·모둠 이름, 분류, 해설 등)은 녹화용으로 만든 **가상의 예시 데이터**입니다. 실제 학생 정보는 들어 있지 않습니다.
- `moakit-5class-promo.srt` — 자막 파일 (유튜브 등에 따로 올릴 때 사용)
- `source/` — 다시 만들 때 쓰는 녹화·편집 스크립트 (앱 배포에는 포함되지 않음)

## 다시 만드는 방법 (참고용)

1. 저장소 최상위에서 `npm run dev`로 앱을 켭니다 (localhost:5175).
2. `source/`에서 `node go.mjs look`, `node go.mjs verify`로 클립을, `node go.mjs stills`로 긴 페이지 전체 캡처를 만듭니다. (`seed.mjs`의 가상 모둠 기록을 브라우저에만 넣어 녹화합니다.)
3. 클립을 `frames/<이름>/00001.jpg…`로 풀고, `node render.mjs`로 편집 화면(`compose.html`)을 프레임 단위로 렌더합니다.
4. `python3 music.py`로 배경음악(직접 합성, 저작권 문제 없음)을 만들고 ffmpeg로 영상과 합칩니다.

중간 파일(`clips/`, `frames/`, `stills/`, `out/`, `music.wav`)은 저장소에 올리지 않습니다.
