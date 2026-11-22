# SUBTYPE 통합 데이터 편집기

공식 진입점: https://s3h0726.github.io/SUBTYPE/editor/

- **노선·선로 편집** (`/editor/?tool=rail`): 노선 기본정보, 역 순서, 지도/Geometry, 로고, 역명판, 무결성 검증. 변경사항은 JSON으로 내보낸 뒤 로컬에서 반영합니다.
- **한글명·RGB·라벨 편집** (`/editor/?tool=names`): 국가별 운영사·노선·운행계통·역명, 노선 RGB, 노선 카드 라벨·라벨 RGB. CSV 내보내기 및 사용자가 제공한 GitHub fine-grained PAT로 `data/editor-overrides.json`에 직접 저장할 수 있습니다.

기존 북마크 `/reports/korean-names/editor.html`은 통합 편집기의 한글명 탭으로 이동합니다. 국가(`country`) 및 작업 브랜치(`branch`) 쿼리는 유지되며, 한글명 편집 표는 `embedded=1`일 때 통합 페이지 안에 표시됩니다.

GitHub Pages는 정적 호스팅이므로 **노선·선로 편집 JSON은 직접 저장되지 않습니다.** 브라우저에서 JSON을 내보낸 다음:

1. 로컬 프로젝트에서 `npm run editor:apply -- <내보낸 JSON 경로>`를 실행합니다.
2. `npm run build:data` 및 관련 검증을 수행합니다.
3. 변경 파일을 GitHub에 커밋하고 푸시합니다.

반면 한글명·RGB·라벨 편집은 별도 API 저장 흐름을 사용합니다. 두 편집기의 초안과 저장 방식은 분리되므로 한쪽에서 저장했다고 다른 쪽의 미저장 편집 내용이 적용되지는 않습니다. 토큰은 브라우저 저장소에 보관하지 않습니다.
