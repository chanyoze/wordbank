---
title: "협력사(Sub) 화면 SCNT 배선 — 착수 계획"
sidebar_label: "협력화면 배선"
sidebar_position: 7
date: 2026-09-02
kind: 갱신
raw: "RAW-DOC:cip-defg-saas/OTAT/TO-BE/TODO_협력화면_SCNT배선.md"
---

# 협력사(Sub) 화면 SCNT 배선 — 착수 계획

> 작성 2026-07-21 / 개정 2026-08-18 (이찬호)
> 대상: `SfasRegAtRiskasmtSub` (상시·수시위험성평가서제출, **협력사 전용 메뉴**)
> 관련: [SCNT_구현방식_공유.md](../현행/SCNT_구현방식_공유.md) · 참고 선례 `CescPopRegCooperationEquipmentSafetyCheck`

## 0. 2026-08-18 설계 변경 — 승인자 지정 가능 ⚠️

**[supersede] 아래 "유의점 1. 협력사는 승인라인 설정 불가 → 읽기전용" 은 폐기한다.**
협력사는 **승인라인의 사람(승인자)을 지정할 수 있다.** 단계 구성 자체는 시스템 기본라인 고정.

근거 — CESC 선례가 같은 반전을 이미 겪었다:
- `CescPopRegCooperationEquipmentSafetyCheck.xml:351` 변경이력 `2026-03-09 / 김은정 / 한화오션(주) / 장비안전점검제출 승인자 지정 가능하도록 수정`
- 같은 화면 `oNotNullColumns: ["SANCTNER_USER_NAME"]` + `oReadOnlyColumns: ["VER_NO","STEP_SECT_NAME","STEP_NAME","ARB_DECIS_TF","ACT_NAME","SANCTN_DT","SANCTN_OP"]`
  → **단계는 잠그고 승인자 셀만 편집 허용**

**협력사가 할 수 있는 것 / 없는 것**

| | 협력사(Sub) | 원청(Rcpt) |
|---|---|---|
| 승인라인 승인자 지정 | ✅ | ✅ |
| 승인요청 / 요청취소 | ✅ | ✅ |
| 승인 · 반려 · 승인취소 | ❌ | ✅ |

## 1. 조사 결과 — 이미 되어 있는 것 (2026-08-18 확인)

착수 전 예상보다 인프라가 많이 깔려 있다. **신규로 만들 게 아니라 배선만 하면 되는 항목**:

| 항목 | 상태 | 근거 |
|---|---|---|
| REGIS 쪽 승인상태 컬럼 | **있음** — `TSF_ASSMNT_REGIS` 에 `CFM_COMPANY_ID`·`CFM_PROJ_CODE`·`CFM_DEM_SN`·`CFM_STS_CODE` 4종(PMIS4) | DB 조회 |
| REGIS 에 상태 기록 | **있음** — OTAT handler 가 `updateCfmReceive`(원청) + `updateCfmRegis`(협력) 양쪽 기록 | `SfasAtRiskasmtSanctionHandler:92-93` |
| 권한 훅 | **있음** — `canView(amKeys)` | 같은 handler:103 |
| 승인 버튼 제한 | **코드 불필요** — 아래 §2 | |
| 승인자 지정 → 요청 전 라인 저장 | **있음** — 그리드가 저장 후 새 `DEM_SN` 을 부모에 콜백 | `SfasPopRegRiskAssessmentConfirm.xml` `fnOnSaved(sDemSn)` |
| 공통 승인 wframe | **있음** — `CommonWFrameSanctnGrid.xml` · `CommonWFrameSanctnButton.xml` | `wqxml/common/` |
| JS API | **있음** — `cips.sanction.{save,update,request,act,cancel,loadStatus,loadStdStep,changeLine}` | `js/sanction/cips_sanction.js` |

## 2. 승인/반려 버튼 차단은 추가 코드가 필요 없다

`CommonWFrameSanctnButton.xml` 은 **deny-by-default** — `oFlags[sPsblTf] === "T"` 인 버튼만 노출한다(:218).
그 플래그는 서버가 만들고, **승인 계열 3종은 세션 사용자가 해당 단계의 승인자/대리인일 때만 'T'** 다.

`CommonSanctionSql.xml` 의 플래그 서브쿼리는 `TR_STEP` 을
`a.SANCTNER_USER_NO = #{SESSION_USER_NO} Or Exists(… AGT_USER_NO = #{SESSION_USER_NO})` 로 먼저 걸러낸다(:646-658).

| 버튼 | 플래그 | 산출 방식 | 협력사에서 |
|---|---|---|---|
| 승인 `wbtnSanctnAct` / 반려 `wbtnSanctnRej` | `SANCTN_PSBL_TF` | 세션=현단계 승인자 | **자동 F** |
| 승인취소 `wbtnSanctnCanc` | `CANC_PSBL_TF` | 세션=처리한 승인자 | **자동 F** |
| 요청취소 `wbtnSanctnDemCanc` | `DEM_CANC_PSBL_TF` | 세션=DEM 단계 처리자 | 본인이 요청했으면 **T** ✅ |
| 요청 `wbtnSanctnReq` | `DEM_PSBL_TF` | `Decode(STS_CODE,'REG','T','REJ','T','F')` — **신분 무관** | REG/REJ 면 T ✅ |

→ 협력사에게는 **요청 · 요청취소만** 자동으로 뜬다. `bHideAllBtn` 이나 협력사 전용 플래그를 새로 만들 필요 없음.
→ 반려(REJ)에서도 `DEM_PSBL_TF='T'` 라 **재요청**이 자연히 된다(반려=같은 평가서 재요청 모델과 일치).

## 3. 남은 핵심 난점 — REGIS/RECEIVE 이중 테이블

| | CESC | 위험성평가 |
|---|---|---|
| 테이블 | **단일** TCESC_EQUIPCHK | **이중** TSF_ASSMNT_REGIS(협력) + TSF_ASSMNT_RECEIVE(원청) |
| 협력 승인요청 | actSanction + 상태변경 끝 | actSanction + **REGIS→RECEIVE Merge 필수** |

CESC 는 같은 행이라 협력 요청 시 원청이 바로 본다. 위험성평가는 물리적 별도 행이라 **복사 안 하면 원청 목록에 안 뜬다.**
레거시에선 `updateSend`(제출)가 이 Merge 를 했다. SCNT 에선 제출=승인요청이므로 **Merge 가 승인요청 흐름에 붙어야 한다.**

**Merge 위치 = (나) Sub 서비스 오케스트레이션** (2026-07 결정 유지)
CESC `CescPopRegCooperationEquipmentSafetyCheckServiceImpl.trscSubmit` 이 `cfmService.actSanction()` + `mapper.trscUpdSts()` 를 서비스에서 순서 조합하는 선례를 따른다.
- handler 무변경 (CFM_* 기록만 담당 — 관심사 분리)
- 복사 로직은 `updateSend` 원위치 유지 (이중관리 없음)
- (가) handler 에 Merge = 협력/원청 공용이라 조건분기 → 비채택 / (다) 복사 프로시저 추출 = 지금은 과함

**흐름**
```
[레거시 현장]  제출 버튼      → updateSend (기존 그대로, 변화 0)
[SCNT 현장]    승인자 지정     → cips.sanction.save (DEM 선생성, REGIS.CFM_DEM_SN 기록)
               승인요청 버튼   → ① updateSend 복사(REGIS→RECEIVE)
                                 ② actSanction (요청자=협력사 사용자)
               요청취소 버튼   → cancelSanction (DEM_CANCEL)
```
협력사 멘탈모델: **"승인요청 = 기존 제출"**. 레거시 현장 협력사는 제출 그대로 → 대다수 혼란 0.

## 4. 착수 단계 — ✅ 배선 완료 (2026-09-02 코드 대조)

- [x] **선행 조사** — [SfasSub_옵션060_영향목록.md](./SfasSub_옵션060_영향목록.md) 작성(2026-08-18)
- [x] Sub SQL 옵션 공급 — `selectCdOpt` 신설이 아니라 **기존 `selectCdLinkCpnList` 에 2컬럼 추가**로 처리(§0-(1) 권고대로)
- [x] 제출 버튼 `060_003` 분기 — `fnIsScntRow` 판정 후 팝업 위임
- [x] ~~Sub 화면에 wframe 2종 include~~ → **폐기.** 원청과 같은 **전용 팝업**(`SfasPopRegRiskAssessmentSubConfirm.xml`)이 wframe 2종을 품는다. 외곽에는 승인 UI 를 두지 않는다(§8 의 전제 변경과 같은 이유)
- [x] ~~승인자 LOV 배선~~ → **불필요**(§5 Q1)
- [x] ~~Sub 서비스 `trscSubmit` 시퀀싱~~ → **폐기.** §8 결정대로 handler `onActionApplied` 가 복사한다
- [x] 요청취소 = `DEM_CANCEL` 배선 — 팝업 `fnRunAction("demCancel")`
- [x] Sub 상태 표시 — `STS_NAME` 은 REGIS 의 `CFM_*` 기준으로 나온다([SubSql:774-777](../../src/main/resources/sqlmap/mappers/sfas/SfasRegAtRiskasmtSubSql.xml#L774-L777)).
      **단계·대기자 2컬럼은 두지 않는다(2026-09-02 확정)** — 협력사에게 원청 내부 결재 위치를 목록에서 노출하지 않는다. 원청 화면과의 차이는 의도된 것
- [ ] 실동작 검증: 협력 승인자 지정 → 요청 → **원청 목록 노출 확인** → 원청 승인 → 협력 상태 반영 ← **테스트 미완**

## 5. 확정 사항 (2026-08-18 사용자 확답)

**Q1. 협력사가 지정하는 승인자 범위 → 원청 단계까지 전부 지정 가능.**
잘못 넣었으면 요청 후 원청이 직접 고칠 수 있으므로 허용.
→ `oNotNullColumns: ["SANCTNER_USER_NAME"]` **전체 적용**(단계별 분기 불필요).

**LOV 는 추가 배선이 필요 없다.** `BASE_SANCTNER_STEP`(TSST_LOV #12703) 은 UNION 구조다:

| 구분 | 반환 조건 |
|---|---|
| `P` 기업(원청) | `COMPANY_ID`/`PROJ_CODE` 만으로 **항상** 반환 — `COOP_COMPANY_ID` 무관 |
| `C` 협력 | `#{STEP_SECT_CODE} = DEM` 이고 `TCC_PROJ_LINK` 로 `#{COOP_COMPANY_ID}` 에 연결된 사용자만 |

→ 원청 단계(SANCTN·AGRMT 등)를 고르면 **원청 사용자 목록이 그대로 뜬다.** DEM(요청) 단계만 협력사 본인 회사로 좁혀진다.
→ 공통 `CommonWFrameSanctnGrid.xml:103` 의 기본 배선(`COOP_COMPANY_ID=COOP_COMPANY_ID`)을 **그대로 사용**하고,
   `wdlCfmStep.COOP_COMPANY_ID` 에 협력사 ID(세션 회사 ID)만 채워주면 된다.
   CESC 협력사판이 `{sessionCompanyId}` 를 쓴 건 같은 값을 다른 경로로 넣은 것뿐 — **따라할 필요 없음.**

**Q2. DEM 생성 시점 → 저장 시 선생성.**
승인자 지정 후 저장하면 `DEM_SN` 이 만들어져 `REGIS.CFM_DEM_SN` 에 매핑된다. 요청 시점에 만들지 않는다.
→ Rcpt 의 `fnOnSaved(sDemSn)` 경로를 그대로 미러링. 승인요청 단계에서는 `actSanction` 만 하면 된다(생성 책임 없음).

## 6. 배포 시 주의 — DDL

**SKPMIS 에는 `CFM_*` 4컬럼이 RECEIVE·REGIS 양쪽 모두 없다** (PMIS4 에만 존재).
Sub 배선만의 문제가 아니라 **원청 SCNT 배포에도 걸리는 선행 조건**이다. 배포 전 DDL 반영 확인 필수.

## 7. 유의점 (2026-07 항목 중 유효한 것)

1. ~~협력사는 승인라인 설정 불가~~ → **§0 으로 대체**
2. **제출취소 = 요청취소(DEM_CANCEL)** 로 매핑. 협력사가 되돌릴 수 있게.
3. **복사 타이밍**: `updateSend` 는 복사 외에 `CHECK_TF='F'`·`STTS_CD='10'` 세팅 + TBM 검증도 한다. 승인요청 시 이 부작용이 문제없는지 확인.
4. REGIS 의 CFM_* 는 handler(`updateCfmRegis`)가 기록하므로 Sub 는 REGIS 조회만으로 상태 표시 가능.

---

## 8. Merge 위치 재결정 (2026-08-18) — handler 채택

§3 의 "(나) Sub 서비스 오케스트레이션" 은 **폐기한다.** 팝업 방식을 채택하면서 전제가 바뀌었다.

- 승인요청이 팝업 → **공통 sanction 엔드포인트** 로 나가므로 Sub 서비스를 거치지 않는다. 시퀀싱할 자리가 없다.
- 사용자 확정(2026-08-18): **handler 에서 처리하는 게 지향하던 바와 부합.**

### 훅 위치 — `onActionApplied`

`CommonSanctionBridgeServiceImpl` 호출 순서 확인:
```
applyAction()  →  service.actSanction()                       // 코어: 승인/반려
               →  amActionData.put("STEP_STS_CODE", …)        // 코어가 확정한 단계상태
               →  oHandler.onActionApplied(amActionData)      // ★ 여기
               →  (CMPL 이면) onCompleted
```
`onDemandCreated` 는 **요청 전(승인라인 저장 직후, STS=REG)** 이라 부적합하다. "요청하고 나면 원청 테이블에 Insert" 라는 요건에 맞는 지점은 `onActionApplied` 다.

조건: `STEP_STS_CODE In ('DEM','PROG','CMPL')` 이고 RECEIVE 행이 없으면 복사. (`SUB_TF` 파생과 같은 상태집합 — 일관)

### ⚠️ 장애물 — `trscSub` 가 요구하는 파라미터가 handler 에 없다

복사 본체는 `SfasRegAtRiskasmtSubSql.xml:4276` `<update id="trscSub" statementType="CALLABLE">` (**1,390줄 PL/SQL**). 이게 REGIS→RECEIVE 본문·상세를 통째로 옮긴다. 새로 쓰지 말고 재사용해야 한다.

필요 바인드 9종:
`COMPANY_ID` `PROJ_CODE` `REG_SN` `COOP_COMPANY_ID` `SECT_CODE` `STD_YM` `STD_TIME_CODE` `SUB_TF` `SESSION_USER_NO`

handler 의 `amActionData` 가 가진 것: `COMPANY_ID` `PROJ_CODE` `REG_SN` `DEM_SN` `STEP_STS_CODE` — **6종이 없다.**

→ **handler 가 REGIS 행을 먼저 조회해 채운 뒤 호출해야 한다.**

### 구현 순서 — ✅ 완료 (2026-09-02 코드 대조)

- [x] `SfasAtRiskasmtSanctionHandlerMapper.selectRegisForMerge` 추가
- [x] handler `mergeRegisToReceive` — `onActionApplied` 에서 호출. `REQUESTED_STS`(`DEM`/`PROG`/`CMPL`) 이고 `RCPT_EXISTS_TF='F'` 일 때만
- [x] `SfasRegAtRiskasmtSubService.trscSub` 를 `TAG="SEND"`·`SUB_TF="T"` 로 호출. 공통 승인 엔드포인트는 세션 키를 안 넣으므로 **요청자를 주체로** 채워 넣는다
- [ ] 검증: 협력 승인요청 → **원청 Rcpt 목록에 노출** → 원청 승인 → 협력 상태 반영 ← **테스트 미완**

> 참고: `writeCfmCache` 도 `COOP_COMPANY_ID` 없이 3키로만 UPDATE 한다(§SfasSub 문서 참조). 위 조회를 넣는 김에 PK 4키로 좁히면 견고해진다 — 지금은 `REGIS_SEQ` 가 현장 단위 시퀀스라 우연히 1행만 맞는 상태다.
