# SUBTYPE Supabase 연동 (이메일 계정 + 클라우드 기록 + 랭킹)

## 필수 설정

1. [Supabase Dashboard](https://supabase.com/dashboard)에서 프로젝트 생성 → Authentication > Providers > Email 활성화.
2. SQL Editor에서 [ranking.sql](ranking.sql) **전체를 한 번 실행**. 기존 랭킹 테이블에 필요한 컬럼을 추가하되 점수를 삭제하지 않습니다. 신규 공개 프로필/비공개 클라우드 프로필 및 RLS 정책 생성.
3. Project Settings > API에서 **Project URL**과 **publishable key 또는 legacy anon key**만 복사.
4. `js/auth-config.js`의 맨 첫 줄에 다음 형식으로 입력하고 커밋/배포:
   ```js
   window.TRT_SUPABASE_CONFIG={
     url:'https://YOUR-PROJECT.supabase.co',
     anonKey:'YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY'
   };
   ```
   ⚠️ `service_role`, `sb_secret_` 키, DB 비밀번호 및 사용자 비밀번호는 **절대 저장소나 브라우저 JS에 입력하지 마세요.**
5. Authentication > URL Configuration의 **Site URL**을 `https://s3h0726.github.io/SUBTYPE/`로 설정하고 해당 주소를 Redirect URLs에 추가. 이메일 인증 및 비밀번호 재설정 메일이 이 주소로 오도록 확인.
6. 메일 인증을 요구하면 확인 메일을 받은 뒤 링크로 접속. 비밀번호 재설정은 로그인 모달의 '비밀번호 찾기'에서 진행.
7. PC와 모바일에서 각각 신규 회원가입·로그인, 닉네임 변경, 비밀번호 초기화, 로그아웃, 기록 복원, 일반 노선 완주 후 랭킹 등록·조회 확인.

## 데이터 범위

- 비로그인 게스트 플레이와 브라우저 로컬 기록은 유지됩니다.
- 회원별 로컬 기록은 계정별 분리되고, `player_profiles`에 회원별 기록/커스텀 노선이 동기화됩니다.
- **게스트 기록 가져오기**는 회원이 직접 선택합니다. 타인의 공유 브라우저 기록이 자동으로 개인 계정에 병합되지 않습니다.
- 랭킹에는 일반 정식 노선 완주 중 최소 2역, 기초값 검증 통과 기록만 제출합니다. 연구용·CUSTOM·자유주행 기록은 공개 랭킹에서 제외됩니다.
- 랭킹은 노선·국가별 필터, 사용자별/노선별 최고 기록, 타수·정확도·소요시간을 제공합니다.

## 운영 및 보안 주의

랭킹 점수는 **브라우저가 제출한 미검증 정보**입니다. RLS/입력 범위/중복 UUID 검사는 다른 사용자의 기록을 수정하거나 중복 업로드하는 것을 막지만, 개발자 도구로 허위 점수를 제출하는 것까지 막지는 못합니다. 상금·대회 등 공정성이 중요한 순위 서비스에는 서버 권한 게임 검증/회차 서명/재현 가능한 입력 이벤트 검증을 별도로 구현해야 합니다.

Supabase 무료 플랜의 메일 전송 제한과 자체 SMTP 필요 여부도 확인하세요. 데이터 삭제 정책·닉네임 운영 원칙은 서비스 배포 전에 정해야 합니다.

## 2026-10-28: 운행계통별 랭킹 업데이트

이전에 SQL을 실행한 프로젝트도 [ranking.sql](ranking.sql) 전체를 SQL Editor에서 **다시 실행**해야 합니다. 이 스크립트는 기존 기록을 삭제하지 않고 `service_key`·`service_name`을 추가하며, 기존 기록은 `legacy`(계통 미분류)로 표시합니다. 새 운행은 운행계통/출발역/종착역/방향별로 각각 독립적인 개인 최고 기록을 유지합니다. 파일 재실행 후 SUBTYPE의 '랭킹 → 노선 → 운행계통' 필터를 사용하세요.
