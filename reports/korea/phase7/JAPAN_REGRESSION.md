# 일본 회귀

- validate:service-patterns: PASS (reports/korea/phase7/final-validate-service-patterns.log)
- test:shonan: PASS (reports/korea/phase7/final-test-shonan.log)
- test:ueno: PASS (reports/korea/phase7/final-test-ueno.log)
- japan: PASS (reports/korea/phase7/final-japan.log)
- shinkansen: PASS (reports/korea/phase7/final-shinkansen.log)
- limitedExpress: PASS (reports/korea/phase7/final-limitedExpress.log)

일본 원본 through-services.json, tokyo-service-patterns.json, 선로 JSON은 변경하지 않았다. 공통 resolver의 미등록 방향 차단 및 출처 validator/test만 수정했다. 7개 우에노 방향과 12개 쇼난 방향 유지. 아타미→타카사키 역방향은 미등록 상태이며 복구되지 않았다. 홍콩 브랜치를 체크아웃하거나 병합하지 않았으며 해당 브랜치 전용 런타임은 NOT_TESTED.
