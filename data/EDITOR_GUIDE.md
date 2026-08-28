# SUBTYPE 노선 workspace 편집 가이드

## Source of truth

```text
data/
├─ lines/<operator>/<line>/
│  ├─ line.json       노선명·색상·코드·심볼 metadata
│  ├─ stations.json   stationId·순서·노선별 역번호
│  ├─ geometry.json   canonical 인접 역쌍 실제 선형
│  ├─ symbol.svg      공식 노선 심볼이 있을 때만
│  └─ README.md
├─ operators/<operator>/
│  ├─ operator.json
│  └─ logo.svg
├─ shared-stations/   ID 기반 canonical station shards
├─ services/
└─ through-services/
```

노선별 `stations.json`에는 역명이나 좌표를 복제하지 않습니다. 역방향 파일도 만들지 않습니다. `stations.json`의 정방향 sequence와 `geometry.json`의 역쌍을 런타임에서 반대로 resolve합니다.

## 파일로 직접 수정

- 노선명·색상: 해당 폴더의 `line.json`
- 역 순서·역번호: 해당 폴더의 `stations.json`
- 실제 선형: 해당 폴더의 `geometry.json`
- 노선 심볼: 해당 폴더의 `symbol.svg`
- 회사 로고: `data/operators/<operator>/logo.svg`
- 역명·좌표: `data/shared-stations/*.json` 또는 Rail Data Editor의 역 row

## 명령

```bash
npm run validate:line -- jr-east/yamanote
npm run build:line -- yamanote
npm run validate:data
npm run build:data
npm run new:line
```

`build:data`는 `data/lines/**/line.json`을 자동 탐색합니다. 중앙 line ID 목록은 사람이 관리하지 않습니다. 새 폴더를 추가해도 core JavaScript 수정은 필요 없습니다.

## Rail Data Editor

`dev/rail-data-editor.html`을 개발 서버에서 엽니다. 왼쪽 운영사 Tree에서 노선을 고르고 현재 노선만 내보냅니다.

```bash
npm run editor:apply -- <내보낸-line-workspace.json>
```

적용기는 세 경로가 동일한 노선 폴더 안에 있는지 확인하고, missing station·missing segment·10% 이상 역 수 감소를 차단합니다. canonical 역명 수정이 있으면 해당 station shard만 함께 갱신합니다. 다른 노선 폴더는 수정하거나 삭제하지 않습니다.

## 파생 파일

`data/generated/`와 `js/line-workspace-data.js`는 build 결과입니다. 사람이 직접 편집하지 않습니다. 이전 build 대비 노선 수가 10% 이상 감소하면 production bundle 교체가 차단됩니다.
