# SUBTYPE 계정 및 랭킹 활성화

현재 사이트의 로그인·회원가입은 Supabase Auth를 사용합니다. 공개 배포에 프로젝트 URL과 **publishable/anon key**만 사용하며 **service_role 비밀 키는 절대 커밋하지 마세요.**

1. Supabase에서 프로젝트를 생성하고 Authentication > Providers의 Email을 활성화합니다.
2. 프로젝트 SQL Editor에서 [ranking.sql](./ranking.sql)을 실행합니다.
3. 기존 사용자 프로필 이전 기능까지 이용하려면 auth.js에 명시된 player_profiles 테이블도 별도로 정의해야 합니다. 랭킹 사용 자체에는 필요하지 않습니다.
4. `js/auth-config.js` 맨 위의 `window.TRT_SUPABASE_CONFIG`에 프로젝트 URL과 공개 anon/publishable 키를 설정합니다.
5. Authentication > URL Configuration에 실제 GitHub Pages 주소 `https://s3h0726.github.io/SUBTYPE/`를 허용합니다.
6. 회원가입·이메일 인증·로그인·점수 등록·다른 브라우저에서 랭킹 조회를 실제 계정으로 확인합니다.

주의: 현재는 클라이언트가 제출한 점수를 서버가 검증하지 않습니다. 정식 경쟁 랭킹에는 서버에서 점수 검증, 중복 제출 방지, 사용자 제한 등을 추가해야 합니다.
