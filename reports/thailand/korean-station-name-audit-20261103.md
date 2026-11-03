# 태국 역명 통합 검수 기록 (2026-11-03)

- 대상: `data/th/generated/names.json` 역명 758개. 이는 전수 **데이터 검사**이지 전수 **공식 명칭 검증**이 아닙니다.
- 검토 기준: 태국어 원명 보존, 기존 한국어 통용명 존중, 노선별 동일 역명 일관성, 국립국어원 외래어 표기법.
- 규범 참고: https://korean.go.kr/kornorms/regln/reglnView.do
#
## 기계 검사 결과

- 태국어 동일 원명 중복 그룹: 26
- 동일 태국어 원명에 서로 다른 한글명이 남은 그룹: 0
- 별도 검토 후보(초성 음역 패턴·분기/국경 등): 18

## 아직 개별 원어 대조가 필요한 후보

| ID | 기존 검토 대상 한국어 | 태국어 | 영어 |
|---|---|---|---|
| th-srt-1007 | 방쓰 분기 | ชุมทางบางซื่อ | Bang Sue Junction |
| th-srt-1036 | 반파치 분기 | ชุมทางบ้านภาชี | Ban Phachi Junction |
| th-srt-1137 | 반다라 분기 | ชุมทางบ้านดารา | Ban Dara Junction |
| th-srt-2115 | 타논찌라 분기 | ชุมทางถนนจิระ | Thanon Chira Junction |
| th-srt-2233 | 반쌀랭판 | บ้านแสลงพัน | Ban Salaeng Phan |
| th-srt-2011 | 깽코이 분기 | ชุมทางแก่งคอย | Kaeng Khoi Junction |
| th-srt-2136 | 부아야이 분기 | ชุมทางบัวใหญ่ | Bua Yai Junction |
| th-srt-2024 | 콕쌀룽 | โคกสลุง | Khok Salung |
| th-srt-4347 | 핫야이 분기 | ชุมทางหาดใหญ่ | Hat Yai Junction |
| th-srt-4400 | 따쎄 | ตาเซะ | Tase |
| th-srt-4412 | 반쌀로 부낏여래 | บ้านสะโลว์บูกิ๊ตยือแร | Ban Salo Bukit Yuaerae |
| th-srt-4270 | 퉁송 분기 | ชุมทางทุ่งสง | Thung Song Junction |
| th-srt-4300 | 카오춤텅 분기 | ชุมทางเขาชุมทอง | Khao Chum Thong Junction |
| th-srt-4229 | 반퉁포 분기 | ชุมทางบ้านทุ่งโพธิ์ | Ban Thung Pho Junction |
| th-srt-4020 | 농쁠라둑 분기 | ชุมทางหนองปลาดุก | Nong Pla Duk Junction |
| th-srt-4072 | 사판탐끄라쎄 | สะพานถ้ำกระแซ | Saphan Tam Krasae |
| th-srt-3023 | 차층사오 분기 | ชุมทางฉะเชิงเทรา | Chachoengsao Junction |
| th-srt-3057 | 클롱십까오 분기 | ชุมทางคลองสิบเก้า | Khlong Sip Kao Junction |

## 후속 검증

1. 태국 국철 역별 한국어 표기를 국립국어원 자모 대응표와 현지 역명판, 지도 표기 근거에 따라 개별 확인할 것.
2. `data/th/generated/routes/*.json`는 gzip 페이로드를 포함하므로 소스 수정 후 `node tools/build-thailand.cjs`로 전체 재생성해야 게임 주행 반영을 주장할 수 있음.
3. 검증되지 않은 역명에 `koVerified: true`를 임의로 지정하지 말 것.
4. 노선명/역명 편집표에서 저장한 변경이 `data/th/korean-overrides.json`에 도달하는지 확인할 것.
