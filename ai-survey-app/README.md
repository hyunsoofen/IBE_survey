# AI 프런티어 원정 — 모바일 원정형 설문 웹앱

KAIST AIC 50기 IBE 2반 1팀 발표 「지능은 빌리고, 노하우는 쌓는다」(덱 v14)와 연계한 설문(6개 파트 35문항, 주관식 2 포함)을 휴대폰에서 원정처럼 풀 수 있게 만든 웹앱입니다.

- 6개 구역(베이스캠프 → 성과의 분수령 → 시간의 강 → 깃발 꽂을 땅 → 탐사 일지 → 정착지 설계)
- 한 화면에 한 문항, 탭하면 자동으로 다음 문항으로 넘어감, XP·스테이지 클리어·배지
- A6에서 "사용하지 않음"을 고르면 B·C 스테이지를 자동으로 건너뜀
- 중간에 나가도 같은 기기에서 이어하기 가능, 끝나면 "나의 AI 워커 유형" 결과 카드와 공유 버튼
- `/admin` 관리자 대시보드: 문항별 분포, 동의율(4~5점), 직무·직급·사용빈도 필터, 주관식 모아보기, CSV 다운로드(엑셀 호환)

## 인터랙티브 스토리 (v3)

응답에 따라 이야기와 진행 순서가 바뀝니다. 원 설문 문항의 문구와 선택지는 그대로 두고, 이야기 층만 달라집니다. 설정은 모두 `public/story.js`에 있습니다.

| 요소 | 동작 |
| --- | --- |
| 길잡이 '노바' 반응 | 답을 고르면 다음 화면에서 그 답에 맞춘 한마디를 합니다. 앞 응답과 엮인 반응도 있습니다 (예: B1 높고 B4 낮으면 "숫자의 역설 포착!") |
| 갈림길 → 3개 루트 | 🔭 정찰대 루트 (A6 '사용하지 않음': A→D→E→F) · 🌀 역류 탐사로 (업무량 증가 또는 역설 신호 2개 이상: A→B→C→E→D→F) · ⚡ 급행 개척로 (그 외: A→B→C→D→E→F). 루트가 정해지는 순간 갈림길 화면이 이유와 남은 경로를 보여 줍니다 |
| 개인화 내레이션 | 스테이지 입장 화면의 대사가 앞 응답을 인용합니다 (예: "매주 3~5시간을 되찾으셨네요. 그 시간은 어디로?") |
| 숨은 지류(히든 문항) X1~X5 | 특정 응답에서만 열리는 1문항짜리 심층 질문 (보너스 XP). **원 설문에 없는 문항이므로 팀 검토가 필요합니다.** 끄려면 `ENABLE_HIDDEN = false` |
| 건너뛰기 규칙 | B2 '없음'이면 C1(아낀 시간의 용도)을, AI 비사용자에게는 E7(결과 환류)을 묻지 않음. 원치 않으면 `SKIP_RULES`에서 삭제 |
| 결과 화면 | 개척자 패스: 유형 + 루트 + 원정 기록(응답 기반 요약) (응답 기반 3~6줄) |

히든 퀘스트 조건: X1 비사용 이유(A6 사용하지 않음) · X2 역설의 원인(B1≥4·B4≤2) · X3 늘어난 일(C6 늘었다) · X4 템플릿 공유 범위(E6 예) · X5 보상 시 기록 가능 시간(F1≥4·F2≤2)

> 분석 시 주의: D·E 순서가 루트마다 다르므로, 순서 효과가 걱정되면 루트별로 D3·E 결과를 나눠 확인하세요. 관리자 화면 상단에 루트 분포가 나오고, CSV에 `route` 열이 들어갑니다.

빌드 과정이 없는 정적 사이트입니다. `public/` 폴더가 그대로 배포됩니다.

## 폴더 구조

```
public/
  index.html, style.css, app.js   설문 게임 화면
  questions.js                    원 설문 35문항·결과 유형
  story.js                        길잡이 반응·루트·숨은 지류(히든 문항)·내레이션
  icons.js                        구역·루트 선형 아이콘
  db.js                           저장소 (Firestore / 데모 모드)
  firebase-config.js              Firebase 웹 앱 설정값 ← 채워 넣기
  admin.html, admin.js            관리자 대시보드
firestore.rules                   보안 규칙 (제출만 허용, 조회는 관리자만)
firebase.json / .firebaserc       Firebase Hosting 설정
vercel.json                       Vercel 설정
```

## 1. Firebase 준비 (응답 저장소 — 두 배포 방식 공통)

1. https://console.firebase.google.com 에서 프로젝트 생성
2. **Firestore Database** 만들기 → 위치 `asia-northeast3 (서울)` 권장 → 프로덕션 모드
3. **Authentication → 로그인 방법 → Google** 사용 설정 (관리자 로그인용)
4. **프로젝트 설정 → 내 앱 → 웹 앱 추가(</>)** → 표시되는 `firebaseConfig` 값을 `public/firebase-config.js`에 붙여넣기
5. `firestore.rules`의 `admin@example.com`을 결과를 볼 사람의 Google 이메일로 변경 (여러 명이면 `['a@x.com', 'b@y.com']`)
6. `.firebaserc`의 `YOUR-FIREBASE-PROJECT-ID`를 실제 프로젝트 ID로 변경

> `firebase-config.js`의 apiKey는 공개돼도 되는 값입니다. 데이터 보호는 `firestore.rules`가 담당합니다.
> 설정을 비워 두면 **데모 모드**로 동작하며, 응답은 그 브라우저에만 저장됩니다.

## 2-A. Firebase Hosting으로 배포

```bash
npm install -g firebase-tools
firebase login
firebase deploy            # Hosting + Firestore 규칙을 한 번에 배포
```

배포 주소: `https://<프로젝트ID>.web.app` (설문), `https://<프로젝트ID>.web.app/admin` (대시보드)

## 2-B. Vercel로 배포

1. 이 폴더를 GitHub 저장소에 올린 뒤 https://vercel.com/new 에서 Import → Framework `Other` → 그대로 Deploy
   (또는 `npm i -g vercel && vercel --prod`)
2. 보안 규칙은 Firebase에 따로 올려야 합니다: `firebase deploy --only firestore:rules`
   (또는 Firebase 콘솔 → Firestore → 규칙 탭에 `firestore.rules` 내용을 붙여넣고 게시)
3. Firebase 콘솔 → Authentication → 설정 → **승인된 도메인**에 `xxx.vercel.app` 추가 (관리자 로그인용)

## 운영 팁

- **배포 전 파일럿**: 데모 모드(설정 비운 상태)로 `npx serve public` 실행 후 휴대폰으로 열어 소요 시간을 확인하세요.
- **문항 수정**: `public/questions.js`만 고치면 됩니다. 응답을 받기 시작한 뒤 문항을 바꾸면 `SURVEY.version`도 올려 두세요(응답에 버전이 함께 저장됨).
- **배포 링크 공유**: 카카오톡 등에 링크를 붙이면 제목·설명이 미리보기로 표시됩니다.
- **중복 응답**: 같은 기기에서는 제출 후 결과 화면만 다시 보입니다. 기기를 바꾸면 다시 응답할 수 있으니, 엄격한 중복 방지가 필요하면 알려 주세요.
- **결과 유형**은 참여 보상용 재미 요소이며 분석에는 쓰지 않습니다. 분석은 대시보드의 CSV로 하세요.
