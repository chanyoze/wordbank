---
title: "상시·수시위험성평가서 리포트(클립리포트) 핸드오프"
sidebar_label: "리포트 SoT"
sidebar_position: 1
date: 2026-09-02
kind: 갱신
raw: "RAW-DOC:cip-defg-saas/OTAT/RPT/README.md"
---

# 상시·수시위험성평가서 리포트(클립리포트) 핸드오프

> 대상 화면: `SfasRegAtRiskasmtRcpt` (상시·수시위험성평가서접수)
> 이 폴더의 `.crf` 는 **리포트 서버 배포본의 사본**이다. 애플리케이션 빌드에는 포함되지 않는다.

## 1. 파일 ↔ DB 등록 ↔ 리포트유형

리포트 실물은 `TCC_RRPT_FILE_BAS` 에 등록되어 있고, 화면은 **파일명이 아니라 `RRPT_ID` + `DVS_CD`** 로 고른다.

| 파일 | RRPT_ID | DVS_CD | 리포트명 | 배포 경로 |
|---|---|---|---|---|
| `WSfAssesmentReciveRegister.crf` | 31 | **A** | 상시/수시위험성평가서 | `/sfas/WSfAssesmentReciveRegister.crf` |
| `WSfAssesmentReciveRegisterTypeB.crf` | 31 | **B** | 〃 | `/sfas/WSfAssesmentReciveRegisterTypeB.crf` |
| `WSfAssesmentReciveRegisterTypeC.crf` | 31 | **C** | 〃 | `/sfas/WSfAssesmentReciveRegisterTypeC.crf` |
| `WSfAssesmentReciveRegisterTypeD.crf` | 31 | **D** | 〃 | `/sfas/WSfAssesmentReciveRegisterTypeD.crf` |

### 1-1. 🔴 회사별 오버라이드 — 파일 선택은 2계층이다 (2026-09-02 추가)

`TCC_RRPT_FILE_BAS`(기본) 위에 **`TCC_RRPT_FILE_CPN`(회사별)** 이 있고, **해당 회사 행이 있으면 기본본을 통째로 덮는다.**
근거: [CommonPrcsSql.xml `selectReportList`](../../../src/main/resources/sqlmap/mappers/common/CommonPrcsSql.xml) — `TCC_RRPT_FILE_BAS` 쪽 Union 절이 `Not Exists (Select 1 From TCC_RRPT_FILE_CPN Where RRPT_ID = … And COMPANY_ID = …)` 로 걸러진다.

현재 등록된 오버라이드 (RRPT_ID 31, 등록 2026-08-14):

| COMPANY_ID | 회사 | DVS_CD | 파일 |
|---|---|---|---|
| 30211 | `[개발(하)] 클라우드랩` | A·B·C·D | `WSfAssesmentReciveRegister(TypeB/C/D)_LGHTEST.crf` |
| 30212 | `[개발(원)] 클라우드랩` | A·B·C·D | 〃 |

> ⚠️ **이 폴더의 `.crf` 사본은 기본본이 아니라 위 개발회사 전용본(`_LGHTEST`)이다.** 2026-08-12·08-25 에 교체되었다.
> 같은 `DVS_CD` 인데 기본본과 계열이 어긋나 보인다(항목상세 유무가 A↔B·C 사이에서 반대). 작업 전 반드시 어느 쪽을 기준으로 하는지 확정할 것 —
> [HANDOFF_금번수정_리포트반영.md §6-2](./HANDOFF_금번수정_리포트반영.md)

`DVS_CD` 는 화면에서 이렇게 만들어진다 — [SfasRegAtRiskasmtRcpt.xml:1886](../../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L1886)

```js
wdmScAll.set("RPT_TYPE_CODE", "UR0000000021" + "-" + wdlCdOpt.getCellData(0, "RPT_TYPE_CODE") + "^");
```

즉 **회사 옵션 `RPT_TYPE_CODE`(TCC_PROJ_CODE)** 가 A/B/C/D 중 하나를 고른다. 현장마다 서식이 다른 이유가 이것.

> ⚠️ `RPT_TYPE_CODE` 는 2026-08-10 단어사전 반영에서 `REPORT_TYPE` 을 리네임한 이름이다(배치4). 화면 내부 컬럼 id 이며, 리포트 서버로 나가는 파라미터명이 아니다.

## 2. 호출 경로

```
[본체] SfasRegAtRiskasmtRcpt.xml  .setReportForPopup({ oDvsCd, oPara.rDclt, sPopupUrl })   ← 1168~1204
   ↓ 파라미터 23개를 팝업 파라미터로 전달
[팝업] SfasPopRtrvAssesmentReciveRptAct.xml  cips.getPopupParameter("...") 로 수신          ← 120~150
   ↓ 사용자가 리포트 선택 → rptUrl + rptParam
[리포트서버] http://<host>/REXPERT/rexservice.jsp  → .crf 실행
   ↓ .crf 가 JDBC 로 Oracle 직접 조회 (자체 SQL)
[출력] PDF
```

**중요:** `.crf` 는 애플리케이션 매퍼를 거치지 않는다. `.crf` 안에 `oracle.jdbc.driver.OracleDriver` / `jdbc:oracle:thin:@…` 접속정보와 **자체 SQL** 이 들어 있다.

## 3. 단어사전 리네임(2026-08-10)과의 관계 — **영향 없음**

| 구분 | 이번에 바뀌었나 | 근거 |
|---|---|---|
| `.crf` 내부 SQL 의 컬럼명 | ❌ | DB 컬럼(`ASSMNT_RANK`·`RISK_FACT`·`PLACE`·`MNG_DATE_FROM`·`REGIS_SEQ`·`CMT_CONTENT` 등)을 직접 씀. 단어사전 작업은 **매퍼 별칭만** 바꿨고 DB 컬럼은 하나도 안 건드렸다 |
| 본체 → 팝업 파라미터 **이름**(좌변) | ❌ | 함정12 로 전부 보존. `COND_MONTH`·`STAN_DEGREE`·`MNG_DATE_FROM`·`R_COMPANY_NM`·`REGIS_SEQ`·`SELECT_*` 그대로 |
| 파라미터 **값의 출처**(우변) | ✅ | `wdmScAll.COND_MONTH → wdmScAll.STD_YM` 처럼 우리 컬럼명만 바뀜. 넘어가는 값은 동일 |

검증: `scratchpad/popup_contract.js` 로 본체→팝업 전달키가 배치 이전과 동일함을 확인.

## 4. `.crf` 수정 시 주의

- **바이너리(REX30 포맷)** 라 `git diff` 가 안 된다. 변경하면 **아래 이력표에 사람이 직접 적을 것.**
- 편집은 Rexpert(클립리포트) 디자이너로. 이 폴더 사본을 고친 뒤 리포트 서버에 배포하고, 사본도 같이 갱신해야 둘이 안 갈라진다.
- `.crf` 안에 **DB 접속정보가 박혀 있다.** 환경(개발/운영)별로 다르므로 배포 대상 환경을 반드시 확인.
- `.crf` 가 참조하는데 화면이 안 보내는 옵션: `SFAS_OPT_084`, `SFAS_OPT_092` — 리포트가 자체 SQL 로 직접 읽는 것으로 보인다. 화면 옵션을 바꿀 때 리포트도 같이 봐야 한다.

## 5. 전달 파라미터 23개 (본체 `rDclt`)

| 파라미터(리포트 계약) | 값 출처(화면 컬럼) |
|---|---|
| `COMPANY_ID` / `PROJ_CODE` | `wdmScAll.COMPANY_ID` / `.PROJ_CODE` |
| `COND_MONTH` | `wdmScAll.STD_YM` |
| `STAN_DEGREE` | `wdmScAll.STD_TIME` |
| `R_COMPANY_ID` / `R_COMPANY_NM` | `wdmScAll.R_COMPANY_ID` / `.COOP_COMPANY_NAME` |
| `EMPHS_TF` | `wdmScAll.EMPHS_TF` |
| `SELECT_COND_MONTH` | `wdlAsmt.STD_YM` |
| `SELECT_STAN_DEGREE` | `wdlAsmt.STD_TIME_CODE` |
| `SELECT_R_COMPANY_ID` / `SELECT_R_COMPANY_NM` | `wdlAsmt.R_COMPANY_ID` / `.COOP_COMPANY_NAME` |
| `MNG_DATE_FROM` / `MNG_DATE_TO` | `wdlAsmt.MGMT_BEG_DATE` / `.MGMT_END_DATE` |
| `REGIS_SEQ` | `wdlAsmt.REG_SN` |
| `REG_DATE_RPT_TF` | `wdlCdOpt.REG_DATE_RPT_TF` |
| `SFAS_OPT_040`·`040_001`·`048`·`048_001`·`049`·`049_001`·`066_001`·`066_002` | `wdlCdOpt.*` |

`SELECT_*` 접두는 **선택한 1건** 기준, 나머지는 **조회조건** 기준이다.

## 5-1. 서명란은 파라미터가 아니라 DB 메타로 그려진다 (2026-09-02 추가)

`.crf` 의 서명란은 고정 헤더가 아니라 **7슬롯 + DB 메타**다. 그래서 현장마다 서명란 구성이 달라도 `.crf` 는 하나다.

| 계층 | 테이블 | 컬럼 |
|---|---|---|
| 시스템 기본 | `TSST_PROJ_RPT` / `TSST_PROJ_RPT_SIGN` | `SIGN_USE_TF` · `MIN_SIGN_CNT` · `MAX_SIGN_CNT` / `SIGN_SUB1`(역할) · `SIGN_SUB2`(직책) · `RO_CODE` · `SORT_NO` |
| **현장별(실사용)** | `TSFAS_PROJ_REPORT` / `_DTL` | `REPORT_NM` · `SIGN_TF` · `MIN_DR_CNT` · `MAX_DR_CNT` · `DR_CNT` / `TITLE1`(역할) · `TITLE2`(직책) · `DR_CD`(직책코드) · `SORT_NO` |
| `.crf` MAIN 필드 | — | `REPORT_NM` · `DR_CNT` · `TITLE1_1..7` · `TITLE2_1..7` · `DR_CD_1..7` · `DR_NM_1..7` · `DR_NM_IMG1..7` |

등록 화면: `시스템관리 > 리포트관리 > 현장리포트서명란등록`
— 시스템 [SstRegSystemProjectReportSigning.xml](../../../src/main/webapp/wqxml/sst/SstRegSystemProjectReportSigning.xml) · 현장별 [ccms/CcmsRegCpnProjCoustmReport.xml](../../../src/main/webapp/wqxml/ccms/CcmsRegCpnProjCoustmReport.xml)
화면 라벨 "최소/최대/입력 서명란수" = `MIN_DR_CNT`/`MAX_DR_CNT`/`DR_CNT`.

> 리포트명(`REPORT_NM`)도 이 메타에서 온다 — 리포트 타이틀을 현장별로 바꾸는 기능의 원천이다.

## 6. 변경이력 (`.crf` 는 diff 가 안 되므로 수기 관리)

| 일자 | 파일 | 변경내용 | 작성자 |
|---|---|---|---|
| 2026-07-07 | Register / TypeB / TypeC | (사본 확보 시점) | - |
| 2026-07-07 | TypeD | (사본 확보 시점) | - |
| 2026-08-12 | TypeB / TypeC / TypeD | **사본 교체** — 기본본 → 개발회사 전용본(`_LGHTEST`). 파일명도 함께 바뀜 | - |
| 2026-08-14 | (DB) | `TCC_RRPT_FILE_CPN` 에 회사 30211·30212 용 `_LGHTEST` 4종 등록 (§1-1) | - |
| 2026-08-25 | Register | **사본 교체** — 기본본 → `WSfAssesmentReciveRegister_LGHTEST.crf` | - |
| 2026-08-25 | `사고보고서.crf` | **사본 추가** — 승인 모듈을 리포트에 붙인 선례(`SANCTN_COMPANY_ID`·`SANCTN_PROJ_CODE`·`DEM_SN` → `SUB_SANCTN` 데이터셋). 이 폴더의 다른 `.crf` 중 유일 | - |
| 2026-09-02 | `상시수시 리포트.png` | **자료 추가** — 승인모듈 도입 시 서명란 처리 1안/2안 비교안. **2안(서명란 유지) 채택** → [HANDOFF_금번수정_리포트반영.md](./HANDOFF_금번수정_리포트반영.md) | 이찬호 |

> ⚠️ 위 "사본 교체" 3건은 **파일 내용이 8월 판정과 다르다.** 어느 쪽(기본본/개발본)을 기준으로 작업할지 먼저 정할 것 — [HANDOFF_금번수정_리포트반영.md §6-2](./HANDOFF_금번수정_리포트반영.md).
