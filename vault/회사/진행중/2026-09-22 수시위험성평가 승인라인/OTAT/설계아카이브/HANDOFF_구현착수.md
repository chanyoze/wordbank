---
title: "표준 승인(SCNT) 구현 착수 — Handoff"
sidebar_label: "구현착수 핸드오프 (강등)"
sidebar_position: 1
date: 2026-07-07
kind: 동결
raw: "RAW-DOC:cip-defg-saas/OTAT/설계아카이브/HANDOFF_구현착수.md"
---

# 표준 승인(SCNT) 구현 착수 — Handoff

> ⚠️ **[강등·아카이브] 착수 시점(2026-07-07) 좌표 문서. 아래 지시가 이후 실구현에서 번복됨 — 이 문서만 보고 구현하면 잘못된 패키지·구조로 빌드됨. 현행은 `../진행중/HANDOFF_승인팝업_세션이관.md`(현행 실장)와 `../진행중/SCNT_구현방식_공유.md`(SoT).**
> - BE 위치: `module/scnt` + `SanctionBridge` → **`module/common` + `CommonSanctionBridge`**
> - 승인패널: 1개 통합("2분할 복제 금지") → **2 wframe(Grid/Button)**
> - TGT_CODE `SFAS_AT`/`SFAS_AT_RISKASMT` → **`OTAT`**
> - STTS_CD 폐기 → **존치(소급유지)**, 범위 Rcpt+Sub → **Rcpt만**
>
> **마일스톤**: [ATMS26-012] 한화오션(주) 상시·수시위험성평가 승인모듈 기능 추가
> **수신**: 실제 구현을 맡을 개발 에이전트(antigravity 내장 Claude). **이 문서 하나로 착수 가능하도록** 좌표를 모았다. 대화 맥락은 없다고 가정한다.
> **작성**: 2026-07-07 / 이찬호
> **성격**: 진입 지도. 상세·근거는 각 링크 문서가 단일 기준(source of truth).

---

## 0. 시작 전 — 반드시 먼저 읽을 것

| 순서 | 문서 | 왜 |
|---|---|---|
| ① | [`SCNT_표준승인_도입계획.md`](./SCNT_표준승인_도입계획.md) | **스펙 원본.** 확정사항 D1~D11, 상태매핑, 옵션게이트(§5.5), 인터뷰 로그. 충돌 시 이 문서가 이김. |
| ② | [`SfasRcpt_옵션060_영향목록.md`](./SfasRcpt_옵션060_영향목록.md) | **교체 지점(seam) 카탈로그** — 실제 화면의 file:line. "어디를 갈아끼우나". |
| ③ | [`예시구현/`](./예시구현/) | **참조 스켈레톤**(Bridge/Handler/FE) + 실측 testbed(JaCoCo). **패턴 참고용** — 그대로 승격하는 게 아님(§3·§4). |
| ④ | [`../가설계/SCNT_표준승인_피드백.md`](../가설계/SCNT_표준승인_피드백.md) | **필수 반영 4항목**(§5). 규약·안전장치. |

> ⚠️ `예시구현/` 파일들의 클래스·경로·엔드포인트명은 전부 **가제**다. 실제 명칭은 §3 번역표를 따른다.

---

## 1. 한 문장 목표 + 착각 방지

**목표**: 수시위험성평가(`SfasRegAtRiskasmtRcpt` 원청 + `SfasRegAtRiskasmtSub` 협력사)의 자체 승인 로직을 SCNT 표준 승인으로 대체하고, 다른 모듈도 붙일 수 있는 **재사용 표준(Bridge/Handler/패널)** 을 함께 세운다.

**⚠️ 반드시 인지할 것 — "스켈레톤이 있으니 작업이 작다"는 착각 금지.**
- 스켈레톤이 안정적으로 보여주는 것은 **Bridge/Handler 패턴의 모양**뿐이다(DCMT 장난감 예제).
- 실제 마일스톤의 **작업량 대부분은 스켈레톤에 0줄도 없다**:
  1. **옵션게이트 `SFAS_OPT_060_003` + SQL 일괄수정**(~15~20파일 / 40여 조건절) — 최대 blast radius, 가장 잊기 쉬움.
  2. **D/E/F/G seam** — 상태부여·승인액션·수정잠금·검토의견게이트 각각에 **새 SCNT 분기**를 넣어야 함("060=T 죽이기"만으론 부족).
  3. **호스트 테이블 컬럼 변경**(`TSF_ASSMNT_RECEIVE`).
- 즉 **"패턴은 안정적 ≠ 일이 적다."** 패턴 복제는 쉽고, 통합·게이트·정합이 본체다.

---

## 2. 절대 규칙 (위반 시 롤백 대상)

1. **코어 불가침**: `cips.js`, `config.xml`, `module/common/CommonSanctionService`(승인 엔진)는 **수정 금지**. 호출만 한다. (도입계획 §5.1·§6)
2. **운영 DB 쓰기 금지**: 스키마/데이터 변경은 **DDL 스크립트·마이그레이션 파일로 제안**만. 운영 커넥션에 직접 write 금지.
3. **상호배타 옵션**: `SFAS_OPT_060`(기존결재) XOR `SFAS_OPT_060_003`(SCNT). **동시 T 불가**, SCNT 현장은 `060=F`로 저장. admin UI에서 원천 차단. (D11 / §5.5)
4. **deny-by-default**: 승인 버튼은 **플래그가 명시적으로 `"T"`일 때만** 노출. 플래그 로드 실패·누락 시 "안 보임"이 안전측. (피드백 #3)
5. **버튼 = 사용자가 실제로 누를 수 있는 것만**: 노출 판정은 반드시 **로그인 사용자 기준**(`#{SESSION_USER_NO}` 포함) 플래그로. 상태만 보는 판정 금지. FE 노출(1차) + BE 재검증(2차) 2겹. (피드백 #3)
6. **핸들러는 절대 `@Controller` 금지**: 이중 컨텍스트 때문에 servlet으로 새면 root의 Bridge Map에서 누락 → 런타임 "핸들러 없음". (피드백 #1)
7. **커밋/푸시는 사용자 확인 후에만**. 회사 레포에 임의 git 조작 금지.

---

## 3. 네이밍 번역표 (가제 → 실제) ★ 이 표를 어기면 잘못된 패키지에 만든다

| 스켈레톤(가제) | 실제(도입계획 D10/E1) | 비고 |
|---|---|---|
| `module/common/sanction/...` (Bridge 위치) | **`module/scnt`** | `CommonSanctionService`는 `module/common` 유지 |
| `CommonSanctionBridgeService` / `...Impl` | `SanctionBridgeService` / `...Impl` | |
| `CommonSanctionBridgeController` | 제네릭 `SanctionBridgeController` (`module/scnt`) | |
| `CommonSanctionTargetHandler` (인터페이스) | `SanctionTargetHandler` | |
| `DcmtSanctionHandler`(예제) | **`SfasAtRiskasmtSanctionHandler`** (신규) | 수시평가용 핸들러 1개 |
| Grid wframe + Buttons wframe = **2개** | **`CommonSanctionPanel.xml` 1개** | ★ 단순 리네임 아님 — **스펙(E3/D9)은 패널 1개**. 2분할 복제하지 말 것. 상태그리드+버튼+헬퍼연결을 한 wframe에. |
| 엔드포인트 `saveDemand.do`/`action.do`/`selectStatus.do`/`changeLine.do` | 도입계획 §5.2는 `createDemand.do`/`action.do` | 엔드포인트명도 가제 — 팀 규약으로 **한 세트 확정 후 일관 사용**. |
| FE 네임스페이스 `cips.sanction` | 동일 (E2 확정) | 파일 `src/main/webapp/js/sanction/cips_sanction.js`, **화면 `<head>` 개별 include**(config.xml 전역등록 X) |

---

## 4. 스켈레톤 현재 상태 (뭐가 적용됐고 뭐가 아닌지 — 오해 방지)

`예시구현/` 트리 기준 **검증된 사실**:

| 항목 | 상태 | 실제 구현 시 |
|---|---|---|
| `tgtCode()` 메서드 | **제거됨** ✅ (인터페이스는 "코드=빈 이름" 규약 주석만) | **재도입 금지.** 코드는 `@Service("...")` 빈 이름으로만 표현. `handlers.get(빈이름)`이 디스패치 키. |
| 핸들러 스테레오타입 | **아직 `@Component`** ❌ | **`@Service("SFAS_AT...")`로 작성**(피드백 #1). `@Component`는 servlet 컨텍스트 이중 인스턴스. |
| 버튼 플래그 배선(`oFlags`) | **미배선** ❌ (`selectStatus`가 `{wdlCfmStep}`만 반환, 그리드는 `oRes.oFlags`를 읽음) | `loadStatus`가 **단계이력 + per-user 플래그(oFlags)** 를 함께 반환하도록 배선(피드백 #3). |
| 조회 병합 공통화(`mergeSanctionInfo`) | **방치**(키 컬럼 하드코딩) | 파라미터화해 부활(피드백 #4). |
| 상태코드 매핑 | DCMT 예제는 `40=반려/50=완료` | ⚠️ **SFAS는 다름**(§6 참조). DCMT 숫자 복사 금지. |

---

## 5. 필수 반영 4항목 (피드백 문서 — "반드시 지킬 결정사항")

> 상세·코드스니펫은 [`피드백.md`](../가설계/SCNT_표준승인_피드백.md). 여기선 지시만.

- **#1 DI/컨텍스트 규약**: 핸들러 = `@Service("<TGT_CODE>")` (not `@Component`). 절대 `@Controller` 아님. 빈이름 = `USETGT.TGT_CODE` 유니크. `tgtCode()` 메서드 재도입 금지. (앵커가 필요하면 `public static final String CODE="..."; @Service(CODE)` 상수 방식.)
- **#2 버튼 표시요소 오버라이드**: 패널 `fnInit`에 `labels`(필요 시 styles/tooltips) 파라미터 추가, `aSanctionButtons` 순회로 적용. ※ WebSquare 캡션 API가 `setLabel` vs `setValue`인지 1줄 검증. **요구 확정 후** 필요분만.
- **#3 사용자별 노출 + 배선**: (a) `loadStatus`가 `oFlags` 반환하도록 배선(위 §4), (b) 플래그 출처 = `selectSanctionDemand`/`SFCC_GET_SANCTN_BTN_PSBL_TF`(`SESSION_USER_NO` 포함), (c) `applyAction`/`cancel`에서 **BE 재검증**, (d) deny-by-default 유지. **보안 직결 — 즉시.**
- **#4 조회 경로 공통화**: `CommonSanctionService.mergeSanctionInfo`를 **입력 키 3개 파라미터화**해 부활 → 평문 목록의 N+1 + 15줄 복붙 제거. Handler 불필요(순수 데이터 조인). 초대량 핫리스트만 SQL 인라인(C) 탈출구.

---

## 6. 실제 빌드 플랜 (스켈레톤에 없는 본체 작업)

### 6-1. Data / DDL (제안 스크립트로)
- **USETGT 등록**: `TSST_SANCTN_USETGT`에 수시평가 `TGT_CODE` 신규 등록(현재 14개, 위험성평가 엔트리 없음). 등록화면 `SstRegSystemSanctionUseTarget`. MAX_STEP ~7, **Rcpt+Sub 1코드 공유**.
- **승인라인**: 기존 `BaseRegProjectSanctionLine`(현장 레벨) 활용 — 새 관리화면 불필요. 라인은 **회사별 커스텀**(3단계 고정명칭 없음).
- **호스트 테이블 `TSF_ASSMNT_RECEIVE`**: 기존 `STTS_CD`·`APPRV_*` **deprecated(안 보이게)**, 신규 `STS_CODE`·`CFM_COMPANY_ID`·`CFM_PROJ_CODE`·`CFM_DEM_SN` 추가(DCMT 패턴).
- **옵션 컬럼**: `SFAS_OPT_060_003`(default `'F'`) 추가. 060 패밀리 편입 → 회사→현장 상속은 `SFAS_OPT_060_TF` Decode에 1줄.

### 6-2. 옵션게이트 SQL 일괄수정 ★★ 최대 blast radius — 빠뜨리면 미승인 노출/라벨 공백
`060=F`로 저장되므로, `060`을 "승인 활성"으로 읽는 **모든** SQL을 수정:
- `SFAS_OPT_060='T'` → `(SFAS_OPT_060='T' OR SFAS_OPT_060_003='T')`
- `SFAS_OPT_060='F'` → `(SFAS_OPT_060='F' AND SFAS_OPT_060_003='F')`

대상 ~15~20파일 / 40여 조건절(노출필터·상태라벨 Case). **정확한 목록은 [영향목록 문서](./SfasRcpt_옵션060_영향목록.md) 요약 §4 + 도입계획 §5.5.** admin 상호배타 UI(060↔060_003 양방향 잠금)도 여기.

### 6-3. 화면 seam 교체 — Rcpt(그리고 Sub 동일 패턴)
[영향목록](./SfasRcpt_옵션060_영향목록.md)의 A~G. 원칙:
- **A/B/C (컬럼 표시·readonly·notnull)**: 승인선 3컬럼(`APPRV_C/BD/A_USER_NM`)을 SCNT 패널로 이전할지/유지할지 결정.
- **D (상태부여)**: add/send 시 `060_003=T`면 **SCNT 초기상태(STS_CODE + DEM 생성)로 분기**. else로 두면 "접수/20"에 방치됨. → seam 필수.
- **E (승인 액션 서브시스템)**: 레거시 버튼군(`wbtnApprv`/`wbtnApprvCnc` + `trscApprv.do` 등) → **SCNT 패널(`cips.sanction.*` + `CommonSanctionPanel`)로 대체**.
- **F (수정/삭제/순서 잠금)**: `060=T && EDIT_TF=F` 판단 → **SCNT DEM 진행상태 기반**으로 교체.
- **G (검토의견 필수 게이트)**: → SCNT **`validateBeforeDemand`(요청 전 게이트)로 이전**. (단, 검토의견 granularity는 §7 미결)

### 6-4. BE — `module/scnt`
- `SanctionBridgeService`+`Impl`: 오케스트레이션 1회(라인결정→DEM생성→단계기록→종결판단→상태동기화) + `Map<String,SanctionTargetHandler>` 디스패치. **코어 `CommonSanctionService` 조합 + 훅**일 뿐(참조화면이 이미 하던 걸 공통화).
- 제네릭 Controller(엔드포인트 1세트).
- `SanctionTargetHandler` 인터페이스 + `SfasAtRiskasmtSanctionHandler`(`@Service`) 1개.
- 반려=SCNT 버전모델(같은 평가서 재요청, 새 회차 X, host코드 불필요) · 승인취소=SCNT-native(이전단계 복귀). (D7)

### 6-5. FE
- `js/sanction/cips_sanction.js`(객체형, `cips.sanction` 네임스페이스) — 화면 head 개별 include.
- `CommonSanctionPanel.xml` 1개 드롭인: 호스트는 "내용 뷰 + `<승인패널/>` 한 줄 + keys 추출 함수 1개".

---

## 7. DO NOT GUESS — 미결(값을 임의로 박지 말 것)

| 항목 | 상태 | 지시 |
|---|---|---|
| **TGT_CODE 값** | 🟡 문서 내 불일치: D10=`SFAS_AT` / §4·§5=`SFAS_AT_RISKASMT`. 사내 공식 명명 대기(C1). | **단일 상수/플레이스홀더로 한 곳 정의** 후 참조. 여러 파일에 하드코딩 금지. 확정 시 1곳만 교체되게. |
| **검토의견 granularity(A3/A5)** | 🟡 항목별 검토의견 유지(잠정), 업무 확인 후 확정. | 게이트 위치는 **`validateBeforeDemand` 고정**. 항목별 vs 단계종합 결정은 **열어둠** — 한쪽으로 굳히지 말 것. 레거시 데이터(`..._CONST/SAFE_CMT`) 보존. |
| **상태 정합 매핑표** | 🟡 제네릭5(10/20/30/40/50) ↔ 레거시 `STTS_CD` 버킷(20/60·30~60) 매핑 미확정. | **코딩 착수 전 매핑표 확정**(도입계획 §5.5 (a)권장: host update가 호환 유지). ⚠️ **DCMT 예제의 40=반려/50=완료를 복사하지 말 것** — SFAS 어휘는 다름. |

---

## 8. 검증

- **패턴 회귀(빠름)**: `예시구현/testbed`에서 `mvn -o -B clean verify` — 단위테스트 + JaCoCo 80% 게이트. 패턴을 실코드로 옮길 때 참조. (README: `예시구현/testbed/README.md`)
- **실동작(필수)**: 옵션 `060_003=T` 현장에서 요청→승인→반려→취소 전 경로 + **`060_003=F` 현장이 기존 결재로 정상 동작(회귀 없음)** 확인. 목록화면 승인상태·버튼이 사용자별로 정확한지.
- **게이트 회귀**: SQL 일괄수정 후, SCNT 현장이 목록/라벨에서 "미승인"으로 새지 않는지(§6-2 누락 탐지).

---

## 9. 권장 착수 순서

1. **§7 미결 3개를 값으로 확정**(TGT_CODE·매핑표·검토의견) — 안 정하면 뒤에서 전부 흔들림.
2. Data/DDL(§6-1) + 옵션 admin 상호배타(§6-2 UI).
3. BE `module/scnt` Bridge/Handler(§6-4) — testbed로 패턴 검증하며.
4. FE `cips_sanction.js` + `CommonSanctionPanel.xml`(§6-5).
5. Rcpt seam D→E→F→G(§6-3) → 실동작 검증 → Sub 반복.
6. **옵션게이트 SQL 일괄수정(§6-2)** — 별도 정독하며 누락 0 목표.
7. 피드백 4항목(§5) 반영 확인(#1·#3 우선).

---

## 10. 참조 파일 인덱스

- 스펙 원본: [`SCNT_표준승인_도입계획.md`](./SCNT_표준승인_도입계획.md)
- Seam file:line: [`SfasRcpt_옵션060_영향목록.md`](./SfasRcpt_옵션060_영향목록.md)
- 승인라인 예시: [`수시위험성평가_승인라인_설계예시.md`](./수시위험성평가_승인라인_설계예시.md)
- 스켈레톤: [`예시구현/`](./예시구현/) (BE `be/`, FE `fe/`, 실측 `testbed/`)
- 필수 반영: [`../가설계/SCNT_표준승인_피드백.md`](../가설계/SCNT_표준승인_피드백.md)
- 대상 화면: `src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml` · `...Sub.xml` / SQL: `SfasRegAtRiskasmtRcptSql.xml`
