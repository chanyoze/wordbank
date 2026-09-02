---
title: "SfasRegAtRiskasmtSub — SCNT 배선 seam 전수 목록"
sidebar_label: "제출화면 060 seam"
sidebar_position: 6
date: 2026-09-02
kind: 갱신
raw: "RAW-DOC:cip-defg-saas/OTAT/TO-BE/SfasSub_옵션060_영향목록.md"
---

# SfasRegAtRiskasmtSub — SCNT 배선 seam 전수 목록

> 작성 2026-08-18 / 이찬호
> 원청판: [SfasRcpt_옵션060_영향목록.md](SfasRcpt_옵션060_영향목록.md) · 배선 계획: [TODO_협력화면_SCNT배선.md](TODO_협력화면_SCNT배선.md)
> 🔗 컬럼 축: [컬럼표시_화면대조.md](../컬럼표시_화면대조.md)
> 결론 먼저: **Sub 는 Rcpt 보다 훨씬 단순하다. 게이트 축이 `SUB_TF` 하나뿐이다.**

## 0. Rcpt 와 구조가 다르다 — 두 가지

### (1) 옵션 공급 경로가 다르다
| | Rcpt | Sub |
|---|---|---|
| 데이터셋 | `wdlCdOpt` (전용 `selectCdOptList`) | **`wdlCdLinkCpn`** (`selectCdLinkCpnList`) |
| 중앙 플래그 | `scwin.oOptConfig` (`bUseOpt060` 등) | **없음** — `wdlCdLinkCpn.getCellData(0, "SFAS_OPT_xxx")` 직접 읽기 |
| 옵션 출처 테이블 | `TCC_PROJ_CODE` | `TCC_PROJ_LINK a, TCC_PROJ_CODE b` 의 **b** (= 원청 현장) |

Sub 는 협력사가 "어느 원청 현장인지"를 먼저 고르고 그 현장 옵션을 함께 받는 구조라 자연스럽다.
→ **`wdlCdOpt` 를 새로 만들 필요 없다.** `selectCdLinkCpnList` 에 `b.SFAS_OPT_060`·`b.SFAS_OPT_060_003` 2줄 + 데이터셋 컬럼 2개만 추가.
→ 현재 Sub 가 읽는 옵션 24종에 **060 계열은 없다.**

### (2) 게이트 축이 하나다
Rcpt 는 `SFAS_OPT_060` × `STTS_CD`(10~60) × `EDIT_TF` 3축이 얽혀 A~G 7군 seam 이 생겼다.
Sub 는 **`SUB_TF` (제출여부) 단일 축**이다. `SUB_TF` = `TSF_ASSMNT_REGIS.CHECK_TF` — [SubSql:721](../../src/main/resources/sqlmap/mappers/sfas/SfasRegAtRiskasmtSubSql.xml#L721) `a.CHECK_TF SUB_TF`.

## 1. `SUB_TF` 를 쓰는 지점 전수 (= SCNT seam 후보)

| # | 지점 | 규칙 | 참조 |
|---|---|---|---|
| 1 | 제출/제출취소 버튼 노출 | `rBtnCstCtr`: `wbtnSend`←`SUB_TF='F'`, `wbtnCancel`←`SUB_TF='T'` | [613-614](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L613-L614) |
| 2 | 내용행 추가 차단 | `RCPT_TF='T'` → 접수됨 / `SUB_TF='T'` → "등록부가 제출되어 추가할 수 없습니다" | [1015-1019](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L1015-L1019) |
| 3 | 신규행 기본값 | `SUB_TF = 'F'` | [1079](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L1079) |
| 4 | 삭제 차단 | 2번과 동일 패턴 | [1276-1280](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L1276-L1280) |
| 5 | 순서변경(up/down) 차단 | `SUB_TF='T'` → "작성중인 경우만 순서를 변경할 수 있습니다" | [1301](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L1301) · [1310](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L1310) |
| 6 | 내용 그리드 readOnly | `const bReadonly = SUB_TF == "T"` → wgrdCont 컬럼 일괄 잠금 | [1621](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L1621) |
| 7 | 전체정렬 허용 | `SUB_TF='F'` 일 때만 | [1793](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L1793) |
| 8 | 근로자참석 팝업 삭제권한 | `DEL_IMPROP_TF = SUB_TF=='F' ? 'T' : 'F'` | [1897](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L1897) |
| 9 | 재해사례 팝업 모드 | `SUB_TF='T'` → "재해사례 조회"(읽기), `'F'` → "가져오기" | [1915](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L1915) · [1928](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L1928) |
| 10 | 제출 실행 | `wbtnSend_onclick` → 필수검증 → `wdmTrscSub.TAG='SEND'`·`SUB_TF='T'` → `wsmTrscSub` | [2642](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L2642) · [2834](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L2834) |
| 11 | 제출취소 실행 | `wbtnCancel_onclick` — `RCPT_TF='T'`(원청 접수)면 차단 → `TAG='CANCEL'`·`SUB_TF='F'` | [2857](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L2857) · [2879](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L2879) |

그 외 `SFAS_OPT_092`(종합검토의견) 게이트 6곳은 승인과 무관하게 그대로 둔다 — [1521~1576](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L1521-L1576) · [3367](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L3367).

## 2. ★ 권장 설계 — `SUB_TF` 를 SCNT 상태에서 파생시킨다

seam 11곳을 하나씩 `060_003` 분기로 고치면 Rcpt 가 겪은 누락 위험을 그대로 반복한다.
**`SUB_TF` 가 단일 축이라는 점을 이용해 SQL 한 곳에서 파생시키면 화면 11곳을 손대지 않아도 된다.**

```sql
-- selectAsmtList (현재 721행)
a.CHECK_TF SUB_TF,  -- 제출여부

-- → SCNT 현장이면 승인상태에서 파생
(Case
    When b.SFAS_OPT_060_003 = 'T' Then
        Decode(a.CFM_STS_CODE, 'DEM', 'T', 'PROG', 'T', 'CMPL', 'T', 'F')
    Else
        a.CHECK_TF
 End) SUB_TF,  -- 제출여부 (승인 모듈 현장은 승인상태에서 파생 — REG/REJ=작성중, DEM 이후=제출됨)
```

의미 대응이 정확히 맞는다:

| SCNT `CFM_STS_CODE` | 레거시 `SUB_TF` | 화면 동작 |
|---|---|---|
| Null · `REG` · `REJ` | `F` (작성중) | 편집·삭제·순서변경 허용, **승인요청 버튼** 노출 |
| `DEM` · `PROG` · `CMPL` | `T` (제출됨) | 잠금, **요청취소 버튼** 노출 |

→ seam 11곳 중 **실제로 손대야 하는 것은 #1(버튼)·#10(제출 실행)·#11(취소 실행) 3곳뿐**이고, 2~9는 파생값으로 자동 정합.

## 3. 실제 수정 대상 (3곳 + 배선) — ✅ 전량 반영 (2026-09-02 코드 대조)

- [x] **#1 버튼** — 플래그 `SUB_BTN_TF`·`CANC_BTN_TF` 신설로 노출을 **회차 단위**로 옮겼다([Sub:613-614](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L613-L614)). *"승인 wframe 버튼이 대신 뜬다"* 는 원안은 **폐기** — 승인 버튼은 외곽이 아니라 팝업 안에 있다(명세 §9-10 ④)
- [x] **#10 제출 실행** — `wbtnSend_onclick` 선두에서 `fnIsScntRow` 면 `openSanctnPopup()`([Sub:2727](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L2727))
- [x] **#11 제출취소** — 같은 방식으로 팝업 위임([Sub:2943](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L2943)). *"`RCPT_TF='T'` 차단 유지"* 는 **폐기** — 승인 궤도에서는 `DEM_CANC_PSBL_TF` 가 판정하므로 레거시 차단을 걸지 않는다
- [x] **SQL** — `selectCdLinkCpnList` 옵션 2컬럼([SubSql:46-47](../../src/main/resources/sqlmap/mappers/sfas/SfasRegAtRiskasmtSubSql.xml#L46-L47)) · `selectAsmtList` 의 `SUB_TF` 파생([735-739](../../src/main/resources/sqlmap/mappers/sfas/SfasRegAtRiskasmtSubSql.xml#L735-L739)) · `CFM_STS_CODE`·`CFM_DEM_SN` 출력([757-758](../../src/main/resources/sqlmap/mappers/sfas/SfasRegAtRiskasmtSubSql.xml#L757-L758))
- [x] **데이터셋** — `wdlCdLinkCpn` 옵션 2컬럼([Sub:45·230](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L230)) · `wdlAsmt` 에 `CFM_STS_CODE`·`CFM_DEM_SN`([231-232](../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtSub.xml#L231-L232))

> ✅ **승인단계·대기자 컬럼은 협력 목록에 두지 않는다 (2026-09-02 확정).**
> 원청 화면은 `SANCTN_STEP_NAME`·`SANCTN_STEP_USER_NAME` 2컬럼을 띄우지만 협력 화면은 `STS_NAME` 하나로 끝낸다.
> 협력사에게 원청 내부의 결재 진행 위치·담당자를 목록에서 노출할 이유가 없다. 필요하면 상태명 링크로 팝업을 연다.
> **차이는 의도된 것이니 불일치로 보고하지 않는다.**

## 4. 단어사전 배치6 — 2026-08-18 재적용 완료 (해소)

착수 시점에 Sub 만 `R_COMPANY_ID→COOP_COMPANY_ID` 가 빠져 있던 것을 발견해 **먼저 처리했다.**

| 파일 | 조치 |
|---|---|
| `SfasRegAtRiskasmtSub.xml` | 컬럼·`GH_` 헤더 치환, 외부계약 8건 보호 |
| `SfasRegAtRiskasmtSubSql.xml` | `#{COOP_COMPANY_ID}` 93건, Select 별칭 4곳 신설, 물리컬럼 128건(88+40) 보존 |
| `SfasRegAtRiskasmtSubServiceImpl.java` | `amWdmTrscSub.get("COOP_COMPANY_ID")` |

검증: XML 2/2 · JS 문법 OK · 데이터셋 중복 0 · CRLF 100% · diff 153+/153− · 팝업계약 기준선 동일 ·
FE/BE 미공급 바인드 7→6(`selectDrCaseRegChkList` 의 기존 Null 바인드 결함 해소) · Oracle 대조로 인라인뷰 외부별칭 형태 실행 확인.

> ⚠️ 배치4 잔재는 아직 남아 있다 — Sub 에는 `EVL_R_COMPANY_ID`·`OTH_R_COMPANY_ID`·`PRE_ASSMNT_R_COMPANY_ID` 가 그대로다(Rcpt 는 배치4에서 `FST_`/`OT_AT_`/`PREV_AT_` 로 이미 전환). **이번 배치 범위 밖**이며 별건으로 남는다.

---

## 부록. 정리 이력과 남은 리팩토링 (2026-08-18)

승인 이식 중 발견한 화면 정리분. **승인 배선과 무관한 코드 위생 작업**이라 별도 커밋으로 뺐다.

| 항목 | 조치 |
|---|---|
| 정적 `cipc-notnull` 13건 | **제거**. Rcpt 는 정적 0 / JS 동적 5(`setCellClass`) 구조였다 |
| 그중 조회조건 3건(현장·회차연월·회차) | 제거가 맞다 — `oSearchConditonNotNullColumns`(557행)에 이미 선언돼 있어 **중복이었다** |
| 내용 그리드 동적 notnull | `gridItemControlRow` 에 주입 블록 추가. 옵션 040/040_001/040_002 조합 판정은 Rcpt `gridItemControl` 과 동일 |
| 검토의견 그리드 | **조치 없음.** `oReadOnlyColumns: ["ALL"]` + `bInsBtn: false` — 협력사는 입력 자체가 불가하므로 notnull 이 무의미 |
| `wcpntGrpGrd*` 4종 | `Main→Asmt` `Sub1→Cont` `Sub2→ConstrRvw` `Sub3→SafRvw` (짝 데이터셋 기준). Rcpt 와 이름 집합 일치 |
| `grid*Control` 2종 | `gridSub01Control→gridItemControl`, `gridSub01ControlRow→gridItemControlRow` |

### 남은 리팩토링 (착수 전 계획 필요)

1. **`gridItemControl` / `gridItemControlRow` 분리 구조** — 그리드 단위와 행 단위가 별도 함수로 갈려 있어 호출부가 3곳(1628 전체루프 / 1985·1986 행이동)으로 흩어진다. Rcpt 는 `gridItemControl(asDataId, nIdx)` 하나로 행 인자를 받아 처리한다. **통합 방향은 Rcpt 형태가 맞지만 호출부 영향이 있어 계획 후 착수.**
2. **`Sub01` 잔재 식별자 5종** — `bChgSub01Row`(8) `bDrCaseReloadSub01`(2) `bLoadDrCaseAfterGetAssmntSub01`(4) `wbtnViewTdSub01`(4) `wbtnViewTdSub01_onclick`(4). Rcpt 에 대응 이름이 없어 목표명이 자명하지 않다 — 단어사전 확정 후 일괄.
3. **`scwin.oNotNullColumns` 중앙 레지스트리** — Rcpt 는 정적 기본(772) + 옵션별 동적 push(4357~4360) + 이력검증 소비(4840) 구조. Sub 는 인라인 배열. 통일하려면 Sub 검증 로직(905~929 개별 if)까지 손대야 해 **이번엔 보류**.
