# 대한민국 교통 데이터 편집 안내

대한민국 교통 데이터의 원본은 `data/kr`입니다. `data/kr/generated`와 `js/korea-index-data.js`는 직접 편집하지 않습니다.

## 편집 위치

- 운영기관: `data/kr/operators/<operator-id>/operator.json`
- 공통 역·정류장·선착장: `data/kr/stops/<mode>/stops.json`
- 노선: `data/kr/routes/<mode>/<route-id>/route.json`
- 방향별 정차 순서: `<route>/directions/<direction-id>/direction.json`

버스 왕편과 복편은 실제 정차 순서를 각각 저장합니다. 한 방향 배열을 뒤집어 다른 방향을 생성하지 않습니다. 실제 geometry가 없으면 `geometryStatus`를 `missing`으로 유지하며 역·정류장 좌표를 직선으로 잇지 않습니다.

## 빌드와 검증

```text
npm run build:korea
npm run validate:korea
npm run build
```

한국 인덱스는 가볍게 먼저 로드되고, 노선 상세 데이터는 사용자가 해당 노선을 선택할 때만 로드됩니다.
