# SUBTYPE 철도 데이터 편집 가이드

사람이 수정하는 원본은 `data/` 아래 canonical 파일뿐입니다. `data/generated/`와 `js/*-data.js`, `js/app.bundle.js`는 빌드 결과이므로 직접 편집하지 않습니다.

## 운영사

- 이름: `data/operators/<operator-id>/operator.json`의 `names`
- 로고: 같은 폴더의 `logo.svg` (대안은 `logo.png`, `logo.webp`)

## 노선

- 이름·색상·코드: `data/lines/<operator-id>/<line-folder>/line.json`
- 역 순서·역번호: 같은 폴더의 `stations.json`
- 실제 선형: 같은 폴더의 `geometry.json`
- 심볼: 같은 폴더의 `symbol.svg` (대안은 `symbol.png`, `symbol.webp`)

`stations.json`에는 `stationId`, `order`, `stationCode` 같은 관계 정보만 저장합니다. 역 이름은 복사하지 않습니다.

## 역

역 이름과 좌표는 `data/shared-stations/*.json`의 해당 canonical station 한 곳에서 수정합니다. `stationId`는 변경하지 않습니다.

## 반영

```bash
npm run validate:data
npm run build:data
npm run test:single-source
```

빌드는 운영사·노선 폴더를 자동 탐색하고 `data/generated/asset-registry.json`을 생성합니다. 로고와 심볼 URL에는 파일 내용 해시가 붙으므로 같은 파일명을 교체해도 다음 배포에서 캐시가 갱신됩니다. GitHub Pages의 `/SUBTYPE/` 같은 하위 경로는 런타임의 `document.baseURI`를 기준으로 처리합니다.

로고나 심볼이 없으면 UI에서 숨기며 가짜 placeholder를 만들지 않습니다. 자산 부족은 노선 플레이 가능 여부에 영향을 주지 않습니다.
