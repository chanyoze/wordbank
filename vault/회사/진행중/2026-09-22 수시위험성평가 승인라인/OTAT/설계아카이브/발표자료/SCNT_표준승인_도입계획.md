---
title: "수시위험성평가 표준 승인(SCNT) 도입 계획"
sidebar_label: "도입계획 (강등)"
sidebar_position: 1
date: 2026-07-01
kind: 동결
raw: "RAW-DOC:cip-defg-saas/OTAT/설계아카이브/발표자료/SCNT_표준승인_도입계획.md"
---

# 수시위험성평가 표준 승인(SCNT) 도입 계획

> ⚠️ **[강등·아카이브] 이 문서는 인터뷰·계획 단계(Round 1~10) 기록이며, 이후 실제 구현에서 아래 결정들이 번복됨. 현행 기준(SoT)은 `../진행중/SCNT_구현방식_공유.md`.**
> - 범위: Rcpt+Sub 동시 → **Rcpt만**(Sub 백로그)
> - STTS_CD·APPRV_* 전면 폐기(clean-slate) → **STTS_CD 존치 + 소급유지**
> - 상태 숫자 5단계(10~50) → **문자열 6단계**(작성중Null/REG/DEM/PROG/REJ/CMPL)
> - TGT_CODE `SFAS_AT` → **`OTAT`**, 신규컬럼 `STS_CODE` → **`CFM_STS_CODE`**, 승인패널 1개 → **2개(Grid/Button)**
> 인터뷰 결정 근거·이력 추적용으로만 참조.
>
> 상태: **인터뷰·계획 진행 중** (deep-interview)
> 관련 문서: [수시위험성평가_승인라인.md](./수시위험성평가_승인라인_설계예시.md), [../위험성평가_승인흐름.md](../../위험성평가_승인흐름.md)
> 대상 화면: `SfasRegAtRiskasmtRcpt`(원청 접수+승인), `SfasRegAtRiskasmtSub`(협력사 제출)

---

## 1. 목표 / 배경

- **수시위험성평가에 표준 승인관리(SCNT) 모듈 도입.**
- 우선 수시위험성평가에만 적용하되, **다른 모듈도 쉽게 붙일 수 있는 재사용 표준** 수립.
- 현재 수시위험성평가는 **자체 승인 로직**(STTS_CD 30/40/50/60, 공사팀장/안전팀장/현장소장 APPRV_*, 검토의견 게이트 `chkCmtContList`)을 사용 → SCNT 미사용.
- 참조(이미 SCNT 적용): `CescPopRegCompanyEquipmentSafetyCheck`, `DcmtRegPrjtDcmt`(승인 팝업 `DcmtPopRegDcmtConfirm`).
- SCNT ERD: `C:\Users\lch\ref-erd\220. 승인관리 (SCNT)` (승인요청 / 승인템플릿).

---

## 2. 확정된 결정 (Decisions)

| # | 결정 | 내용 |
|---|------|------|
| D1 | **기존 자체승인 → SCNT 완전 대체** | STTS_CD/APPRV_*/검토의견 게이트를 SCNT 단계 승인으로 재구성 |
| D2 | **적용 범위: Rcpt + Sub 동시** (F1 변경) | 원청 접수 + 협력사 제출 양측. 같은 평가서/DEM 공유(TGT_CODE 우선 1개 공유 검토) |
| D3 | **승인라인** | 요청자→공사팀장→안전팀장→대표는 **기본값/예시일 뿐**, 실제 라인은 **회사별 커스텀**(D9). 3단계 고정명칭 없음 |
| D4 | **표준 형태(이사님 협의 반영)**: `js/sanction/cips_sanction.js`(화면 head 개별 include · 객체형 · config.xml 전역 X) + BE `SanctionBridge` + 등록/스캐폴드 가이드 | cips.js·config.xml 코어 불가침 (§5.1, §6) |
| D5 | **A1 승인 단위** | 평가서(REGIS_SEQ) 1건 = DEM 1건. USE_TGT_INFO 키 = `COMPANY_ID·PROJ_CODE·R_COMPANY_ID·REGIS_SEQ` |
| D6 | **A2/A4 기존 승인 자산 전면 정리(clean-slate)** | 기존 컬럼(`STTS_CD`·`APPRV_C/BD/A_USER_NO`·`APPRV_CMT`·`CNL_CMT`) **전부 deprecated**, 기존 승인 옵션(`SFAS_OPT_060/092` 등) → **"NEW 승인 사용여부" 옵션** 대체. 상태는 SCNT 단일 구동. 마이그레이션 = 신규만 SCNT·구데이터 deprecated 유지(옵션 게이트) |
| D7 | **B 워크플로 시맨틱(코드 확인)** | **반려**=SCNT 버전모델(같은 평가서 재요청, 새 회차 X, host코드 불필요) · **승인취소**=SCNT-native(이전단계 복귀) · **협력사 Case1/2**=같은 라인+요청자 동적 · **대리인**=사용(STEP_AGT 네이티브, 전결 ARB_DECIS_TF·병렬 STEP_GRP_NO도 코어 지원) |
| D8 | **C 데이터/마스터** | 호스트 마스터=`TSF_ASSMNT_RECEIVE`(PK 4키). **컬럼 정리(DCMT 패턴)**: `STTS_CD`+`APPRV_*` 접두 deprecated(안보이게), 신규 `STS_CODE`·`CFM_COMPANY_ID`·`CFM_PROJ_CODE`·`CFM_DEM_SN` 추가. **승인라인=기존 현장 관리화면 `BaseRegProjectSanctionLine` 활용**(현장 레벨, 상위 fallback). **USETGT 등록=기존 `SstRegSystemSanctionUseTarget`**. C1 TGT_CODE 값 ⏸미정(공식 명칭 확인) |
| D9 | **추가 결정(Round 9)** | **라인=회사별 커스텀**(기본값 제공, 3단계 고정명칭 없음) · **상태=제네릭 5(DCMT `DcmtRegPrjtDcmt` 패턴), `STS_CODE=10`은 NEW승인 옵션여부와 병행 판단** · **D 컷오버=현장(프로젝트)별 옵션 토글** · **E3=승인패널 wframe `CommonSanctionPanel.xml` 채택**(호스트=내용뷰+패널 한 줄) |

| D10 | **E·잔여 결정(Round 10)** | **E1 BE 위치=`module/scnt`**(Bridge=`SanctionBridgeService`+`Impl`+제네릭 Controller+`SanctionTargetHandler` 인터페이스; CommonSanctionService는 module/common 유지) · **E2 네임스페이스=`cips.sanction`**(파일 `cips_sanction.js`) · **E4 반영=개발자 패치(diff) 제안→팀 합의 시점 직접 반영** · **TGT_CODE=1개 공유**(Rcpt+Sub 같은 평가서/DEM, 잠정 `SFAS_AT`) · **A3/A5=항목별 검토의견 유지(잠정)+`validateBeforeDemand` 게이트** |

| D11 | **옵션 게이트 = `SFAS_OPT_060_003`(NEW 승인 사용여부) — D6 구체화** | 슬롯=**060_003**(060 패밀리 편입 → `SFAS_OPT_060_TF` 상속 공유, 신규 _TF 불필요). **상호배타 확정(사용자 firm)**: 기존결재(`060`)와 SCNT(`060_003`)는 **동시 활성 불가** → `060=T XOR 060_003=T`(둘 다 F=미사용). ⇒ **SCNT 현장은 `060=F`로 저장**. admin UI에서 하나 T 시 다른 하나 자동 F+readonly(양방향). **⚠️ 필수 동반작업**: `060`을 "승인 활성"으로 읽는 **SQL 약 15~20파일·40여 조건절**을 `(060='T' Or 060_003='T')` / `(060='F' And 060_003='F')`로 일괄 수정(안 하면 미승인 노출·라벨 공백). STTS_CD 어휘 호환(20/60·30~60 버킷) 정합 매핑표 선확정. 상세 §5.5 |

> **표시상태 매핑(제네릭 — 라인 커스텀 대응, DCMT 패턴 차용)**: `10` 작성중(REG) / `20` 요청·대기(DEM) / `30` 진행중-어느 단계든(PROG) / `40` 완료(CMPL) / `50` 반려(REJ). 세부 "몇 단계·누구 차례"는 SCNT 단계목록 그리드로 표시. **`STS_CODE=10`은 "NEW 승인 옵션 사용여부"와 함께 판단**(옵션 off=승인 미사용 / on=작성중).

---

## 2.5 결정 어젠다 (안건 정의 + 상태) — A1~F4

> 인터뷰에서 다룬 **모든 안건의 정의와 상태**. (✅확정 / 🟡잠정 / ⏸외부대기). 괄호=관련 결정 ID(§2).

**A. 도메인 매핑**
- **A1** 승인 단위 — ✅ 평가서(REGIS_SEQ)=DEM 1건 (D5)
- **A2** 상태 매핑 — ✅ 제네릭 5상태 / clean-slate (D6·D9)
- **A3** 검토의견 게이트(`chkCmtContList` 위치) — 🟡 항목별 유지 + `validateBeforeDemand` 잠정 (D10, 업무 확인 후 확정)
- **A4** 기존 승인 컬럼 처리 — ✅ 전부 deprecated (D6)
- **A5** per-detail 검토의견 vs SCNT 단계의견(SANCTN_OP) — 🟡 항목별 검토의견 유지 잠정 (D10)

**B. 워크플로 시맨틱**
- **B1** 반려 — ✅ 같은 평가서 재요청(SCNT 버전) (D7)
- **B2** 승인취소 — ✅ SCNT-native 이전 단계 복귀 (D7)
- **B3** 협력사 Case1/2 — ✅ 같은 라인 + 요청자 동적 (D7)
- **B4** 대리인 — ✅ 사용(STEP_AGT) (D7)

**C. 데이터/마스터**
- **C1** TGT_CODE 값 — 🟡 잠정 `SFAS_AT` (사내 공식 명명 대기) (D8)
- **C2** 호스트 테이블/컬럼 — ✅ `TSF_ASSMNT_RECEIVE`, DCMT 패턴(컬럼 정리) (D8)
- **C3** 승인라인 정의 위치 — ✅ 기존 `BaseRegProjectSanctionLine` (D8)

**마이그레이션/컷오버** (※ 클러스터명 — 결정 ID D1~D10과 무관)
- **진행중 데이터** — ✅ 신규만 SCNT, 구데이터 deprecated 유지 (D6)
- **컷오버 단위** — ✅ 현장(프로젝트)별 NEW승인 옵션 토글 (D9)

**E. 공통/표준**
- **E1** BE 공통 위치 — ✅ `module/scnt` (D10)
- **E2** JS 네임스페이스 — ✅ `cips.sanction` (D10)
- **E3** 승인패널 wframe — ✅ 채택(`CommonSanctionPanel.xml`) (D9)
- **E4** 반영 타이밍·소유권 — ✅ 개발자 패치 제안 → 팀 합의 시점 반영 (D10)

**F. 범위/부가**
- **F1** Sub(협력사) 적용 시점 — ✅ Rcpt+Sub 동시 (D2)
- **F2** 승인라인 관리 메뉴 — ✅ 기존 공통(`BaseRegProjectSanctionLine`) 자동
- **F3** 단계 진행 푸시 — ✅ 기존 공통(`sendActPush`) 자동
- **F4** 처리대기함(결재함) — ✅ 기존 공통(`ScntRegSanctionAction`) 모듈횡단 자동

---

## 3. 미결 (Open Questions)

- ~~표준 형태/네이밍 거버넌스(FE)~~ → **협의 완료**(§6: 새 폴더 + `cips_` 파일명 + head 개별 include + 객체형). 남은 것: BE `module/common` 위치 · 네임스페이스 식별자 · 반영 타이밍
- **(A3/A5 — 잠정 결정 D10, 업무 확인 후 확정) 검토의견 단위** — **잠정: 항목별 검토의견 유지(현 방식) + `validateBeforeDemand` 게이트** → 우리가 이번에 고친 per-detail 검토의견 로직 보존. *결재자가 항목별 검토를 실제로 하는가*는 업무(현장/기획) 확인 후 최종 확정(아니면 단계 종합의견으로 단순화).
  - **확인 질문(현장/기획)**: "공사팀장/안전팀장이 실제로 *내용(위험요인)별로* 검토하는가, 단계 종합의견 1개로 충분한가?"
  - **표시 방향(잠정 합의)**: 승인의견(`SANCTN_OP`) 있으면 우선 표시, 없으면 레거시 검토의견 폴백 / 레거시 데이터(`TSF_ASSMNT_RECIVE_CONST/SAFE_CMT`)는 보존.
  - 게이트는 어느 쪽이든 `validateBeforeDemand` 위치.
- ~~상태 매핑(A2)~~ → **결정(D6)**: 기존 승인 컬럼·옵션 전면 deprecated + SCNT 단일 구동. 잔여: 표시용 캐시 컬럼 1개 둘지 vs 순수 SCNT 조회
- ~~진행중 데이터 마이그레이션~~ → **방향 확정(D6)**: 신규만 SCNT, 구 데이터 deprecated 유지(옵션 게이트). 잔여: 컷오버 상세
- ~~3단계 결재자 명칭~~ → **해소(D9)**: 라인이 회사별 커스텀이라 고정 명칭 없음(문서값=기본/예시). [승인라인 문서](./수시위험성평가_승인라인_설계예시.md) 동기화 TODO.
- **(C1 — TGT_CODE) DB 조회 완료** — `TSST_SANCTN_USETGT` 14개 확인(QUICK_ACDNT·ACDNT_RPT·CESC·PERM_H_DEM/RVW/PERM/CMPL·LAMMTG·LAMMTG_AGD·LAMCHK·POINT·HSECHK·SFHL_CHKDAILY·**DCMT**). **위험성평가 엔트리 없음 → 신규 등록 필요.** 관례=대문자 모듈/기능 코드(SFHL_CHKDAILY 등). **권장값 `SFAS_AT`**(또는 `AT_RISKASMT`), 1 코드(흐름 1개), MAX_STEP_CNT~7. 등록은 `SstRegSystemSanctionUseTarget`. → **잠정 `SFAS_AT`로 진행**, 사내 공식 명명규칙 확정 시 교체. **Rcpt+Sub 1개 공유**(D10). 그 외(없음 확인·등록처·관례·MAX_STEP) 확정.
- ~~반려/승인취소 시맨틱~~ → **결정(B 클러스터, D7)**:
  - **반려** = SCNT 기본 모델 — 같은 평가서를 `STS=REJ`+버전업(`updateSanctionDemandVersion`, `_VER`) 후 **요청자가 고쳐 재요청**. ★새 회차(새 평가서) 안 만듦. **host 코드 불필요.**
  - **승인취소** = SCNT-native(`cancelSanction`) — 자기/대리인이 처리한 최근 단계 철회 → 이전 단계 복귀.
  - ⚠️ [승인라인 문서](./수시위험성평가_승인라인_설계예시.md)의 "반려 → 다음 회차 신규 생성"은 본 결정으로 **"같은 평가서 재요청"으로 변경** → 그 문서 동기화 필요(TODO).

---

## 4. SCNT 통합 계약 (조사 결과)

**SCNT = 설정형 승인 워크플로 엔진.** 재사용 코어는 `module/common`의 `CommonSanctionService`.

### 공용 팝업
- `/common/CommonPopRegSanctionOpinion.xml`
- 입력 `oData`: `{ SECT_CODE: "DEM" | "SANCTN" | "REJ" }` (요청/승인/반려)
- 콜백 반환: `{ actionId: "choice"|"cancel", data: "[의견 텍스트]" }` (REJ는 의견 필수)

### 핵심 백엔드
| 구성 | 역할 |
|------|------|
| `CommonSanctionService`(module/common) | 승인요청 CRUD, 라인/단계 조회, 시리얼 생성 — **코어** |
| `ScntRegSanctionActionController/Service`(module/scnt) | 승인처리 진입점, 처리대기 목록 |
| SQL: `selectSanctionLine`/`selectSanctionLineStep` | 승인대상→라인→단계(승인자/대리인) 결정 |
| SQL: `createSanctionDemandSerialNumber` | DEM_SN 생성(SSST_SANCTN_DEM) |
| SQL: `selectSanctionMyDemandList` | 로그인 사용자 처리대기 목록 |

### 핵심 테이블
- `TBASE_SANCTN_DEM` — 승인요청 마스터 (DEM_SN, USE_TGT_SECT_CODE, USE_TGT_INFO=호스트PK JSON)
- `TBASE_SANCTN_DEM_STEP` / `_STEP_AGT` — 단계 이력 / 대리인
- `TBASE_SANCTN_LINE` / `_LINE_STEP` — 승인라인 정의 (SANCTNER_SECT_CODE: RP/PROJ/HQ/APPT)
- `TSST_SANCTN_USETGT` / `_CPN` — 승인사용대상 코드 / 회사별 커스터마이징

### 통합 계약 체크리스트 (새 모듈이 승인 붙이려면)
1. **(Data)** `TSST_SANCTN_USETGT`에 `TGT_CODE` 등록 (예: `SFAS_AT_RISKASMT`)
2. **(Data)** 승인라인 `TBASE_SANCTN_LINE`/`_STEP` 정의
3. **(Data)** 호스트 테이블에 `DEM_SN`(FK) + 상태컬럼(`RCPT_STS_CODE`)
4. **(BE)** 저장 시 승인요청(DEM) 생성, 액션 시 STEP 갱신 + 호스트 상태 동기화
5. **(FE)** 승인 팝업 호출 + 콜백 + submission + 상태/이력 바인딩

> ※ 참조 화면들은 4·5를 **모듈마다 복붙** → 이걸 §5의 표준으로 한 줄화하는 것이 본 계획의 핵심.

---

## 5. 표준 설계 (제안)

원칙: **`cips.js` 코어 불가침** + 얇은 3종 세트.

### 5.1 FE — `cips_sanction.js` (★ 이사님 협의 반영)

- **위치**: `src/main/webapp/js/sanction/cips_sanction.js` — cips.js 폴더(`js/`) 하위에 **새 폴더 `sanction/`**(또는 `SCNT/`)를 만들고 그 안에. (공통 js 폴더 직속 X)
- **파일명**: `cips_` 접두 + 언더스코어 → **사내에서 선언한 커스텀 JS**임을 파일명으로 구분(벤더/프레임워크 파일과 구별).
- **로드**: **config.xml 전역 등록 X.** 승인이 필요한 화면에만 필요하므로, **각 화면 wqxml `<head>`에서 개별 include**:
  ```html
  <script type="text/javascript" src="/js/sanction/cips_sanction.js"></script>
  ```
  (기존 패턴: lightbox/viewer 등 플러그인 js도 화면 head에서 동일하게 include) → 공통 `config.xml` 불가침 + 필요한 화면만 로드.
- **작성 스타일**: WebSquare 한계로 ES6 `class`/`module`은 지양. **cips.js처럼 객체(네임스페이스) 형태**로 작성:
  `cips.sanction = cips.sanction || {}; cips.sanction.request = function(){...}`. (파일명은 `cips_sanction.js`, 내부 네임스페이스는 `cips.sanction` 객체 — 식별자명은 조정 가능)
- **의존**: 전부 cips.js에 기존재 — `cips.openPopup` / `cips.createSubmission`(동적 서브미션) / `cips.executeSubmission` / `cips.msg`.
- **공개 API (stateless 헬퍼)**:
  ```js
  cips.sanction = cips.sanction || {};
  cips.sanction.request   = function(opts) { /* { tgtCode, keys, lineSn?, onDone(demSn), onCancel? } */ };
  cips.sanction.act       = function(opts) { /* { demSn, act:"SANCTN"|"REJ", onDone } */ };
  cips.sanction.loadStatus= function(opts) { /* { demSn|keys, into:dataListId, onLoad } */ };
  // (선택) cips.sanction.cancel(...)  승인취소
  // 내부: 팝업 호출 + createSubmission(제네릭 엔드포인트) + executeSubmission + msg 캡슐화
  ```
- **호스트 화면이 하는 일 (최소)**:
  ```js
  scwin.wbtnSanctionReq_onclick = function() {
      cips.sanction.request({
          tgtCode: "SFAS_AT_RISKASMT",
          keys: { COMPANY_ID, PROJ_CODE, REGIS_SEQ },
          onDone: function(demSn){ cips.loadData(wdlMain, "REGIS_SEQ"); }
      });
  };
  scwin.wbtnSanctionAct_onclick = function(act) {
      cips.sanction.act({ demSn: wdlMain.getCellData(p,"DEM_SN"), act, onDone: ... });
  };
  ```

### 5.2 BE — `SanctionBridge`

**역할**: 호스트 ↔ 승인엔진(CommonSanctionService) 사이의 표준 어댑터 + 오케스트레이터. FE `cips.sanction.*`의 BE 짝.

> **한 줄 요약 (사용자 확인)**: 메뉴마다 지리멸렬하게 복붙되던 **요청·승인·반려·취소** 로직을 한 곳으로 합쳐, 각 모듈은 **작은 핸들러 1개만 선언**하면 제네릭 호출로 전부 처리되게 하는 것.

- **제네릭 엔드포인트**: `/common/sanction/createDemand.do`, `/common/sanction/action.do` (호스트마다 컨트롤러 안 만듦)
- **오케스트레이션 1회**: 라인결정 → DEM 생성 → 단계 기록 → 다음단계/종결 → 상태동기화
- **확장점(Hook) 디스패치**: 모듈별 다른 부분만 핸들러로 분리

```java
// 호스트가 구현하는 작은 훅
public interface SanctionTargetHandler {
    String tgtCode();                              // "SFAS_AT_RISKASMT"
    void onDemandCreated(SanctionContext ctx);     // 호스트 상태: 요청중/승인대기
    void onActionApplied(SanctionContext ctx);     // 승인/반려 결과 → 호스트 상태 + 후처리
    default void validateBeforeDemand(SanctionContext ctx) {}  // 선택: 도메인 검증
}

// Bridge: Map<String, SanctionTargetHandler> 자동주입 → if/switch 없이 tgtCode로 디스패치
@Service class SanctionBridgeService {
    Map<String, SanctionTargetHandler> handlers;   // 개방-폐쇄
    CommonSanctionService core;                    // 기존 엔진 재사용
    long createDemand(req){ h.validateBeforeDemand(); core.insertSanctionDemand(); h.onDemandCreated(); }
    void applyAction(act){ core.recordStep(); handlers.get(tgtCode).onActionApplied(); }
}
```

**개선점 (before/after)**

| | AS-IS | TO-BE(Bridge) |
|---|---|---|
| 엔드포인트 | 모듈마다 자기 컨트롤러 | 제네릭 1쌍 공용 |
| 승인 흐름 | 화면마다 복붙·불일치 | 한 곳 1회·전 모듈 동일 |
| 새 모듈 비용 | 컨트롤러+글루+FE 전부 | **핸들러 1개** + tgtCode 등록 |
| 버그 수정 | 화면마다(누락 위험) | Bridge 한 곳 → 전체 반영 |
| 도메인 검증 | 화면 JS에 흩어짐 | `validateBeforeDemand` 표준 위치 |

> **완전 대체 연결**: 기존 `chkCmtContList`(검토의견 게이트) → `validateBeforeDemand` 훅으로 이전. STTS_CD → SCNT 단계 진행 + `onActionApplied`에서 `RCPT_STS_CODE` 매핑.
> **확인 필요**: `CommonSanctionService`가 라인 자동결정·단계 자동생성·종결판단을 어디까지 해주는지 → 구현 시 코드로 확인해야 Bridge 두께 결정.

#### 5.2.1 DCMT before / after (실제 코드 — "메뉴마다 복붙"의 정체)

**BEFORE** — `DcmtPopRegDcmtConfirmServiceImpl`(CESC 등도 동일 패턴):
- `save()`에서 승인요청/단계를 rowStatus(C/U/E)로 직접 CRUD (~50줄: `insertSanctionDemand`/`insertSanctionDemandStep`/update/delete)
- 액션 진입점 **5개**(`trscCfmDem`·`trscCfmAct`·`trscCfmRej`·`trscCfmCanc`·`trscCfmDemCanc`) → 래퍼 2개(`cfmAndUpdateStsCode`=`actSanction`+`updateStsCode`, `cancelAndUpdateStsCode`=`cancelSanction`+`updateStsCode`)
- tgtCode `"DCMT"` 하드코딩 + Controller 5개 + FE 5 submission
- → **이 덩어리가 모듈마다 거의 그대로 복붙.**

**AFTER** — 호스트 신규 코드 = 핸들러 1개:
```java
@Component("DCMT")
public class DcmtSanctionHandler implements SanctionTargetHandler {
    public String tgtCode(){ return "DCMT"; }
    public void onDemandCreated(SanctionContext c){ /* 상태=요청중 + DEM_SN */ }
    public void onActionApplied(SanctionContext c){ updateStsCode(c); }  // ← 옛 updateStsCode 이전
    public void validateBeforeDemand(SanctionContext c){ /* 선택 */ }
}
```
| 사라짐 | 어디로 |
|---|---|
| trscCfmDem/Act/Rej/Canc/DemCanc 5개 | 제네릭 `/common/sanction/action.do`(Bridge.applyAction) |
| `save()`의 DEM/STEP rowStatus CRUD | `Bridge.createDemand` |
| `cfmAndUpdateStsCode`/`cancelAndUpdateStsCode` 래퍼 | `Bridge.applyAction`/`cancel`(actSanction/cancelSanction + 훅) |
| tgtCode `"DCMT"` 하드코딩 | 파라미터 + 핸들러 키 |
| FE 5 submission/handler | `cips.sanction.request/act/cancel` |

> 실측 확인된 코어 메서드(`CommonSanctionService`): `selectDefaultSanctionLineStep`, `createSanctionDemandSerialNumber`, `insertSanctionDemand`, `insertSanctionDemandStep`(배치), **`actSanction`(승인/반려 1콜·종결판단 포함)**, `cancelSanction`. → Bridge는 이들 **조합 + 호스트 훅**일 뿐(이미 참조화면이 하던 걸 공통화).

### 5.3 등록·스캐폴드 가이드 (체크리스트)

| 분류 | 항목 |
|------|------|
| Data | ① USETGT에 TGT_CODE 등록 ② 승인라인 LINE/STEP 정의 ③ 호스트 테이블 DEM_SN+상태컬럼 |
| BE | `SanctionBridge`에 그 tgtCode `SanctionTargetHandler` 1개 구현·등록 |
| FE | (config.xml 이미 로드됨) 화면에 버튼+상태그리드 + `cips.sanction.*` 호출 |
| Scaffold | "승인 탑재 화면" 6파일 템플릿 + 위 체크리스트 문서화 |

### 5.4 승인 화면(팝업) 디자인 — 내용 뷰 vs 표준 메커닉

승인 팝업은 "의견만"이 아니라 **승인할 문서 내용을 보여주고 거기서 수정**까지 함(DCMT/CESC). 두 관심사를 분리:

| 관심사 | 표준화 | 담당 |
|---|---|---|
| **A. 문서 내용 뷰**(표시·편집) | ❌ 본질적으로 모듈마다 다름 | 모듈 고유 |
| **B. 승인 메커닉**(의견팝업·상태/단계 이력·승인/반려/취소 버튼) | ✅ 동일 | 표준 |

→ **승인 화면 = [모듈 고유 내용 뷰] + [표준 승인 메커닉]**. 모듈은 A만 짜고 B는 표준 드롭인.

**표준 제공(B)**:
- `cips_sanction.js` 버튼 호출: `cips.sanction.request/act/cancel(...)`
- 공용 의견 팝업 `CommonPopRegSanctionOpinion`(기존)
- 상태/단계 이력: `cips.sanction.loadStatus({ demSn, into: gridId })`
- 버튼 노출 규칙(단계/권한): `cips.sanction.resolveButtons(...)` 헬퍼로 표준화(모듈별 if 제거)

**모듈이 하는 일(A + 연결)**: 내용 뷰 배치 + `keys` 추출 함수 1개 + 버튼을 `cips.sanction.*`에 연결.

**권장 — "승인 패널" 드롭인**: 재사용 wframe `CommonSanctionPanel.xml`(상태그리드+버튼+헬퍼연결)을 호스트가 한 줄로 임베드:
```xml
<w2:wframe src="/common/CommonSanctionPanel.xml" id="wfrmSanction" />  <!-- {tgtCode, demSn, keys}만 전달 -->
```
(wframe은 WebSquare 네이티브 재사용 → class/module 제약 무관) → **새 모듈 승인화면 = "내용 뷰 + `<승인패널/>` 한 줄".**

---

### 5.5 옵션 게이트 — `SFAS_OPT_060_003` (NEW 승인 사용여부) (D11)

수시 현장별로 **기존 결재 ↔ SCNT 표준승인**을 선택하는 토글. D6("NEW 승인 옵션 대체")·D9("현장별 옵션 컷오버")의 물리적 구현.

**슬롯 결정 — `SFAS_OPT_060_003`**
- 옵션 관리 화면(`CcmsRegSfasOptionByProjManager` 등)에서 `060` 패밀리(060 / 060_001 / 060_002)에 **060_003 추가**.
- 회사→현장 상속은 마스터 하나 `SFAS_OPT_060_TF`가 **패밀리 전체를 Decode로 함께 제어** → **060_003 전용 _TF 불필요**(회사레벨 Decode 3줄에 1줄 추가).
- 프로젝트 레벨은 _TF 없이 직접 컬럼값.

**시맨틱 — 상호배타(사용자 firm 확정). 060과 060_003 동시 활성 불가.**

| 상태 | `SFAS_OPT_060` | `SFAS_OPT_060_003` | `060_001/002` |
|---|---|---|---|
| 기존 결재 사용 | `T` | `F` | 사용(입력 가능) |
| **SCNT 표준승인 사용** | **`F`** | `T` | 무의미 → readonly |
| 승인 미사용 | `F` | `F` | readonly |

- 핵심: **SCNT 현장은 `060=F`로 저장됨**(상호배타의 직접 결과). "060과 060_003 둘 다 T" 상태는 **admin UI에서 원천 차단**.
- `060` 컬럼은 **여전히 "기존 결재 엔진 on/off" 의미**(엔진 재해석 안 함) → 사용자 멘탈모델과 일치.

**상호배타 UI (admin 화면)** — 기존 옵션91↔117 배타 패턴 재사용(양방향):
```
onOptionChange( asOptCode == "SFAS_OPT_060" ):        // 기존결재 켜면 SCNT 끄고 잠금
  if(060 == "T"){ set(060_003,"F"); setReadOnly(060_003, true) }
  else          { setReadOnly(060_003, false) }

onOptionChange( asOptCode == "SFAS_OPT_060_003" ):    // SCNT 켜면 기존결재+검증 끄고 잠금
  bScnt = (060_003 == "T")
  if(bScnt){ set(060,"F") }
  setReadOnly(060, bScnt)
  setReadOnly(060_001, bScnt); setReadOnly(060_002, bScnt)
  // 안내: "기존 결재와 표준승인(SCNT)은 동시에 사용할 수 없습니다."
```

**⚠️ 필수 동반작업 (상호배타의 대가) — SQL "승인 활성" 판정 일괄 수정**

`060=F`로 저장되므로, `060`을 "**승인 활성**"으로 읽는 모든 SQL이 SCNT 현장을 "승인 없음"으로 **오판** → 반드시 `060_003`을 함께 보도록 수정:
- `SFAS_OPT_060 = 'T'`  →  `(SFAS_OPT_060 = 'T' Or SFAS_OPT_060_003 = 'T')`   — 승인 활성
- `SFAS_OPT_060 = 'F'`  →  `(SFAS_OPT_060 = 'F' And SFAS_OPT_060_003 = 'F')` — 승인 없음

대상(실측): **약 15~20 SQL 파일 / 40여 조건절**
- 노출필터 `And (060='F' Or STTS_CD In('20','60'))`: `SfasPopRegAtRiskAsmt`·`CooperationAtRiskAsmt`·`CooperationFirstAssmnt`·`FirstAssmnt`·`Company/CooperationNoneEmphasisItem`·`SafetyOperationPermissionTypeH{RiskAssessment,Wbs,PreviousItem}`·`SafetyOperationRiskAssessmentPrevious` 등
- 상태라벨 `Case When 060='T' And STTS_CD=… Then`: `Ccms/Sfas/SupvRegCompanyDisasterCase`·`{Sfas,Supv}InqCompanyAnytimeRiskAssessment`·`SfasRegAtRiskasmtRcptSql`·`SfasPopRegTbmNonDailySafetyMeeting(+BType)` 등

**STTS_CD 어휘 호환** — 위 수정 후에도 `STTS_CD In('20','60')`·라벨 버킷(30/40/50/60)이 성립하려면 SCNT 상태가 이 어휘와 호환돼야 함:
- **(a) 권장**: SCNT `STS_CODE`↔레거시 `STTS_CD` **호환 매핑을 host update가 유지**(쿼리 버킷 그대로).
- (b) 대안: 각 쿼리에 `060_003` 분기로 SCNT 상태버킷 별도 처리.
→ §2 D9 제네릭5상태(10/20/30/40/50)와 STTS_CD 버킷(20/60·30~60)의 **정합 매핑표를 구현 착수 전 확정**.

**영향 범위 (blast radius)**

| 구분 | 대상 | 작업 |
|---|---|---|
| DDL | 옵션 저장 테이블(회사/현장) | `SFAS_OPT_060_003` 컬럼 추가(default `'F'`) |
| 옵션 admin | `CcmsRegSfasOptionBy{Proj,ProjManager,Company,CompanyManager}` (4 xml + 4 Sql) | 컬럼def·그리드셀·상세input·상호배타 JS·select/insert/update, 회사 Decode에 1줄 |
| 옵션 전파 SQL | `CcmsRegCompanyDeptCodeType2`·`CcmsRegDeptCode`·`CcmsRegSdAllProjCompany` Sql | INSERT…SELECT 컬럼리스트에 060_003 추가(신규 회사/부서/현장 승계) |
| 소비(엔진분기) | `SfasRegAtRiskasmtRcpt`/`Sub` + 공용 승인팝업 | 상태-write·승인-action을 `060_003=='T'` → SCNT로 분기 |
| 소비(SQL 정합) | 위 STTS_CD 20~30곳 | 매핑(a) 유지 확인 또는 분기(b) |

---

## 6. 네이밍 / 거버넌스 — 이사님 협의 결과

공통 파일(cips.js 등)은 **이사님(부장님)이 전적으로 관리**. 협의 결과:

### ✅ 협의 완료 (반영됨)
1. **위치**: cips.js 폴더(`js/`) 하위에 **새 폴더**(`sanction/` 또는 `SCNT/`)를 만들고 그 안에 js 파일.
2. **파일명**: `cips_` 접두 + 언더스코어(예: `cips_sanction.js`) — 사내 선언 JS 구분용.
3. **로드 방식**: **`config.xml` 전역 등록 X.** 승인 필요한 화면에만 필요 → **각 화면 `<head>`에서 개별 include.** (전역 부담 회피)
4. **작성 스타일**: WebSquare 한계로 `class`/`module` 지양 → **cips.js처럼 객체(네임스페이스) 형태**로 작성.

→ 결과적으로 **`config.xml` 미수정 + cips.js 코어 미수정**. 공통 영역 변경 최소(새 폴더/파일 추가 + 화면 head include만).

### ✅ E 결정 (Round 10 — 이사님 확인 없이 진행 합의)
- **E1 BE 위치 = `module/scnt`** (Bridge=Service+Impl+제네릭 Controller+Handler 인터페이스; `CommonSanctionService`는 module/common 유지)
- **E2 네임스페이스 = `cips.sanction`** (파일 `cips_sanction.js`)
- **E4 반영 = 개발자가 패치(diff) 제안 → 팀이 합의된 시점에 직접 반영** (저강도 프로세스)
- **E3 = 승인패널 wframe 채택**(D9)

---

## 7. 승인라인 (확정 — 상세는 별도 문서)

요청자 → 공사팀장 → 안전팀장 → 대표 (4단계). 반려/승인취소 시맨틱 포함.
→ **[수시위험성평가_승인라인.md](./수시위험성평가_승인라인_설계예시.md) 참조** (Case 1 협력사 있음 / Case 2 협력사 없음, 플로우차트).

---

## 8. 인터뷰 로그

### Round 1 — 기반 4분기
| 질문 | 답 |
|------|----|
| 기존 자체승인 처리 | **SCNT로 완전 대체** |
| 표준 형태 | (보류 → 상세설명 요청) |
| 첫 적용 범위 | **Rcpt(원청)만** |
| 승인라인 정의 | **기존 역할 → SCNT STEP 매핑** |

### Round 2 — 표준 형태 상세
- cips.js 코어 수정 우려 → **별도 파일(cips 네임스페이스 확장, 코어 불가침)** 로 해소.
- 파일 위치/로드/내부 API/호스트 사용법 구체화 → §5.1.
- `SanctionBridge` 용도·역할·개선점 구체화 → §5.2.
- 네이밍/거버넌스는 이사님 협의로 → §6.

### Round 3 — 이사님 협의 결과 반영
- 위치: `js/` 하위 **새 폴더**(`sanction/`)에 js 파일.
- 파일명: **`cips_` 접두 + 언더스코어**(`cips_sanction.js`) — 사내 선언 JS 구분.
- 로드: **config.xml 전역 X → 화면 `<head>` 개별 include**(승인 필요 화면만).
- 스타일: WebSquare 한계로 class/module 지양 → **cips.js식 객체 형태**.
- → §5.1·§6·D4 갱신. (BE 공통 위치·네임스페이스 식별자·반영 타이밍은 남은 협의)

### Round 4 — Bridge 구체화 + DCMT before/after + 승인화면 디자인
- `CommonSanctionService` 실제 API 확인(actSanction/cancelSanction/insert·selectDefaultSanctionLineStep 등 전부 존재) → Bridge feasibility 입증(이미 참조화면이 조합 중, 공통화일 뿐).
- 사용자 이해 확인: **"메뉴마다 복붙되던 요청/승인/반려/취소를 한 곳으로 합쳐, 핸들러 1개 선언으로 호출"** = 정확.
- DCMT 실제 before/after 정리 → §5.2.1.
- 승인 화면은 "내용 뷰(모듈)"+"승인 메커닉(표준)" 분리, 승인패널 wframe 드롭인 → §5.4.

### Round 5 — A. 도메인 매핑
- **A1 승인 단위**: 평가서(REGIS_SEQ) 1건 = DEM 1건 확정 → D5.
- **A2/A4 기존 승인 자산**: clean-slate — 기존 승인 컬럼·옵션 전부 deprecated, "NEW 승인 사용여부" 옵션으로 토글, SCNT 단일 구동 → D6. (마이그레이션도 신규만 SCNT로 방향 확정)
- 다음: A3(검토의견 게이트/검토의견 자체 위치) · A5(검토의견 vs SANCTN_OP).

### Round 6 — A3/A5 검토의견 (⏸ 보류)
- per-detail 검토의견 vs SCNT 단계의견(SANCTN_OP) **granularity 결정 = 업무 확인 필요로 보류.**
- 핵심 질문: "결재자가 내용(위험요인)별 검토를 실제로 하는가 / 단계 종합의견 1개로 충분한가."
- 잠정 합의: 레거시 데이터 보존 + 승인의견 있으면 우선 표시(폴백), 게이트는 validateBeforeDemand.
- → A 클러스터: A1·A2·A4 확정 / A3·A5 보류. 다음은 B(워크플로 시맨틱).

### Round 7 — B. 워크플로 시맨틱 (코드 확인 + 인터뷰)
- 코드 확인: SCNT `actSanction`/`cancelSanction` 프로시저 정독 → DEM 상태기계(REG/DEM/PROG/CMPL/REJ), 반려=버전업(updateSanctionDemandVersion), 승인취소=최근단계 철회, 대리인(STEP_AGT)·전결(ARB_DECIS_TF)·병렬(STEP_GRP_NO) 네이티브 지원 확인.
- **B1 반려**: 같은 평가서 재요청(SCNT 버전모델) 선택 → 새 회차 안 만듦, host코드 불필요. (승인라인 문서의 "다음 회차 신규"는 이 결정으로 변경 — 문서 동기화 TODO)
- **B2 승인취소**: SCNT-native로 충분(이전 단계 복귀).
- **B3 협력사 Case1/2**: 같은 라인 + 요청자=작성자 동적.
- **B4 대리인**: 사용(SCNT 네이티브).
- → D7. B 클러스터 전부 확정.

### Round 8 — C. 데이터/마스터 (코드 조사 + 인터뷰)
- 조사: 호스트 마스터=`TSF_ASSMNT_RECEIVE`, 승인사용대상/승인라인은 **기존 관리화면 존재**(`SstRegSystemSanctionUseTarget`, `Sst/Ccms/BaseRegXxxSanctionLine` 3레벨) → 새 관리화면 불필요.
- **C2**: DCMT 패턴으로 `STTS_CD`+`APPRV_*` deprecated + 신규 `STS_CODE`·`CFM_COMPANY_ID`·`CFM_PROJ_CODE`·`CFM_DEM_SN` 추가(= 표시상태 캐시컬럼, A2 잔여 닫힘).
- **C3**: 기존 `BaseRegProjectSanctionLine`(현장 승인라인 관리) 활용.
- **C1**: TGT_CODE 값 ⏸미정(공식 명칭 확인) → USETGT 등록값 조회로 해결 가능.
- → D8. C 클러스터 C2·C3 확정 / C1 보류.

### Round 9 — F·E·보류 일괄 (코드 확인 + 인터뷰)
- 코드 확인: F2 승인라인관리(`BaseRegProjectSanctionLine` USE_TGT 제네릭)·F3 푸시(`sendActPush` 자동)·F4 결재함(`ScntRegSanctionAction` 모듈횡단) **전부 기존 공통으로 자동** → USETGT 등록만 하면 됨.
- **F1**: Rcpt + Sub **동시** 적용(D2 변경).
- **라인 커스텀**: 회사별로 라인 설정 → 3단계 고정명칭 없음(보류 해소), **상태 매핑을 제네릭 5로 전환**(DCMT 패턴, STS_CODE=10+옵션 병행).
- **D 컷오버**: 현장(프로젝트)별 NEW승인 옵션 토글.
- **E3**: 승인패널 wframe `CommonSanctionPanel.xml` 채택(상세 설명 후 결정).
- → D9. 잔여 외부대기: A3/A5(업무)·C1값(사내 명명)·E1/E2/E4(이사님).

### Round 10 — E·잔여 일괄 (이사님 확인 없이 진행 합의)
- **E1 BE 위치 = module/scnt** (Bridge = Service+Impl+제네릭 Controller+Handler 인터페이스; "주로 Service" 형태 설명 후 사용자 lean 확정. CommonSanctionService는 common 유지).
- **E2 = cips.sanction** / **E4 = 패치 제안→팀 합의 반영**.
- **TGT_CODE = 1개 공유**(Rcpt+Sub 같은 평가서/DEM, 잠정 SFAS_AT).
- **A3/A5 = 항목별 검토의견 유지(잠정)** + validateBeforeDemand(업무 확인 후 확정).
- → D10. **인터뷰로 결정 가능한 항목 전부 종료.** 잔여=업무확인(A3/A5 최종)·사내명명(C1값)·구현 착수 시 Bridge 두께 정밀확인.

---

## 9. 다음 할 일

- [ ] **검토의견 게이트** 처리 결정 (validateBeforeDemand 훅 vs 별도)
- [ ] **상태 매핑** 설계 (STTS_CD ↔ SCNT 단계 ↔ RCPT_STS_CODE)
- [ ] **반려/승인취소** SCNT 구현 방식 (회차 신규생성/이전단계 복귀)
- [ ] **마이그레이션** 정책 (진행중 데이터)
- [x] **이사님 협의(FE)** — 폴더/파일명/head include/객체형 확정 (§6). 남은: BE common 위치·네임스페이스 식별자·반영 타이밍
- [ ] `CommonSanctionService` 실제 제공 범위 코드 확인 → Bridge 두께 확정
- [ ] USETGT/승인라인 데이터 정의 + 호스트 테이블 컬럼 설계
