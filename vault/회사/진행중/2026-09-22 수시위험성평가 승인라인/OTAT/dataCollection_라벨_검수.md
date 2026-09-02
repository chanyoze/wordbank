---
title: "dataCollection 컬럼 라벨(name) 검수 — SfasRegAtRiskasmtRcpt"
sidebar_label: "dataCollection 라벨 검수"
sidebar_position: 9
date: 2026-08-12
kind: 동결
raw: "RAW-DOC:cip-defg-saas/OTAT/dataCollection_라벨_검수.md"
---

# dataCollection 컬럼 라벨(name) 검수 — SfasRegAtRiskasmtRcpt

> 단어사전 반영 때 컬럼 **id 는 바꿨지만 `name`(한글 라벨)을 안 고친** 자리를 찾은 결과.
> 대상: `SfasRegAtRiskasmtRcpt.xml` — 데이터셋 37개 / 컬럼 448개
> 대조 근거: ① 라벨이 일반명사인가 ② 같은 데이터셋 안에서 라벨이 겹치는가 ③ SQL 별칭 주석(177개)과 의미가 같은가
> 작성: 2026-08-11

`name` 은 화면 동작에 영향을 주지 않지만, 그리드 헤더 기본값·개발자 가독성·다음 리네임의 기준이 되므로 틀리면 계속 비용이 됩니다.

---

## 🔴 1순위 — 라벨이 플레이스홀더 (8건 · 이견 없음, 반영 완료)

id 는 구체적인데 라벨이 "고유번호"·"코드"처럼 아무 의미가 없는 것들입니다. 사용자가 지적한 `wdlCdStrth.RISK_STR_SN` 이 이 유형입니다.

| 데이터셋 | 컬럼 id | 이전 | 변경 |
|---|---|---|---|
| `wdlCdFqc` | `RISK_FQ_SN` | 고유번호 | **위험빈도순번** |
| `wdlCdFqc` | `RISK_FQ_CODE` | 코드 | **위험빈도코드** |
| `wdlCdFqc` | `RISK_FQ_NAME` | 코드 | **위험빈도명** |
| `wdlCdStrth` | `RISK_STR_SN` | 고유번호 | **위험강도순번** |
| `wdlCdStrth` | `RISK_STR_CODE` | 코드 | **위험강도코드** |
| `wdlCdStrth` | `RISK_STR_NAME` | 코드 | **위험강도명** |
| `wdlCdStdd` | `CALC_STD_SN` | 고유번호&lt;SSF_RANK_STDD&gt; | **산정기준순번** |
| `wdmScCont` | `REG_SN` | 순번 | **등록순번** |

`RISK_FQ_CODE` 와 `RISK_FQ_NAME` 이 **둘 다 "코드"** 였습니다(강도도 동일). 코드와 명칭이 같은 라벨을 쓰고 있었습니다.

---

## 🟠 2순위 — 같은 데이터셋 안에서 라벨 중복 (22건)

### 2-1. 고쳐야 하는 것 (6쌍 · 반영 완료)

서로 다른 값인데 라벨이 같아 구분이 안 되는 자리입니다. `wdlCont` 와 `wdlCdContHistory` 는 미러 관계라 **양쪽 같이** 고쳐야 합니다.

| 데이터셋 | 컬럼 id | 이전 | 변경 |
|---|---|---|---|
| `wdlCdStdd` | `IMP_STDD` / `IMP_STDD_NAME` | 하한기준 / 하한기준 | **하한기준값** / **하한기준명** |
| `wdlCdStdd` | `SUP_STDD` / `SUP_STDD_NAME` | 상한기준 / 상한기준 | **상한기준값** / **상한기준명** |
| `wdlCont`·`wdlCdContHistory` | `WBS_CODE` / `WBS_NAME` | 공종코드 / 공종코드 | 공종코드 / **공종명** |
| `wdlCont`·`wdlCdContHistory` | `RISK_FQ_TEXT` / `RISK_FQ_CODE` | 빈도 / 빈도 | **빈도(직접입력)** / **빈도코드** |
| `wdlCont`·`wdlCdContHistory` | `RISK_STR_TEXT` / `RISK_STR_CODE` | 강도 / 강도 | **강도(직접입력)** / **강도코드** |
| `wdlCont`·`wdlCdContHistory` | `TD_LIST_EXIST_TF` / `TDP_LIST_EXIST_TF` | 3D좌표목록 존재여부 ×2 | **3D좌표목록 존재여부** / **3D좌표목록 존재여부(플럭시티)** |
| `wdlCont`·`wdlCdContHistory` | `TD_LIST_UPD_TF` / `TDP_LIST_UPD_TF` | 3D좌표목록 변경여부 ×2 | **3D좌표목록 변경여부** / **3D좌표목록 변경여부(플럭시티)** |

`TD_` 와 `TDP_` 는 SQL 상 실제로 다릅니다 — `TD_LIST_EXIST_TF` 는 `td` 또는 `tdp` 둘 중 하나라도 있으면 `'T'`, `TDP_LIST_EXIST_TF` 는 `tdp` 만 봅니다([SfasRegAtRiskasmtRcptSql.xml:1226-1229](../../src/main/resources/sqlmap/mappers/sfas/SfasRegAtRiskasmtRcptSql.xml#L1226-L1229)). 옵션 `TD_TYPE` 이 `<C:클라우드랩, P:플럭시티>` 이므로 `tdp` = 플럭시티입니다.

### 2-2. ⚠️ 결정 필요 — `APPRV_CONSTR_USER_NAME`

`wdlAsmt` 에서 **3개 컬럼이 전부 "공사팀장"** 인데, 이 중 하나는 의미가 다릅니다.

| 컬럼 id | 현재 라벨 | SQL 주석 | 비고 |
|---|---|---|---|
| `CONSTR_LDR_USER_NO` | 공사팀장 | 공사팀장 사용자번호 | 작성 담당 공사팀장 |
| `CONSTR_LDR_USER_NAME` | 공사팀장 | 공사팀장 | 〃 |
| `APPRV_CONSTR_USER_NAME` | 공사팀장 | **공사팀장 승인자** | 🔴 **레거시 승인 결재자** — 다른 개념 |

제안: `APPRV_CONSTR_USER_NAME` → **"공사팀장 승인자"** (SQL 주석과 일치). `APPRV_SAF_*`·`APPRV_HDCF_*` 도 같은 방식으로 정리.

### 2-3. 그대로 둬도 되는 것 (관례)

`*_USER_NAME` 과 `*_USER_NO` 가 같은 라벨을 쓰는 건 이 저장소의 관례입니다 — 화면엔 이름만 보이고 `_NO` 는 히든 키입니다. 굳이 고칠 필요는 없지만, 명확히 하려면 `_NO` 쪽에 "…사번"을 붙이면 됩니다.

- `DEC_CFMOR_USER_NAME` / `DEC_CFMOR_USER_NO` — 감소확인자
- `IMPROV_EDU_USER` / `IMPROV_EDU_USER_NO` — 감소조치자
- `ORD_OFC_USER_NO` / `ORD_OFC_USER_NAME` — 발주처담당자
- `RISK_PL` / `RISK_PL_TD` — 위치 (둘 다 `a.PLACE` 에서 나옴. `_TD` 는 3D용이고 관련 처리가 통째 주석 상태라 현상유지)
- `DEC_AFT_RISK_GR_TEXT` / `_NAME` / `_SELECT` — 감소후등급. 옵션(040_002·066_002)에 따라 입력방식이 갈리는 3형제라 셋 다 노출되지 않음

---

## 🟡 3순위 — SQL 주석과 의미가 다름 (45건)

### 3-1. wqxml 라벨이 명백히 틀린 것 (반영 완료)

| 데이터셋 | 컬럼 id | 이전 | 변경 | 근거 |
|---|---|---|---|---|
| `wdlCont`·`wdlCdContHistory` | `ACCUM_MGMT_NAME` | 대상 | **누적관리대상구분** | `Decode(ACC_TF,'T','누적','신규')` |
| `wdlCont`·`wdlCdContHistory` | `ADD_EXC` | 추가도출 | **라인추가 작성주체** | SQL Case 식이 작성주체를 산출 |
| `wdlCdRvwOpChk` | `CONSTR_CMT_REG_CNT` | 공사팀장의견 | **공사 검토의견 등록수** | 건수인데 의견으로 라벨링됨 |
| `wdlCdRvwOpChk` | `SAF_CMT_REG_CNT` | 안전보건의견 | **안전 검토의견 등록수** | 〃 |
| `wdlAsmt` | `STD_YM` | 월 | **기준연월** | |
| `wdmScAll` | `STD_YM` | 회차연월 | **기준연월** | |
| `wdlAsmt` | `STD_TIME_CODE` | 회차 | **기준회차** | |
| `wdlCdRegDegree` | `STD_TIME_CODE` | 회차 | **기준회차** | |
| `wdmScTransExecuteSumOfDisasterForm` | `REG_SN` | 평가서순번 | **등록순번** | |

### 3-2. ✅ 용어 통일 — 확정·반영 완료 (2026-08-11)

| 컬럼 id | 확정 라벨 | 고친 쪽 |
|---|---|---|
| `DR_FORM_NAME` | **재해형태** | SQL 주석 (재해유형 →) |
| `RISK_GR_NAME` | **위험성등급** | SQL 주석 3곳 (위험도등급 →) |
| `RISK_GR_SELECT` | **위험성등급(선택)** | SQL 주석 (위험등급(선택) →) |
| `EMPHS_REG` | **중점등록** | wqxml 2곳 (중점여부 →) |

### 3-2a. ↩️ `SYNTH_*` — "종합" 표현 배제로 롤백 (2026-08-12)

한때 `공사팀 종합의견`/`안전팀 종합의견` 으로 바꿨다가 **되돌렸습니다.** 그리드를 감싸는 기존 라벨이 이미 *"위험성평가서별 내용별 공사담당/팀장 검토의견"* 이라 '종합'이 겹치기 때문입니다.

| 계층 | 현재 값 |
|---|---|
| **사용자 노출** (그리드 헤더 · 팝업 폼라벨 · 검증 메시지) | **공사팀장 검토의견 / 안전팀장 검토의견** |
| 데이터셋 `wdmTrscApprv` | 공사팀장 검토의견 / 안전팀장 검토의견 (원래부터 일치) |
| 데이터셋 `wdlAsmt`·팝업 `wdlCont`, SQL 주석 | 공사팀장의견 / 안전팀장의견 (기존 이름 유지) |

옵션명(`SFAS_OPT_092`="종합검토의견 사용여부", `060_002`="종합검토의견 작성 필수 검증")은 **DB 옵션의 공식 명칭**이라 그대로 둡니다.

### 3-2b. ✅ `SORT_NO` → 정렬번호 (2026-08-12 · 26곳)

`정렬순서`/`정렬순번` 이 섞여 있던 것을 **정렬번호** 로 통일했습니다.

- 채번이 `Nvl(Max(a.SORT_NO), 0) + 1` — **시퀀스가 아니므로** '순번'은 과한 표현
- 접미사 규약상 `_SN` → 순번, `_NO` → **번호**

> ⚠️ 처음엔 "정렬순번"으로 맞췄다가 되돌렸습니다. **다수결(손대기 전 9곳이 이미 정렬순번)을 먼저 봤고 접미사 규약을 나중에 본 것**이 원인입니다. 라벨 판정은 **규약 → 다수결** 순서여야 합니다.

### 3-2c. ✅ 데이터셋명 단어사전 반영 (2026-08-12 · 152곳 / 6파일)

컬럼은 사전대로인데 **데이터셋·서브미션·statement 이름만** 옛 축약형으로 남아 있던 것들입니다.

| 이전 | 이후 | 근거 컬럼 |
|---|---|---|
| `CdFqc` | **`CdFq`** | `RISK_FQ_SN`·`RISK_FQ_CODE`·`RISK_FQ_NAME` |
| `CdStrth` | **`CdStr`** | `RISK_STR_SN`·`RISK_STR_CODE`·`RISK_STR_NAME` |
| `CdRegDegree` | **`CdStdTime`** | `STD_TIME_CODE`·`STD_TIME_NAME` |
| `SumOfDisasterForm` | **`SumOfDrForm`** | `DR_FORM_SN`·`DR_FORM_NAME` |

각각 **데이터셋 · 조회조건맵 · 서브미션 · 액션URL · Controller(매핑/메서드/응답키/파라미터) · Service · Impl · Mapper · SQL** 을 한 세트로 옮겼습니다.

**🔒 `CdCondDegree` 는 제외** — `selectCdCondDegreeList` 를 `SfasPopRtrvAssesmentReciveRptActController`·`SfasPopRegAssesmentReciveSubmissionController` 가 **우리 서비스로 직접 호출**합니다. 컬럼(`TIME_CODE`/`TIME_NAME`)도 공유 계약이라 리네임 대상이 아니었고, 이름과 컬럼이 서로 일관되므로 그대로 둡니다.

### 3-2b. ✅ 식별자 리네임 2건 — 반영 완료 (2026-08-11)

라벨만이 아니라 **컬럼 id 자체**를 바꾼 건입니다. 이 화면 세트(5파일)에만 적용했습니다.

| 이전 | 이후 | 라벨 |
|---|---|---|
| `AD_CD` | **`ADD_REG_CODE`** | 등록방법코드 |
| `CFM_OP` | **`PROJ_HDCF_CFM_OP`** | 현장소장의견 |

`PROJ_HDCF_CFM_OP` 는 임의 조어가 아닙니다 — 최초/정기 모듈이 이미 `LAR_PROJ_HDCF_CFM_OP`("현장소장 검토의견")를 쓰고 있어([TSF_FST_RISKS_EVLCHRT_PROJ.xml:26](../../src/main/resources/sqlmap-including/table/sfas/first/TSF_FST_RISKS_EVLCHRT_PROJ.xml#L26)) 그 관행을 따랐습니다.

**적용 범위**

| 파일 | ADD_REG_CODE | PROJ_HDCF_CFM_OP |
|---|--:|--:|
| `SfasRegAtRiskasmtRcpt.xml` | 14 | 11 |
| `SfasPopRegRiskAssessmentConfirm.xml` | 3 | 0 |
| `SfasRegAtRiskasmtRcptSql.xml` | 5 | 4 |
| `SfasPopRegRiskAssessmentConfirmSql.xml` | 3 | 0 |
| `SfasRegAtRiskasmtRcptServiceImpl.java` | 1 | 0 |

**🔒 건드리면 안 되는 것 (전부 유지 확인)**

| 대상 | 이유 | 검증 |
|---|---|---|
| `AD_CD` (Insert 컬럼목록·Where) | **실제 DB 컬럼** | Rcpt SQL 40곳 · 승인팝업 SQL 5곳 유지 |
| `APPRV_CMT` | `CFM_OP` 의 원본 DB 컬럼 | 6곳 유지 |
| `AT_CONSTR_CFM_OP_SN` · `AT_SAF_CFM_OP_SN` | 부분문자열만 겹치는 별개 DB 컬럼 | 각 28곳 유지, 오염 0 |
| `SMR_CFM_OP_VER_TF` · `SMR_CFM_OP_USE_TF` | **승인의견 팝업에 넘기는 파라미터 키**(외부 계약) | 각 2곳 유지 |
| `aoRtnDat.data.APPRV_CMT` | 일괄수정 팝업 **콜백 응답키**(상대가 정한 이름) | 유지 |

단어경계(`\b`) 치환이라 `_` 로 이어진 위 토큰들은 자동으로 보호됩니다. SQL 은 정규식 전면치환 대신 **라인 지정**으로 별칭·바인드만 바꿨습니다.

**사이드 이펙트 없음 근거** — 대상 statement 9종(`selectAsmtList`·`selectContList`·`selectConstrRvwList`·`selectSafRvwList`·`insertAsmt`·`updateAsmt`·`insertCont`·`trscApprv`)은 전부 이 화면 전용입니다. 우리 서비스를 재사용하는 타 컨트롤러는 `SfasPopRtrvAssesmentReciveRptAct`·`SfasPopRegAssesmentReciveSubmission` 2개뿐이고 둘 다 `selectCdCondDegreeList` 만 호출하는데, 그 쿼리엔 두 컬럼이 없습니다.

> ⚠️ Java `SfasRegAtRiskasmtRcptServiceImpl:406` 이 `mWdlCdContHistory.get("AD_CD").toString()` 을 호출합니다. 화면만 리네임하고 여기를 빠뜨리면 **NullPointerException** 입니다. 다음에 비슷한 리네임을 할 때 Java 쪽 `get("...")` 을 반드시 같이 훑으세요.

### 3-3. SQL 주석 쪽이 나쁜 것 (wqxml 유지 · SQL 주석을 고치는 게 맞음)

| 컬럼 id | wqxml (유지) | SQL 주석 (부정확) |
|---|---|---|
| `TIME_CODE` | 회차코드 | "숫자를 문자로 변환" — 구현 설명이지 컬럼 뜻이 아님 |
| `WK_ATDT_CMPL_TF` | 근로자참석여부 | "옵션, 날짜검증 완료" — 메모 조각 |
| `SFAS_OPT_060_001` | 옵션60번 검토의견 검증 | (더 길지만 의미 동일) |

나머지(옵션 설명 26건 등)는 `&lt;` 이스케이프·띄어쓰기 차이라 실질 불일치가 아닙니다.

---

## 검수 도구

이 검수는 아래 3가지를 동시에 봅니다. 라벨을 다시 손볼 일이 생기면 재사용하세요.

1. 라벨이 일반명사인가 (고유번호·코드·순번·값·명…)
2. 같은 데이터셋 안에서 라벨이 겹치는가
3. SQL 별칭 주석과 의미가 같은가 — **`&lt;`·공백·괄호를 정규화한 뒤** 비교해야 오탐이 안 난다(정규화 전 72건 → 후 45건)

접미사 규칙(`_SN`→순번, `_CODE`→코드 …)도 시도했으나 **오탐이 74건 중 대부분**이었습니다. `CONSTR_LDR_USER_NAME`="공사팀장" 처럼 그리드 헤더로는 자연스러운 라벨이 전부 걸리기 때문입니다. 이 규칙은 쓰지 마세요.
