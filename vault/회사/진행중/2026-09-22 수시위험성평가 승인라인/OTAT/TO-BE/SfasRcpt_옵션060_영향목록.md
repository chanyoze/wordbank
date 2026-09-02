---
title: "SfasRegAtRiskasmtRcpt — `SFAS_OPT_060=T` 활성 항목 전수 목록"
sidebar_label: "접수화면 060 seam"
sidebar_position: 5
date: 2026-08-28
kind: 갱신
raw: "RAW-DOC:cip-defg-saas/OTAT/TO-BE/SfasRcpt_옵션060_영향목록.md"
---

# SfasRegAtRiskasmtRcpt — `SFAS_OPT_060=T` 활성 항목 전수 목록

> **목적**: 신규 옵션 `SFAS_OPT_060_003`(SCNT 표준승인) 도입 시, 기존 결재(060=T)에서만 켜지는 컬럼·로직을 **비활성화 / SCNT 분기로 교체**해야 하는 지점을 미리 카탈로그화.
>
> **전제(상호배타 D11)**: `060_003=T`이면 `060=F`로 저장 → 아래 모든 `bUseOpt060`/`SFAS_OPT_060=='T'` 분기는 **자동으로 "else(비승인)" 경로로 빠짐**. 단, else 경로는 "승인 없음(접수/20)"이라 **SCNT가 원하는 상태가 아님** → 각 항목은 **SCNT 로직이 끼어들 seam(이음매)**. "060=T 분기 죽이기"만으로는 부족하고, 그 자리에 `060_003=T` SCNT 경로를 넣어야 함.
>
> 📌 **상호배타는 DB 실측으로 확인됨**(2026-08-05, PMIS4 전 현장): `060=T/060_003=T` 조합 **0건**. 분포는 [옵션전수 §12.0](./SfasRcpt_옵션전수_화면제어.md#120-전제--060과-060_003은-상호배타-db-실측-확인).
> 📌 **옵션 파이프라인·결측 동작·승인 게이트 진리표**: [옵션전수 §10~§13](./SfasRcpt_옵션전수_화면제어.md#10-옵션-전달-파이프라인--값이-화면까지-오는-경로-2026-08-05-신설)
>
> 중앙 플래그: `scwin.oOptConfig.bUseOpt060`(= `SFAS_OPT_060=='T'`, "승인프로세스 사용여부") — [2132](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L2132)

---

> 🔗 **컬럼 축 교차검증**: [컬럼표시_화면대조.md](../컬럼표시_화면대조.md) — 아래 조건들이 승인 팝업에서도 같은지 대조한 표.

---

## A. 컬럼 표시(Visible) — `columnVisibleControl` (4189~)

| 컬럼 | 규칙 | 060=T 효과 | 참조 |
|---|---|---|---|
| `C_USER_NM`(작성자) | `!bUseOpt060` | **숨김** | [4191](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L4191) |
| `APPRV_C_USER_NM`(공사팀장) | `bUseOpt060` | **표시** | [4192](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L4192) |
| `APPRV_BD_USER_NM`(안전팀장) | `bUseOpt060` | **표시** | [4193](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L4193) |
| `APPRV_A_USER_NM`(현장소장) | `bUseOpt060` | **표시** | [4194](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L4194) |

→ 승인선(공사팀장/안전팀장/현장소장) 3컬럼이 060=T 전용. SCNT는 승인선을 SCNT STEP로 관리 → 이 3컬럼 표시 방식 재검토(승인패널로 이전 or 유지).

## B. 컬럼 ReadOnly / 클래스 — `gridMainControl` (4332~)

| 컬럼 | 규칙 | 참조 |
|---|---|---|
| `SYNTH_CONSTR_OP`(공사팀의견) | `readOnly = bUseOpt060` (060=T면 본문에선 잠금, 승인단계에서만 입력) | [4388](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L4388) |
| `SYNTH_SAF_OP`(안전팀의견) | `readOnly = bUseOpt060` | [4389](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L4389) |
| `C_USER_NM` | `readOnly = bUseOpt060` | [4391](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L4391) |
| `APPRV_C_USER_NM` | `readOnly = !bUseOpt060 \|\| APPRV_C_TF=='T'` | [4392](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L4392) |
| `APPRV_BD_USER_NM` | `readOnly = !bUseOpt060 \|\| APPRV_BD_TF=='T'` | [4393](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L4393) |
| `APPRV_A_USER_NM` | `readOnly = !bUseOpt060` | [4394](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L4394) |
| `APPRV_CMT`(승인의견) | `readOnly = (!bUseOpt060 && bEditImpsbl) \|\| (bUseOpt060 && STTS_CD!='20')` | [4395](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L4395) |
| `APPRV_C/BD/A_USER_NM` notnull class | `STTS_CD!=20 && bUseOpt060` → `cipc-notnull` | [4364-4368](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L4364-L4368) |

## C. 필수값(NotNull) — `optControl` (4261~)

| 대상 | 규칙 | 참조 |
|---|---|---|
| wgrdMain 추가필수 = `APPRV_C_USER_NM, APPRV_BD_USER_NM, APPRV_A_USER_NM` | `if(bUseOpt060)` | [4261-4263](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L4261-L4263) |

→ 060=T면 승인선 3명 지정이 저장 필수. SCNT는 승인선 유효성을 SCNT USETGT/LINE에서 검증 → 이 notnull 규칙 제거/대체.

## D. 상태코드(STTS_CD)·상태명(STATUS) 부여 — 승인 여부로 분기

| 지점 | 060=T | 060=F(else) | 참조 |
|---|---|---|---|
| 추가(add) 시 | STATUS=`공사팀장승인대기`, STTS_CD=`30` | `접수`, `20` | [1407-1408](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L1407-L1408) |
| 접수전송(send) 시 | STTS_CD=`30` | `20` | [3299](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L3299) |
| 추가 시 승인선 컬럼 세팅 | `APPRV_C/BD/A_USER_NO/NM` + `APPRV_*_TF='F'` (프로젝트권한 wdlProjAuth에서) | 동일하게 세팅되나 무의미 | [1416-1424](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L1416-L1424) |

→ ~~**SCNT seam 핵심**: 이 자리에서 060_003=T면 SCNT 초기상태(STS_CODE=10/20 + DEM 생성)로 분기. else(비승인) 경로로 두면 SCNT 현장이 "접수/20"에 머물러 승인이 안 걸림.~~

> ### ✅ 검증 완료 (2026-07) — **위 우려는 outdated. §D seam 은 사실상 해소됨**
> 위 문장은 SCNT 흐름이 완성되기 **전**에 쓴 예측이었다. 현재 코드로 전수 재확인한 결과:
>
> | 확인 항목 | 실제 (2026-07 코드) |
> |---|---|
> | 접수전송·취소 경로 | SCNT 는 `wbtnSend_onclick`·`wbtnCancel_onclick` **선두 early return 으로 차단**([3397·3446](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml)) → send 경로가 SCNT 엔 **해당 없음** |
> | `STTS_CD=20` 방치 시 표시 | STATUS Case 가 `060_003='T'→'작성중'` 을 **접수/미접수보다 먼저** 판정 → 정상 |
> | 편집 가능 여부 | `EDIT_TF` 가 `060_003='T'→'T'` → **편집 허용** 정상 |
> | 승인 진행 가능 여부 | 팝업이 `fnIsScntRow` 로 정상 진입 → **승인 정상 진행**("승인이 안 걸림"은 사실 아님) |
>
> **실제로 남아 있던 갭은 라벨 하나뿐** — 평가서 추가 직후 클라이언트가 STATUS 를 `'접수'` 로 세팅해 **저장·재조회 전까지만** 불일치. → **2026-07 수정 완료**(SCNT 면 `'작성중'` 세팅, 재조회 SQL 값과 일치).
>
> ⚠️ **하지 말 것**: SCNT 라고 `STTS_CD` 에 **30~60 을 주면 안 된다.** 소급 판별(STTS 30~60 = 무조건 레거시)이 그 회차를 레거시로 오인해 SCNT 흐름이 깨진다 → **`20` 유지가 정답**.
> ⚠️ 원안의 *"STS_CODE=10/20 + DEM 생성"* 표현도 현행과 다름 — 실제 상태 컬럼은 **`CFM_STS_CODE`**(REG/DEM/PROG/REJ/CMPL)이고, DEM 생성은 **승인 팝업의 저장(`createDemand`)** 시점이다.

## E. 승인 액션 서브시스템 (060=T 전제로만 동작)

| 구성 | 설명 | 참조 |
|---|---|---|
| 승인/승인취소 버튼 노출 | `rBtnCstCtr`: `wbtnApprv`←`APPRV='T'`, `wbtnApprvCnc`←`APPRV_CNC='T'`. 이 컬럼은 **SQL이 `SFAS_OPT_060='T'`일 때만 T 산출**(SfasRegAtRiskasmtRcptSql 643~710) | [1023-1024](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L1023-L1024) |
| 승인 클릭 | `wbtnApprv_onclick` → 검토의견 게이트 → `executeApprv` or `wsmTrscCmtCont` | [3796](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L3796), [3980-3992](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L3980-L3992) |
| 승인 실행 | `executeApprv` → `wdmTrscApprv`(TAG=APPRV) → `wsmTrscApprv`(`/trscApprv.do`) | [4129](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L4129), [834](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L834) |
| 승인취소 | `wbtnApprvCnc_onclick` → `wbtnApprvCnc_onclick_callback`(TAG=CANCEL) | [3965](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L3965), [4016](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L4016) |
| 승인의견 팝업 | `SfasPopRegConfirmOpinion` | [3942](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L3942), [3959](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L3959) |
| 상태별 수정불가 안내 | `scwin.sMsg`(STTS_CD 40/50/60) | [4139-4151](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L4139-L4151) |

→ 전체를 **SCNT 승인패널(`cips.sanction.request/act/cancel` + `CommonSanctionPanel`)로 대체**. 060_003=T면 이 레거시 버튼군 대신 SCNT 패널 노출.

## F. 수정/삭제/순서변경 잠금 — `060=T && EDIT_TF=F` (승인 진행중 잠금)

> ### ✅ 조치 완료 (2026-07-24) — 공통 판정 `scwin.fnCheckEditLock` 으로 통일
> 아래 표는 **조치 전 상태**의 기록이며, 라인번호도 그 시점 기준이라 현행과 어긋난다. 현행은 이 박스를 본다.

### F-0. 재검증 결과 — SQL 은 이미 SCNT 대응 완료, 구멍은 **화면 게이트에만** 있었다

`EDIT_TF` 산출 SQL([SfasRegAtRiskasmtRcptSql.xml](../../src/main/resources/sqlmap/mappers/sfas/SfasRegAtRiskasmtRcptSql.xml) `selectLstMain`, "수정가능여부" Case)은 **회차 궤도별로 이미 정확**했다.

| 판정 순서 | 조건 | EDIT_TF |
|---|---|---|
| 1 | `STTS_CD = '30'` | `T` |
| 2 | `STTS_CD In ('40','50','60')` | 자기 차례 결재자만 `T` |
| 3 | `CFM_DEM_SN` 있음 + `CFM_STS_CODE In ('DEM','PROG','CMPL')` | **`F`** ← SCNT 잠금 |
| 4 | `CFM_DEM_SN` 있음 (REG·REJ) | `T` ← 요청취소·반려하면 재편집 허용 |
| 5 | `SFAS_OPT_060_003 = 'T'` (무라인) | `T` ← 작성중 |
| 6 | `CHECK_TF = 'F'` | `F` (레거시 미접수) |

**진짜 문제**: 화면 게이트가 전부 아래 모양이라, SCNT 현장(`060 = F`)에서는 `EDIT_TF='F'` 를 받고도 **if 안으로 들어가지 못해 그냥 통과**했다.

```js
} else if(EDIT_TF == "F") {
    if(SFAS_OPT_060 == "T") {   // ← SCNT 현장은 060 = F 라 여기서 빠져나감
        cips.msg.info(scwin.sMsg(...));
        return false;
    }
}                                // ← 아무것도 안 하고 통과 = 잠금 무력화
```

셀 readOnly(`bEditImpsbl`)는 `EDIT_TF` 만 보므로 정상 동작했다. **그래서 "칸은 잠기는데 추가·삭제·순서변경·일괄수정은 다 되는" 상태**였다.

### F-1. 조치 — 옵션을 보지 않고 `EDIT_TF` 만 본다

| 신설 함수 | 역할 |
|---|---|
| `scwin.fnCheckEditLock(anRowIdx)` | 잠금 판정 **단일 지점**. `EDIT_TF != 'F'` 면 `true`, 잠겼으면 안내 후 `false`. **옵션을 보지 않는다** |
| `scwin.fnEditLockMsg(anRowIdx)` | 안내 문구만 궤도별 분기. SCNT(`fnIsScntRow`)면 `CMPL`→"승인완료 상태…" / 그 외 단계·대기자 안내, 레거시면 기존 `sMsg` (빈 문자열이면 일반 문구로 폴백) |

**배선한 지점 (5곳)** — 모두 `if(!scwin.fnCheckEditLock(...)) return false;` 한 줄로 통일

| 지점 | 함수 |
|---|---|
| 추가/삽입 | `cips.dd.event.commonTrigger.addAndIns.onClickBefore` |
| 삭제 | `scwin.deleteCommonCondition` |
| 순서변경(up/down) | `scwin.upAndDown_onValidationAfter_callback` |
| 일괄수정 진입 | `scwin.wbtnBdlUpdAll_onclick` |
| 일괄수정 대상검증(단건) | `scwin.wbtnBdlUpd_onclick` 의 `rRows.forEach` |

**부수 조치**

- `upAndDown_onValidationAfter_callback` 이 통과 시 `undefined` 를 반환하던 것 → **`true` 명시**. (`cips.js` 규약은 *"false 가 리턴되면 이후 행위 취소"* 라 동작은 같지만 의도가 드러나지 않았음)
- 일괄수정 다건 경로(*"선택한 내용 중 승인 내역이 있어…"*)는 원래부터 옵션 무관이라 **손대지 않음**.
- **일괄수정(MAIN) 버튼은 SCNT 현장에서 감춘다** — 아래 F-1-1.
- **일괄수정 팝업 높이**(060=T:290 / else:225) · **파라미터** · **콜백** · **팝업 파일 자체**는 **전부 미변경**. 버튼을 감춰 도달하지 않으므로 팝업에 SCNT 분기를 넣지 않았다.
- `D_GB_CD`/`E_GB_CD`(안전팀장·현장소장) 블록도 미변경 — 팝업이 060=F 에서 해당 그룹을 이미 숨겨 `"B"` 가 나올 수 없다.

### F-1-1. 일괄수정(MAIN) — SCNT 에서 버튼 감춤

**팝업 전수 확인 결과**: `SfasPopRegAssesmentApplyAll` 의 `GB_CD="MAIN"` 분기는 나머지 행을 전부 `display:none` 으로 끄고 **사람 지정 3행만** 남긴다.

| 옵션 | 남는 입력행 | 팝업 높이 |
|---|---|---|
| `060=T` | 공사팀장 · 안전팀장 · 현장소장 (승인선 지정) | 290 |
| `060=F` (SCNT·미사용 공통) | **공사팀장 지정(`C_USER`) 1행** | 225 |

SCNT 는 `C_USER_NM` 을 **목록에서도 숨기므로**(`!060 && !060_003`) 지정할 대상이 0개다. → **버튼 자체를 감추는 것**이 정답.

| 지점 | 처리 |
|---|---|
| `scwin.optControl` | `wbtnBdlUpd.setStyle("display", bUseOpt060003 ? "none" : "")` — `wbtnRankStdd`·`wcpntGrpGrdCmt` 와 같은 방식 |
| `scwin.wbtnBdlUpd_onclick` 선두 | `if(bUseOpt060003 === true) return;` — **단축키 `M`([rCustomShortcutKey](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L1051)) 방어**. `wbtnSend`(1)·`wbtnCancel`(2) 과 동일 패턴 |

**메시지는 띄우지 않는다** — 버튼이 안 보이는 게 정상 상태이므로 안내할 대상이 없다. (`{sKey:'M'}` 은 권한 매핑이 아니라 단축키 매핑이므로 `setStyle` 로 감춰도 권한 제어와 충돌하지 않는다.)

⚠️ **조사 중 확인한 죽은 코드**: 호출부 콜백([SfasRegAtRiskasmtRcpt.xml](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml)) 의 `J_GB_CD`·`STAN_MONTH_CD`·`MNG_DATE_*`·`APPRV_CMT_CD`·`Q_USER_CMT_CD`·`R_USER_CMT_CD`·`J_USER_CMT_CD` 분기는 **이 팝업이 반환하지 않는 키**다(팝업 `popChoice.onClickBefore` 반환 객체 전수 확인). 원래부터 죽은 코드이며 이번엔 손대지 않았다.

> 참고 — 이 팝업(MAIN)에는 **현장소장의견·검토의견 같은 의견 항목이 아예 없다.** 혼용(레거시+SCNT) 시 의견 컬럼을 어떻게 보여줄지는 **외곽 그리드**의 문제이고, `APPRV_CMT` 는 이미 presence 기반(`060 || bHasLegacy`)으로 처리돼 있다([SoT §6](../현행/SCNT_구현방식_공유.md)).

### F-2. ✅ 해결 (2026-07-28) — 승인 미사용 현장은 레거시 워크플로우 원복

**발견된 회귀**: SCNT 재작성이 STATUS·EDIT_TF Case 에서 `SFAS_OPT_060='T'` 가드를 제거(소급유지 목적)하면서, **승인 아예 안 쓰는 현장(`060=F && 060_003=F`)의 레거시 잔여 회차(`STTS_CD` 30~60)** 까지 승인 상태명·잠금이 되살아났다.
- 예: HT0001(둘 다 F) 2025-07 회차 → 개발서버(옛 코드)는 **접수·편집가능**인데 로컬(신 코드)은 **현장소장승인대기·잠김**.

**이식 전 실동작 확인**: 레거시 전용 시절 STATUS·EDIT_TF 는 **조회 시점의 현재 `060` 값으로 즉석 계산**했다 — `060` 을 끄면 STTS 무시하고 즉시 접수·편집가능으로, 켜면 복귀(STTS_CD 데이터는 보존). **레거시엔 표시/잠금 소급유지가 애초에 없었다.**

**결정(인터뷰 2026-07-28)**:
- `사용안함 ↔ 060=T` : **레거시 워크플로우 그대로** (옵션 토글 즉시 반영, 소급유지 아님)
- `060 ↔ 060_003`, `사용안함 ↔ 060_003` : **소급유지** (SCNT 회차는 CFM 유무로 항상 유지)

**조치**: [selectLstMain](../../src/main/resources/sqlmap/mappers/sfas/SfasRegAtRiskasmtRcptSql.xml) STATUS(레거시 4분기)·EDIT_TF(`STTS In ('40','50','60')` 분기)에 **`(SFAS_OPT_060='T' Or SFAS_OPT_060_003='T')` 가드 복원**. 승인엔진이 하나라도 켜진 현장만 레거시 상태/잠금, 둘 다 F면 접수/편집가능으로 롤백. CFM(SCNT) 분기는 가드 없음(항상 유지).

**DB 검증**(배포 전, 실데이터에 Case 직접 실행): HT0001 STTS 40~60 **전부 '접수'**, A0001·GC001(060_003=T) 소급유지 **그대로**, K001(060=T) 레거시 **그대로**. → **오직 both-off 현장만 변화, 승인 사용 3현장은 무영향.**

전수 감사 결과 **깨진 지점은 STATUS·EDIT_TF 둘뿐**이었고(나머지 060 지점 12곳은 both-off 에서 이미 옛 동작), JS 잠금(`fnCheckEditLock`)·readOnly 는 EDIT_TF 를 읽으므로 자동으로 따라온다.

---

<details>
<summary>조치 전 기록 (라인번호는 2026-07 이전 기준 — 현행과 어긋남)</summary>

| 지점 | 동작 | 참조 |
|---|---|---|
| 추가/삽입 전 | 060=T면 `sMsg` 안내 후 차단 | 1363-1366 |
| 삭제 조건 | `bUpdImpsbl && bUseOpt060` → 차단 | 1815, 1824-1831 |
| 순서변경(up/down) | 060=T면 차단 | 1874-1877 |
| 일괄수정(BdlUpdAll) 진입 | 060=T면 차단 | 3401-3404 |
| 일괄수정(Main) 대상 검증 | 060=T면 차단 | 3609-3613 |
| 일괄수정 팝업 높이 | 060=T=290 / else=225 | 3619-3623 |
| 일괄수정 파라미터 | `SFAS_OPT_060` 팝업 전달 → `SfasPopRegAssesmentApplyAll`도 060 분기 | 3640 |
| 일괄수정 콜백 | 060=T면 `APPRV_C_USER_*` 세팅 / else `C_USER_*` | 3654-3664 |

→ SCNT는 "잠금" 여부를 DEM 진행상태로 판단해야 함. `EDIT_TF`/`sMsg`(APPRV_BD/A_USER_NM 참조)를 SCNT 단계정보 기반으로 교체.

</details>

## G. 검토의견 필수 게이트 (승인 직전) — 060_001/060_002/092 연동

| 지점 | 규칙 | 참조 |
|---|---|---|
| 승인 시 게이트 | `(092=F && 060_001=='A') \|\| (092=T && 060_002!='T')` → 바로 승인 / else 검토의견작성 요청(`wsmTrscCmtCont`) | [3982-3991](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L3982-L3991) |
| 종합검토의견 검증파라미터 | `SMR_CFM_OP_VER_TF: SFAS_OPT_060_002` | [3937](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L3937), [3954](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L3954) |

→ 계획 A3/A5: **검토의견 필수검증을 SCNT `validateBeforeDemand`(요청 전 게이트)로 이전**. 060_003=T면 060_001/060_002 무의미(admin에서 readonly) → 이 게이트는 SCNT 검증으로 대체.

---

## 요약 — 060_003 도입 시 처리 원칙

1. **자동 무력화(별도 작업 불필요)**: A~G의 `060=T` 분기는 060=F가 되면 자동으로 안 탐. 레거시 승인 컬럼·버튼·잠금이 사라짐. ✅
2. **반드시 SCNT 분기 삽입(seam)**: D(상태부여)·E(승인액션)·F(잠금판단)·G(검토의견게이트)는 else 경로가 "비승인"이라 **SCNT 경로를 새로 넣어야** 함. 안 넣으면 SCNT 현장이 승인 없는 "접수/20"에 방치됨.
   - **D ✅ 해소**(§D 검증박스) · **F ✅ 조치완료**(§F-1 `fnCheckEditLock`) · E·G 는 승인패널/FE 게이트로 처리 — 진행 현황은 [SoT §6](../현행/SCNT_구현방식_공유.md) 이 단일 기준.
3. **컬럼 재배치(A/B/C)**: 승인선 3컬럼(APPRV_C/BD/A_USER_NM)·의견 컬럼은 SCNT 승인패널로 이전할지, 그리드에 유지할지 결정 필요.
4. **SQL 연동**: 버튼 노출 컬럼 `APPRV`/`APPRV_CNC`(SfasRegAtRiskasmtRcptSql 643~710)도 `060='T'` 기준 → SCNT는 이 산출식을 `060_003` 대응으로 확장 or SCNT 패널로 대체.

> Sub(협력사) 화면 `SfasRegAtRiskasmtSub.xml`도 동일 패턴 예상 — 별도 목록 작성 예정.
