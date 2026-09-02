---
title: "SfasRegAtRiskasmtRcpt — 옵션 전수 × 화면 제어 (AS-IS + TO-BE)"
sidebar_label: "접수화면 옵션 전수"
sidebar_position: 4
date: 2026-08-28
kind: 갱신
raw: "RAW-DOC:cip-defg-saas/OTAT/TO-BE/SfasRcpt_옵션전수_화면제어.md"
---

# SfasRegAtRiskasmtRcpt — 옵션 전수 × 화면 제어 (AS-IS + TO-BE)

> **대상**: 상시·수시위험성평가서접수 외곽 화면 `SfasRegAtRiskasmtRcpt.xml` (팝업은 [현행/승인팝업_옵션·컬럼_산출물.md](../현행/승인팝업_옵션·컬럼_산출물.md) 별도).
> **목적**: 옵션(및 조합)이 각 그리드의 **컬럼 표시 / 편집(readonly) / 필수(notnull) / 그리드 숨김·높이**를 어떻게 제어하는지 전수 정리. SCNT 잠금 seam 구현 전 기준 지도.
> **범위**: AS-IS(현재 동작) 전수 + `[TO-BE]` 마커로 SCNT 변경점·신규 규칙 표시.
> 관련: 060 seam [TO-BE/SfasRcpt_옵션060_영향목록.md](./SfasRcpt_옵션060_영향목록.md) · SoT [현행/SCNT_구현방식_공유.md](../현행/SCNT_구현방식_공유.md)
>
> 🔗 **컬럼 축 교차검증**: [컬럼표시_화면대조.md](../컬럼표시_화면대조.md) — 같은 컬럼이 외곽·팝업에서 각각 어떤 조건으로 보이는지. 조건식을 고치면 **두 문서를 같이** 고친다.
>
> 📌 **옵션 값이 화면까지 도달하는 경로(파이프라인)·빈 값일 때의 동작·승인 게이트 진리표는 [§10~§13](#10-옵션-전달-파이프라인--값이-화면까지-오는-경로-2026-08-05-신설)**.
> 옵션을 새로 붙이거나 화면을 리팩토링했다면 **`bash docs/OTAT/opt_pipeline_scan.sh` 를 먼저 통과**시킬 것.

---

## 0. 제어 아키텍처 — 5개 함수

| 함수 | 대상 | 역할 | 행별? |
|---|---|---|---|
| `columnVisibleControl` (4318) | 전 그리드 | 컬럼 표시/숨김 (`setColumnVisible`) | 전역 1회 |
| `optControl` (4381) | 전 그리드 | 필수(notnull) 레지스트리 + 그리드숨김·높이·버튼. 내부에서 columnVisibleControl 호출 | 전역 1회 |
| `gridMainControl(nIdx)` (4484) | 평가서 `wgrdMain` | 행 readonly + 셀클래스 + 결재자 하이라이트 | 행별 |
| `gridItemControl(nIdx)` (4581) | 내용 `wgrdSub01` | 행 readonly + notnull class | 행별 |
| `gridCmtControl(dataId,nIdx)` (4681) | 검토의견 `wgrdSub02/03` | 행 readonly + notnull class | 행별 |

옵션값은 `scwin.oOptConfig`(= `wdlCdOpt` 로드 시 구성)에서 `bUseOptNNN`로 참조.

---

## 1. ★ 마스터 잠금 게이트 (모든 편집의 최상위 조건)

3개 데이터 그리드(평가서·내용·검토의견)의 행별 제어 함수는 **동일한 게이트**로 시작한다:

```js
const bNotChecked = (CHECK_TF == 'F');   // 미접수
const bEditImpsbl = (EDIT_TF  == 'F');   // 수정불가
const bReadOnly   = bNotChecked || bEditImpsbl;
if(bReadOnly) { wgrd.setRowReadOnly(nIdx, true); return; }   // 행 전체 잠금 + Early Return
```

- **`EDIT_TF='F'` 하나면 평가서·내용·검토의견 그 행 전부 readonly.** 이하 개별 옵션 readonly는 **bReadOnly=false일 때만** 적용된다(잠기면 개별 제어 무의미).
- `CHECK_TF='F'`(미접수)도 동일하게 전체 잠금.
- **EDIT_TF 산출**(SQL `SfasRegAtRiskasmtRcptSql.selectLstMain` [L676-696](../../../src/main/resources/sqlmap/mappers/sfas/SfasRegAtRiskasmtRcptSql.xml) — Case 순서대로, 위가 우선):
  - **레거시 STTS_CD='30'** (공사팀장 승인 전) → **전체 허용**('T')
  - **레거시 STTS_CD 40~60** → **자기 차례 결재자 본인만** 허용(APPRV_*_USER_NO=세션 && *_TF='F'), 그 외 잠금
  - **SCNT `CFM_DEM_SN` 있음**: `CFM_STS_CODE` **DEM·PROG·CMPL = 잠금**('F') / REG·REJ = 허용('T') ← 요청취소·반려하면 다시 허용
  - **SCNT 무라인(060_003='T')** → 허용 / **레거시 미접수(CHECK_TF='F')** → 잠금 / Else 허용
  - 참조 [TODO_EDIT_TF_JS이관.md](./TODO_EDIT_TF_JS이관.md)

> **[TO-BE] 사용자 규칙 "승인요청 후 내용·검토의견 수정불가" — ✅ 현 동작으로 성립(추가 구현 불필요)**
> SCNT에서 **EDIT_TF가 담당**한다. 승인요청 시 `CFM_STS_CODE=DEM` → EDIT_TF='F' → 3그리드 전부 잠금.
> **반려(REJ) 시엔 편집 재허용** = **확정 규칙**(2026-07 인터뷰): 반려되면 고쳐서 재요청해야 하므로 재편집 가능해야 함. 현 EDIT_TF 로직(DEM·PROG·CMPL 잠금 / REG·REJ·작성중 허용)이 이 규칙과 일치.

---

## 2. 컬럼 표시 (`columnVisibleControl`)

### 2.1 평가서 `wgrdMain`
| 컬럼 | 표시 조건 |
|---|---|
| `Q_USER_CMT` (근로자대표 의견) | `049` |
| `R_USER_CMT` (감리 의견) | `049_001` |
| `SANCTN_STEP_NAME` (단계) | `060_003` |
| `SANCTN_STEP_USER_NAME` (대기자) | `060_003` |
| `C_USER_NM` (공사팀장 지정) | `!060 && !060_003` |
| `APPRV_C_USER_NM` (공사팀장 승인) | `060` |
| `APPRV_BD_USER_NM` (안전팀장 승인) | `060` |
| `APPRV_A_USER_NM` (현장소장 승인) | `060` |
| `J_USER_CMT` / `J_USER_NM` (발주처 의견/담당) | `064` |
| `SYNTH_CONSTR_OP` / `SYNTH_SAF_OP` (공사팀·안전팀 종합의견) | `092` |
| `SECT_CODE` (구분) | `095` |
| `WK_ATDT` (근로자참석) | `098_001 \|\| 098_002` |
| `DR_CASE_REG` (재해사례등록) | `113` |
| `STATUS` (상태) | **항상 표시** (SQL이 회차별 레거시/SCNT 어휘 산출 — 소급유지) |

### 2.2 내용 `wgrdSub01`
| 컬럼 | 표시 조건 |
|---|---|
| `ASSMNT_FQC` (빈도) | `040 && !040_001` |
| `ASSMNT_FQC_SELECT` | `040 && 040_001` |
| `ASSMNT_STRTH` (강도) | `040 && !040_001` |
| `ASSMNT_STRTH_SELECT` | `040 && 040_001` |
| `ASSMNT_RANK` (위험성등급) | `!040_002` |
| `ASSMNT_RANK_SELECT` | `!040 && 040_002` |
| `PREV_ASSMNT_RANK` (이전등급) | `066_001` |
| `AFTER_ASSMNT_RANK` (감소후등급) | `((040 && !040_001) \|\| (!040 && !040_002)) && 066_002` |
| `AFTER_ASSMNT_RANK_CD` | `040 && 040_001 && 066_002` |
| `AFTER_ASSMNT_RANK_SELECT` | `!040 && 040_002 && 066_002` |
| `ASSMNT_REF` (연계) | `048` |
| `ADD_RISK` (추가도출) | `048_001` |
| `PLACE` / `PLACE_TD` (장소/3D장소) | `!bTdUse` / `bTdUse` |
| `CCTV_MON_TF` (CCTV관제) | `120` |

### 2.3 검토의견 `wgrdSub02`(공사)·`wgrdSub03`(안전)
| 컬럼 | 표시 조건 |
|---|---|
| `REG_USER_NAME` / `REG_DATE` / `REG_TIME` (작성자/일자/시간) | `046` |

---

## 3. 편집 readonly (행별, bReadOnly=false 전제)

### 3.1 평가서 `wgrdMain` (`gridMainControl`)
| 컬럼 | readonly 조건 |
|---|---|
| `SYNTH_CONSTR_OP` / `SYNTH_SAF_OP` | `060` (레거시=승인시입력이라 잠금 / **SCNT(060=F)=편집가능**) |
| `C_USER_NM` | `060` |
| `APPRV_C_USER_NM` | `!060 \|\| APPRV_C_TF='T'` |
| `APPRV_BD_USER_NM` | `!060 \|\| APPRV_BD_TF='T'` |
| `APPRV_A_USER_NM` | `!060` |
| `APPRV_CMT` (현장소장의견) | `(!060 && bEditImpsbl) \|\| (060 && STTS_CD!='20')` |
| `Q_USER_CMT` | `!049` |
| `R_USER_CMT` | `!049_001` |
| `J_USER_CMT` / `J_USER_NM` | `!064` |
| `SECT_CODE` | `!095` |
| `STAN_MONTH` / `STAN_DEGREE` | `bChkOpt095Legacy` (=`!095 && SECT_CODE='S'`, 특별회차 소급) |
| `MNG_DATE_FROM` / `MNG_DATE_TO` | `근로자참석존재(WK_ATDT_CNT>0) \|\| bChkOpt095Legacy` |

**셀클래스**: `STATUS` → SCNT행이면 `cipc-link`(팝업 진입) / `APPRV_C·BD·A_USER_NM` → `STTS_CD!=20 && 060`이면 `cipc-notnull`(빨간 필수표시) / 결재자==본인이면 파란 bold 하이라이트.

### 3.2 내용 `wgrdSub01` (`gridItemControl`)
| 컬럼 | readonly 조건 |
|---|---|
| `ASSMNT_RANK` | `040_001` |
| `ASSMNT_RANK_SELECT` | `!040_002` |
| `PRIORITY` | `(040 && 040_001) \|\| (!040 && 040_002)` |
| `ASSMNT_FQC` / `ASSMNT_STRTH` | `!(040 && !040_001)` |
| `ASSMNT_FQC_SELECT` / `ASSMNT_STRTH_SELECT` | `!(040 && 040_001)` |
| `ASSMNT_REF` | `!048` |
| `AFTER_ASSMNT_RANK_CD` | `!(040 && 040_001 && 066_002)` |
| `AFTER_ASSMNT_RANK_SELECT` | `!(!040 && 040_002 && 066_002)` |
| `AFTER_ASSMNT_RANK` | `!(066_002 && ((040 && !040_001) \|\| (!040 && !040_002)))` |
| `PLACE` / `PLACE_TD` | `bTdUse` / `!bTdUse` |
| `RISK_FACT`·`CONSTRUCT_NAME_C_NM`·`DISASTER_FORM`·`IMPRV_MTHD` | 평가모델등록행(AD_CD=60) 또는 누적관리대상(ACC_TF=T)이면 잠금 |

### 3.3 검토의견 `wgrdSub02/03` (`gridCmtControl`)
| 컬럼 | readonly 조건 |
|---|---|
| `REG_USER_NAME` / `REG_DATE` / `REG_TIME` | `!046` |

---

## 4. 필수 notnull

### 4.1 레지스트리 (`optControl` — 저장검증)
| 그리드 | notnull 컬럼 | 조건 |
|---|---|---|
| `wgrdMain` | `APPRV_C_USER_NM`·`APPRV_BD_USER_NM`·`APPRV_A_USER_NM` | `060` |
| `wgrdSub01` | 040 조합별 (아래) | 항상(040 분기) |
| `wgrdSub02/03` | `REG_USER_NAME`·`REG_DATE`·`REG_TIME` | `046` |

**wgrdSub01 040 조합:**
- `040 && 040_001` → `ASSMNT_FQC_SELECT`, `ASSMNT_STRTH_SELECT`, `ASSMNT_RANK`
- `040 && !040_001` → `ASSMNT_FQC`, `ASSMNT_STRTH`, `ASSMNT_RANK`, `PRIORITY`
- `!040 && 040_002` → `ASSMNT_RANK_SELECT`
- `!040 && !040_002` → `ASSMNT_RANK`, `PRIORITY`

### 4.2 셀클래스 시각표시 (행별)
- `wgrdMain`: `APPRV_C·BD·A_USER_NM` ← `STTS_CD!=20 && 060` (§3.1)
- `wgrdSub01`: 위 040 조합 컬럼 ← `cipc-notnull` (gridItemControl)
- `wgrdSub02/03`: `REG_USER_NAME/DATE/TIME` ← `046` (gridCmtControl)

---

## 5. 그리드 숨김 · 높이 · 버튼 (`optControl` §4~6)

| 대상 | 동작 | 조건 |
|---|---|---|
| **`wcpntGrpGrdCmt`** (검토의견 그리드 영역) | **display:none** | **`092`** (092=T면 검토의견 그리드 통째 숨김) |
| `wcpntMsg` (빈도x강도 안내) | display block/none | `040 && !040_001 && 053` (bMsgVisible) |
| `wbtnRankStdd` (등급기준 버튼) | display/none | `040 && 040_001` (bBtnVisible) |
| `wgrdSub01` 높이 | `092 ? 425 : 616` (+bMsgVisible면 +48) | 092 |
| 가져오기버튼 `wbtnGetEvalMdl` | 숨김 | `!041` |
| `wbtnGetPreFirstDngr` | 숨김 | `!042` |
| `wbtnGetMdStdd` | 숨김 | `!059` |
| `wbtnViewTdSub01` (3D뷰) | show/hide | `bTdUse && bTdType='P'` |

> **주의**: `092`(종합검토의견 사용)면 §2.3 검토의견 컬럼과 무관하게 **검토의견 그리드 영역 자체(wcpntGrpGrdCmt)를 숨긴다.** 즉 092=T = "항목별 검토의견 대신 평가서 단위 종합의견 쓴다"는 의미.

---

## 6. 옵션 사전 (등장 옵션 전수 — DB 컬럼 코멘트 공식 명칭)

> 출처: `TCC_PROJ_CODE` 컬럼 코멘트(권위 명칭). `[]`=값 도메인.

| 옵션 | 공식 명칭 |
|---|---|
| `040` | 빈도/강도 사용여부 |
| `040_001` | 빈도/강도 회사별코드 적용여부 |
| `040_002` | 위험등급 3단계법 사용여부 |
| `041` | 평가모델내용가져오기 팝업 사용여부 (버튼 `wbtnGetEvalMdl`) |
| `042` | 최초위험성평가 사용여부 (버튼 `wbtnGetPreFirstDngr`) |
| `046` | 위험성평가서및등록부 **담당자 표시여부** (검토의견 그리드 REG_USER/DATE/TIME) |
| `048` | 위험성평가서및등록부 연계 사용여부 |
| `048_001` | **라인추가 작성주체** 컬럼 사용여부 (ADD_RISK) |
| `049` | 근로자 대표의견 사용여부 |
| `049_001` | 감리의견 사용여부 |
| `053` | 위험성평가서제출/접수 **산출식 표시여부** |
| `053_001` | 위험성평가서제출/접수 산출식 (문구 텍스트값) |
| `059` | **기본모델가져오기** 사용여부 (버튼 `wbtnGetMdStdd`) |
| `060` | 수시위험성평가 **결재프로세스 사용여부** (레거시 승인) |
| `060_001` | 검토의견 작성 필수 검증 [A:검증안함, B:전체항목, C:중점항목] |
| `060_002` | 검토의견 작성 필수 검증 [T:검증함, F:안함] — ※코드상 **종합검토의견(SYNTH) 검증**에 사용 |
| `060_003` | **승인 모듈(SCNT) 사용여부** [T:사용, F:안함] |
| `064` | 발주처 의견 작성란 추가여부 |
| `066_001` | 이전 등급 사용여부 |
| `066_002` | **개선 후 등급** 사용여부 (AFTER_ASSMNT_RANK) |
| `092` | 종합검토의견 사용여부 (검토의견 그리드 대체) |
| `095` | **특별회차** 사용여부 (SECT_CODE 구분 컬럼) |
| `098_001` | **안전지키미 참석자 버튼** 사용여부 |
| `098_002` | **안전지키미 참석자 QR** 사용여부 |
| `113` | 재해사례 자동등록여부 |
| `120` | [한화오션] CCTV관제 컬럼 조회여부 |
| `TD_USE` | 3D 사용여부 |

> ⚠️ `060_002`는 DB 코멘트가 "검토의견 작성 필수 검증"이나 **코드 실사용은 종합검토의견(SYNTH) 검증** — 코드 기준 해석 우선. `053_001`은 T/F가 아니라 **산출식 문구 텍스트값**.

---

## 7. 조합(중첩) 규칙 하이라이트

읽을 때 헷갈리기 쉬운 조합만 발췌:

- **040 × 040_001 × 040_002** — 위험성등급 입력 방식 3분기:
  - `040 && 040_001` → SELECT형(FQC_SELECT/STRTH_SELECT/RANK)
  - `040 && !040_001` → 직접입력(FQC/STRTH/RANK/PRIORITY)
  - `!040 && 040_002` → 3단계 SELECT(RANK_SELECT)
  - `!040 && !040_002` → RANK/PRIORITY
- **066_002 (감소후등급)** — 위 040 분기에 따라 `AFTER_ASSMNT_RANK` / `_CD` / `_SELECT` 중 하나만 표시.
- **098_001 ‖ 098_002** — 둘 중 하나라도 T면 `WK_ATDT` 컬럼 표시.
- **!060 && !060_003** — 승인 아무것도 안 쓸 때만 `C_USER_NM`(공사팀장 지정) 표시. (060이나 060_003 중 하나 켜지면 숨김)
- **092** — 켜지면 검토의견 그리드(wcpntGrpGrdCmt) 숨김 + 종합의견 컬럼 표시 + wgrdSub01 높이 425.

---

## 8. [TO-BE] SCNT 도입 변경점 (060=F 부작용 + 혼용 대응)

SCNT 현장은 `060=F`로 저장 → 060-게이트가 else로 빠짐. 대부분 의도대로이나, **혼용(소급 레거시+SCNT 회차 공존)** 에선 승인 컬럼 가시성이 깨져 재설계 필요:

| 지점 | 060=F 효과 | 판정 |
|---|---|---|
| `C_USER_NM` 표시(`!060 && !060_003`) | SCNT면 숨김 | ✅ |
| `SYNTH_*` readonly(060) | SCNT=편집가능 | ✅ 의도(작성자 사전입력) |
| notnull `APPRV_*`(060) | 미적용 | ✅ |
| **잠금 마스터게이트(EDIT_TF)** | SCNT는 CFM_STS_CODE 기준(DEM~CMPL 잠금, REJ 재편집) | ✅ 성립 |
| **승인 컬럼 표시**(APPRV_C/BD/A·APPRV_CMT / 단계·대기자) | 현장 옵션 기준 | ❌ **혼용에서 한쪽 숨겨짐 → §8.1 재설계** |

### 8.1 [TO-BE 확정] 승인 컬럼 = presence 기반 가시성 + 행별 편집

**배경**: 옵션 전환(소급)으로 한 그리드에 레거시 회차 + SCNT 회차 혼용 가능(운영 실발생 — 현 dev엔 `30212/A0001/202607` 1건, 옵션 토글로 생성). 현행은 현장 옵션(060/060_003) 기준이라 혼용 시 한 엔진 컬럼이 통째 숨겨짐.

**결정(2026-07)**: 원안은 승인 컬럼 **전체** presence였으나, **구현·테스트에서 그리드 폭 초과로 레이아웃 파손** 확인 → **`APPRV_CMT`(현장소장의견)만 presence 적용**으로 축소. 나머지는 현장 옵션 기준 유지, 다른 엔진 회차 상태는 **STATUS + 클릭(SCNT 팝업)** 으로 커버.

> ⚠️ **레이아웃 제약**: `wgrdMain`(autoFit="none")은 두 엔진 승인 컬럼(레거시 승인자3+종합의견2+현장소장의견 / SCNT 단계·대기자2)을 **동시 표시하면 정의폭(autoFitMinWidth 1488) 초과 → 컬럼 짜부라짐**. 원래 상호배타 전제로 설계돼 혼용 전량 표시를 못 버팀.

| 컬럼군 | 표시 | 편집 |
|---|---|---|
| 현장소장의견 `APPRV_CMT` | **`060 \|\| 레거시행 존재`** (presence — columnVisibleControl 누락이던 것 추가) | **SCNT행 readonly**(`fnIsScntRow`) + 레거시행 기존규칙 |
| 레거시 승인자 `APPRV_C/BD/A_USER_NM` | `060` (현행 유지) | 기존 |
| SCNT `SANCTN_STEP_NAME/USER_NAME` | `060_003` (현행 유지) | 조회전용 |
| `STATUS` | 항상 (변경 없음) | - |

**구현(적용됨)**:
1. wdlMain 로드 시 `bHasLegacy` 계산(`!fnIsScntRow`) → `columnVisibleControl` 재실행(onDataLoad).
2. `APPRV_CMT` 표시 = `060 || bHasLegacy`.
3. `APPRV_CMT` readonly 선두에 `fnIsScntRow(nIdx) ||`.

> **미해결(원안 잔여)**: 승인자·단계/대기자까지 혼용에서 다 보이게 하려면 **그리드 가로 스크롤/폭 재설계** 필요 — 별도 검토(현재 STATUS+팝업으로 대체).

**남은 seam**: [옵션060영향목록 §D~G](./SfasRcpt_옵션060_영향목록.md)의 상태부여·승인액션·검토의견게이트.

---

## 9. 인터뷰 결과 (2026-07 확정)

- **Q1** 승인요청 후 잠금 & 반려 재편집 → **(a) 확정**: 반려(REJ) 시엔 재편집 허용(고쳐서 재요청). 현 EDIT_TF 로직이 이미 일치 → §1. **추가 작업 없음.**
- **Q2** 옵션 명칭 → **DB 컬럼 코멘트로 전수 확정**(§6). 별도 질의 불요.
- **Q3** `092`가 검토의견 그리드 숨김 → **확정, SCNT에서도 동일 유지**(정상 동작 확인). 종합의견=평가서단위 대체.
- **Q4** 팝업 통합 여부 → **별도 유지**(팝업은 산출물.md). 내용이 커지면 계속 분리, 심플하게 정리되면 통합 재검토.

---

# 10. 옵션 전달 파이프라인 — **값이 화면까지 오는 경로** (2026-08-05 신설)

> 기존 §1~§9는 **"옵션이 T일 때 화면이 어떻게 되나"** 를 다룬다.
> 이 절은 그 앞단 — **"옵션 값이 화면까지 도달하는가"** 와 **"도달하지 못하면 어떻게 되나"** 를 다룬다.
> 2026-08-05 승인팝업 사고가 정확히 이 틈에서 났다(§13).

## 10.1 3단계 파이프라인

```
① SQL 출력          selectCdOptList / selectCdOpt 가 a.SFAS_OPT_XXX 를 Select
② dataList 선언     wdlCdOpt 에 <w2:column id="SFAS_OPT_XXX"> 존재
③ JS 읽기           wdlCdOpt.getCellData(0, "SFAS_OPT_XXX")
```

**②가 빠지면 WebSquare가 값을 조용히 버린다.** 에러도 로그도 없다.
①이 아무리 정상이어도 화면은 **빈 값**을 받는다.

| 끊긴 구간 | 결과 | 등급 |
|---|---|---|
| ② 없는데 ③ 읽음 | **항상 빈 값** → 옵션 분기가 의도와 다르게 흐름 | 🔴 치명 |
| ① 없는데 ② 선언 | 항상 빈 값 | 🟠 주의 |
| ① 있는데 ② 없음(③도 없음) | 값이 버려짐 | ⚪ 무해(정리 대상) |
| ①② 있는데 ③ 없음 | 미사용 컬럼 | ⚪ 무해(정리 대상) |

## 10.2 점검 도구

```bash
bash docs/OTAT/opt_pipeline_scan.sh
```
접수 화면과 승인팝업의 세 구간 차집합을 출력한다. **새 옵션을 붙이거나 화면을 리팩토링한 뒤 반드시 실행.**

**2026-08-05 기준 결과**

| 화면 | ① SQL | ② 선언 | ③ JS | 🔴 치명 | 비고 |
|---|---|---|---|---|---|
| 접수 `SfasRegAtRiskasmtRcpt` | 29 | 29 | 29 | **0** | 완전 일치 |
| 승인팝업 `SfasPopRegRiskAssessmentConfirm` | 30 | 20 | 20 | **0** | 버려지는 10종은 무해(아래) |

> 팝업에서 버려지는 10종(무해·정리 대상): `041` `042` `048_001_001` `048_001_002` `053` `053_001` `059` `074` `088` `095`

---

# 11. 결측(빈 값) 동작 사양 — **어느 쪽으로 기우는가**

옵션이 빈 값일 때 **비교 패턴이 결과를 결정한다.** 이게 위험 등급을 가른다.

| 비교 패턴 | 빈 값일 때 | 성격 | 예 |
|---|---|---|---|
| `x == "T"` | false → **기능 꺼짐** | **fail-closed** (안전) | `060`, `092`, `060_002`, `060_003` 등 대다수 |
| `x != "T"` | true → **조건 통과** | **fail-open** ⚠ | 접수 승인게이트의 `060_002 != "T"` |
| `x == "A"` (다상태) | false → **검증 수행** | **fail-open** ⚠ (의도 반대) | 팝업의 `060_001 === "A"` |
| `["A","P"].includes(x)` | false → 분기 미적용 | fail-closed | `048_001_001` |

## 11.1 ⚠️ 다상태 옵션 — 파이프라인이 끊기면 **동작이 뒤집힌다**

T/F가 아닌 값을 갖는 옵션은 빈 값이 "꺼짐"으로 해석되지 않는다. **DB 실측(PMIS4, 전 현장)**:

| 옵션 | 값 분포 | 의미 | 위험 |
|---|---|---|---|
| `SFAS_OPT_060_001` | **A** 6,138 / **B** 157 / **C** 4 / null 0 | A=검증안함, B=전항목, C=중점만 | 🔴 빈 값이면 "A 아님" → **검증을 수행**하게 됨 |
| `SFAS_OPT_048_001_001` | A 6,283 / P 1 / **null 15** | 추가도출 작성주체 | 🟡 `includes` 비교라 fail-closed |

> `== "T"` 옵션은 파이프라인이 끊겨도 **조용히 꺼질 뿐**이다. 위 두 개는 등급이 다르다.
> **새 다상태 옵션을 추가할 때는 §10.2 스캔을 반드시 통과시킬 것.**

## 11.2 참고 — 옵션 자체가 null인 현장

`SFAS_OPT_060`이 null인 현장 **15곳** 실재(전체 6,299곳 중). `== "T"` 비교라 F로 취급되어 무해하다.
→ **null 현장이 존재한다는 사실 자체가, fail-closed 비교를 기본으로 써야 하는 이유다.**

---

# 12. 승인 검증 게이트 진리표

## 12.0 전제 — `060`과 `060_003`은 상호배타 (DB 실측 확인)

| `060` | `060_003` | 현장수 | 워크플로우 |
|---|---|---|---|
| (null) | F | 15 | 승인 없음 |
| F | F | 6,127 | 승인 없음 |
| T | F | 155 | **레거시 060 승인** |
| F | T | 2 | **SCNT 승인** |
| T | T | **0건** | — (조합 없음) |

→ **두 워크플로우는 동시에 성립하지 않는다.** 따라서 진리표도 둘로 나눈다.

## 12.1 레거시 060 승인 (`060=T`) — 접수 화면 승인 버튼

`scwin.wbtnApprv_onclick_callback` (wqxml 3977)
```js
if((092 == "F" && 060_001 == "A") || (092 == "T" && 060_002 != "T")) {
    scwin.executeApprv();          // 검증 없이 즉시 승인
} else {
    → selectCdRvwOpChk 조회 → chkCmtContList() 로 판정
}
```

| `092` | `060_001` | `060_002` | 동작 | 검증 |
|---|---|---|---|---|
| F | **A** | - | 즉시 승인 | 없음 |
| F | B | - | 서버 조회 → 판정 | **전 항목** 의견 필수 |
| F | C | - | 서버 조회 → 판정 | **중점(PRIORITY='O')만** 필수 |
| T | - | **≠T** | 즉시 승인 | 없음 |
| T | - | **T** | 서버 조회 → 판정 | **항목별 의견 검증**(⚠ 아래) |

> ⚠️ **의문점(미해결)**: `092=T`(종합검토의견 사용)면 항목별 의견 대신 **종합의견**을 쓰는 게 설계 의도인데,
> 레거시 경로는 `092=T && 060_002=T`에서 **항목별 의견을 검증**한다. 종합의견만 쓰는 현장이라면 항목별 의견이 없어 막힐 수 있다.
> → **해당 조합 현장에서 실동작 확인 필요.** (`092=T` 51곳 · `060_002=T` 165곳)

**판정 주체**: `chkCmtContList`(4070~)는 **승인자 역할별**로 본다 — 공사팀장이면 `CHK1`, 안전팀장이면 `CHK2` 한쪽만.

## 12.2 SCNT 승인 (`060_003=T`) — 승인팝업 **승인요청** 시점

`fnRunAction("request")` → `fnValidateSynthOp` → `fnValidatePerItemCmt`

| 게이트 | 조건 | 동작 |
|---|---|---|
| 종합의견 (`fnValidateSynthOp`) | `092=T && 060_002=T` **일 때만** 검증 | `SYNTH_CONSTR_OP`·`SYNTH_SAF_OP` 둘 다 있어야 통과 |
| 항목별 (`fnValidatePerItemCmt`) | `092=T` **또는** `060_001='A'` 이면 **스킵** | 그 외엔 서버 `selectCdRvwOpChk` 조회 |

| `092` | `060_001` | `060_002` | 종합의견 검증 | 항목별 검증 | 검증 상태 |
|---|---|---|---|---|---|
| F | **A** | - | 없음 | **스킵** | ✅ 실동작 확인(2026-08-05) |
| F | B | - | 없음 | 전 항목 | ⬜ 미검증 |
| F | C | - | 없음 | 중점만 | ⬜ 미검증 |
| T | - | T | **수행** | 스킵 | ⬜ **미검증 — 코드상 이렇게 동작해야 함** |
| T | - | F | 없음 | 스킵 | ⬜ 미검증 |

> **판정 주체**: 승인**요청** 시점이라 승인자 역할이 없다 → `CHK1`/`CHK2` 분기 없이 **한쪽이라도 비면 차단**(쿼리가 `CHK1 < 1 Or CHK2 < 1`로 걸러 보냄).
> 레거시(12.1)의 역할별 판정과 **의도적으로 다르다** — 시점이 다르기 때문.
> 승인요청 시점엔 승인자 역할이 없으므로 건수 분기 없이 반환 유무로만 판정한다(커밋 `98f42b62a`, 2026-08-04 서버 일원화). 검증 시나리오는 [종합테스트_시나리오 S3-4](../종합테스트_시나리오.md).

## 12.3 검증 이력

| 조합 | 확인일 | 결과 |
|---|---|---|
| SCNT · `092=F` · `060_001=A` | 2026-08-05 | ✅ 통과(사고 수정 후 정상) |
| 그 외 전 조합 | — | ⬜ **미검증** |

---

# 13. 사고 기록 — 2026-08-05 승인팝업 오차단

**증상**: `060_001='A'`(검증 안 함) 현장인데 승인요청이 차단됨.

**경로**:
```
selectCdOpt 는 SFAS_OPT_060_001 을 정상 출력 (팝업 SQL 37행)
  → wdlCdOpt 에 컬럼 선언 없음        ← 끊긴 구간
  → getCellData 가 빈 값 반환
  → oOptConfig.bUseOpt060001 ≠ "A"
  → 단축 통과 불발 → 서버 검증 진행
  → #{SFAS_OPT_060_001} 도 빈 값 → 쿼리의 != 'C' 참 → 전 항목 검사
  → 검토의견 없는 상세 10건 적발 → 차단
```

**실측 근거** (PMIS4 · `30212/GC001/9009`): 옵션 `060_001=A`, 상세 13건 중 **10건이 공사·안전 의견 0건**(중점 1건 포함).

**조치**: `wdlCdOpt`에 `SFAS_OPT_060_001` 컬럼 추가 + §10.2 스캔 신설 + `websquare.md` 표준에 "컬럼 선언 누락 = 값 소실" 규칙 추가.

**왜 기존 문서로 못 막았나**: §1~§9는 옵션의 **의미와 화면 효과**를 다뤘지만, **값의 전달 경로**는 어느 문서에도 없었다. 옵션 로직이 아무리 잘 정리돼 있어도 값이 도달하지 못하면 소용없다.
