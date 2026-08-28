# GitHub Pages Rail Data Editor

프로젝트 전체를 GitHub Pages에 배포하면 다음 주소에서 에디터를 열 수 있습니다.

```text
https://<사용자명>.github.io/<저장소명>/editor/
```

SUBTYPE 저장소 기준 예상 주소는 `https://s3h0726.github.io/SUBTYPE/editor/`입니다.

GitHub Pages는 정적 호스팅이므로 브라우저에서 저장소의 JSON 파일을 직접 덮어쓸 수 없습니다.

1. 에디터에서 노선을 수정합니다.
2. `현재 노선 내보내기`를 눌러 JSON을 내려받습니다.
3. 로컬 프로젝트에서 `npm run editor:apply -- <내보낸 JSON 경로>`를 실행합니다.
4. `npm run build:data`와 검증 명령을 실행합니다.
5. 변경 파일을 GitHub에 커밋하고 푸시합니다.

에디터 페이지는 canonical 데이터에서 생성된 `../js/line-workspace-data.js`를 사용합니다.
