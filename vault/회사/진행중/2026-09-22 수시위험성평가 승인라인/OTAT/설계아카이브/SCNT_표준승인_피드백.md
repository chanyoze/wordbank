---
title: "표준 승인 — 설계 리뷰 반영 사항 (피드백) 📝"
sidebar_label: "표준승인 피드백"
sidebar_position: 3
date: 2026-07-01
kind: 동결
raw: "RAW-DOC:cip-defg-saas/OTAT/설계아카이브/SCNT_표준승인_피드백.md"
---

# 표준 승인 — 설계 리뷰 반영 사항 (피드백) 📝

> 마일스톤: **[ATMS26-012] 한화오션(주) 상시·수시위험성평가 승인모듈 기능 추가**
> 관련 문서: [발표자료](./SCNT_표준승인_발표.html) · [발표 대본](./SCNT_표준승인_발표_대본.md) · [구현가능성 테스트계획](./구현가능성_테스트계획.md) · 스켈레톤 [`예시구현/`](../구현참고/예시구현/)
> 파일·코드명은 모두 **가제** — 합의 시 확정.
> 작성: 2026-07-02 / 이찬호

리뷰 준비 과정에서 실코드(`src/main/**`) 대조로 확인한 반영 포인트를 기록. **에러로 부팅이 깨지는 블로커는 없음** — 아래는 구현 착수 시 반영할 개선/규약.

| # | 항목 | 성격 | 반영 위치 |
|---|---|---|---|
| 1 | DI 빈 주입 안전성 & 이중 컨텍스트 + 코드식별 단일화 | 규약 + 스테레오타입 조정 + `tgtCode()` 제거(적용완료) | `DcmtSanctionHandler` 등 모든 핸들러 |
| 2 | wframe 버튼 표시요소 호스트 오버라이드 | 기능 추가(seam 확장) | `CommonSanctionButtons.xml` + 호스트 view |
| 3 | 버튼은 사용자가 수행 가능한 것만 노출 | 요구 확인(기존 메커니즘) + 배선 보완 | 코어 플래그 → Bridge `loadStatus` → 버튼 wframe |
| 4 | 조회 경로 공통화 (일반 평문의 승인정보 병합) | 공통화 + N+1 제거 | `CommonSanctionService.mergeSanctionInfo` 부활(파라미터화) |

---

## 1. DI 빈 주입 안전성 & 이중 컨텍스트

### 확인 결과 (실측)
- **`@Autowired CommonSanctionService service`** — 구현체가 `CommonSanctionServiceImpl` **단일** → 타입 주입 유일, `NoUniqueBeanDefinitionException` 없음. ✅
  (근거: `src/main/java/.../module/common/service/impl/CommonSanctionServiceImpl.java` 하나뿐)
- **`@Autowired Map<String, CommonSanctionTargetHandler> handlers`** — 스프링의 "타입 T 전체를 **빈이름 키**로 수집" 기능. 여러 개인 게 정상, 모호성 없음. ✅
- **이중 component-scan** 구조 확인:
  - `context-common.xml`(root): `<exclude-filter @Controller>` → `@Service`·`@Component`·`@Repository` 는 **root**.
  - `dispatcher-servlet.xml`(servlet): `<include-filter @Controller>` + `<exclude-filter @Service>` + `<exclude-filter @Repository>`.

### 반영 사항
1. **핸들러 스테레오타입: `@Component("DCMT")` → `@Service("DCMT")` 로 변경.**
   - 이유: `use-default-filters` 기본 `true` → servlet 스캔이 `@Service`·`@Repository`만 제외하므로 **`@Component`는 servlet 컨텍스트에도 중복 생성**됨(부팅 에러는 아니나 이중 인스턴스).
   - `@Service`는 servlet의 exclude에 걸려 **root 단일 인스턴스**로 정리. 빈이름(= Map 키) `"DCMT"`는 그대로 유지 → Bridge 디스패치 로직 불변.
2. **규약: 핸들러는 절대 `@Controller` 금지.**
   - Bridge(`@Service`)는 root 컨텍스트라 **같은 컨텍스트의 핸들러만** Map 수집. 핸들러를 `@Controller`로 달면 servlet(자식)으로 새어 root Map에서 누락 → 런타임 클릭 시점에 `"등록된 핸들러 없음"` (부팅이 아닌 **런타임 실패**라 더 위험).
3. **규약: 핸들러 빈이름 = `USETGT.TGT_CODE` (유니크).**
   - 두 모듈이 같은 이름(`@Service("DCMT")` 중복)이면 부팅 즉시 `ConflictingBeanDefinitionException` (fail-fast). `TGT_CODE`는 도메인상 이미 유니크 → 규약화로 예방.
4. **코드 식별 = 빈 이름으로 단일화 — `tgtCode()` 메서드 제거 (옵션3 채택, 적용 완료).**
   - **결정**: 핸들러가 자기 코드를 별도 메서드 `String tgtCode()` 로 신고하던 방식을 폐기. 승인대상 코드는 **스프링 빈 이름(`@Service("DCMT")`)** 으로만 표현하고, 그게 곧 Bridge `handlers.get(빈이름)` 디스패치 키.
   - **근거**: `tgtCode()` 는 디스패치에 **미사용**이었음(실제 키는 빈 이름). 예시구현 전체 grep 결과 호출처는 **단위테스트 1곳뿐** → 빈 이름과 값이 겹치는 **중복 선언**. 불일치 검증 훅(`@PostConstruct`)은 애초에 미적용 상태였고, 코드 정체는 **파일명·클래스명·`@Service` 이름으로 충분히 명시**되어 오인 위험 낮음.
   - **적용 범위**: 인터페이스 `CommonSanctionTargetHandler` 에서 `tgtCode()` 제거, `DcmtSanctionHandler` 오버라이드 제거, 관련 테스트 정리. 인터페이스에 **규약 주석** 추가("코드 = 빈 이름, `빈이름 == USETGT.TGT_CODE == FE tgtCode` 3자 일치"). 예시구현 원본 + testbed 양 트리 반영.
   - **검증**: testbed `mvn -o clean verify` **BUILD SUCCESS** (30 tests 통과, jacoco 80% 커버리지 게이트 met). 라우팅 코드 무수정으로 통과 = "디스패치가 `tgtCode()` 를 안 쓴다" 실증.
   - **트레이드오프(수용)**: 빈 이름을 부팅 시 교차검증할 앵커가 사라짐 → `@Service` 전환 시 이름 누락 등 실수는 **부팅이 아닌 런타임(클릭 시점) "등록된 핸들러 없음"** 으로 발견. 위 규약 #2·#3 로 완화. (앵커가 필요해지면 각 핸들러에 `public static final String CODE = "DCMT"; @Service(CODE)` 상수 방식으로 재도입 가능.)

---

## 2. wframe 버튼 표시요소 호스트 오버라이드

### 배경
모듈 view 단계에서 **버튼명 등 표시요소를 모듈별로 바꿀 수 있어야** 함 (예: "승인처리" → "결재승인"). 구현 난이도 낮음 — 현재 스켈레톤에 이미 seam이 열려 있음.

### 반영 사항
- **`CommonSanctionButtons.xml`의 `fnInit`에 `labels`(및 필요 시 `styles`/`tooltips`/`disabled`) 파라미터 추가.** `aSanctionButtons` 단일 설계 유지, `fnApplyFlags`와 동일한 배열 순회 패턴으로 `fnApplyLabels` 추가.
  ```js
  scwin.fnInit = function (oParam) {
    /* 기존 oCtx / bHideAllBtn 세팅 그대로 */
    scwin.fnApplyLabels(oParam.labels || {});   // ← 추가
    scwin.fnApplyFlags(oParam.flags || {});
  };
  scwin.fnApplyLabels = function (oLabels) {
    scwin.aSanctionButtons.forEach(function (oBtn) {
      if (oLabels[oBtn.sId]) scwin[oBtn.sId].setLabel(oLabels[oBtn.sId]); // ※ 캡션 API 확인
    });
  };
  ```
- **호스트 view**는 원하는 모듈만 넘김(안 넘기면 기본 라벨):
  ```js
  oBtns.getWindow().scwin.fnInit({
    tgtCode:"DCMT", demSn:sDemSn, keys:oKeys, guard:{}, fnReload:fnReloadGrid,
    labels: { wbtnAct:"결재승인", wbtnRej:"결재반려" }
  });
  ```

### 확인/경계
- **캡션 변경 API 확인 필요**: WebSquare `<xf:trigger>` 런타임 라벨 변경이 `setLabel()`인지 `setValue()`인지 실브랜치에서 1줄 검증(난이도가 아니라 API 이름 확인 문제).
- **선 긋기**: 라벨·노출·스타일 같은 **오버라이드**는 파라미터로 싸게 처리. 단 **모듈 고유의 새 버튼/동작**을 넣기 시작하면 "버튼 목록은 공통 한 곳" 불변식이 깨짐 → 그 경우는 wframe 대신 **`cips_sanction.js` 헬퍼 직접 호출**(기존 "너무 특수하면 헬퍼로" 탈출구)로.

---

## 3. 버튼은 사용자가 수행 가능한 것만 노출

### 요구
승인 버튼은 **로그인 사용자가 지금 실제로 누를 수 있는 것만** 보여야 함 (예: 결재 차례인 사용자만 "승인처리"·"승인반려", 요청자만 "요청취소").

### 확인 결과 (실측) — 표준 설계가 이미 지원
- **코어가 per-user 플래그 4개 산출**: `DEM_PSBL_TF`·`DEM_CANC_PSBL_TF`·`SANCTN_PSBL_TF`·`CANC_PSBL_TF`. 코어 `selectSanctionDemand`가 `#{SESSION_USER_NO}`를 받아 사용자 기준으로 계산(단순 상태 아님; 예: `Decode(a.SANCTNER_USER_NO, #{SESSION_USER_NO}, ...)`).
  (근거: `sqlmap/mappers/common/CommonSanctionSql.xml`의 `selectSanctionDemand` · `CommonSanctionServiceImpl` L362~365에서 플래그 주입)
- **공용 함수 재사용 가능**: `SFCC_GET_SANCTN_BTN_PSBL_TF(회사, 프로젝트, demSn, #{SESSION_USER_NO}, 액션)` — CESC·DCMT·CCMS 목록화면이 이미 사용자별 버튼 가능여부 판정에 사용. 표준의 단일 기준으로 채택 권장.
- **버튼 wframe은 deny-by-default**: `CommonSanctionButtons.xml`의 트리거가 `style="display:none"` 기본 숨김, `fnApplyFlags`가 `oFlags[sPsblTf] === "T"` 인 것만 `.show()`. 안전측 posture 이미 확보.

### 반영 사항
1. **플래그 배선 보완(스켈레톤 gap)**: 현재 `CommonSanctionBridgeController.selectStatus` 는 `{wdlCfmStep:[...]}` 만 반환하는데, 그리드 wframe `fnReload` 는 `oRes.oFlags` 를 읽음. → **`loadStatus` 가 단계이력 + 코어 per-user 플래그(`oFlags`)를 함께 반환**하도록 배선. (미배선 시 플래그 미도착 → 전 버튼 숨김)
2. **플래그 출처 = 사용자 기준으로 고정**: 상태만 보는 `Decode(STS_CODE,...)` 가 아니라 `selectSanctionDemand`/`SFCC_GET_SANCTN_BTN_PSBL_TF`(`SESSION_USER_NO` 포함) 결과를 사용.
3. **서버측 재검증(2겹 방어)**: 버튼 숨김은 UX일 뿐 — 숨겨도 요청 위조 가능. `applyAction`/`cancel` 시 **코어가 권한·차례를 재검증해 거부**하는지 확인. FE 노출(1차) + BE 거부(2차).
4. **deny-by-default 유지**: 트리거 기본 `display:none` 유지 → 플래그 로드 실패·누락 시 "안 보임"이 안전.

---

## 4. 조회 경로 공통화 — 일반 평문의 승인정보 병합

### 배경
승인 전용 화면(액션)은 Bridge로 공통화하지만, **일반 목록·조회 화면(평문)**도 각 행의 승인상태·버튼가능여부를 **조회 시 함께 심어** 보여줘야 함. 현재는 모듈 서비스가 직접 처리(예: `CescRegCompanyEquipmentSafetyCheckServiceImpl.selectChkList`).

### 확인 결과 (실측)
- **현행 방식(모듈 인라인)의 문제** — `selectChkList` 는 목록 조회 후 **행마다** `sanctionService.selectSanctionDemand(...)` 호출:
  - **N+1 쿼리** (목록 N행 → N+1 쿼리).
  - 키 추출·null 가드 + **~15줄 컬럼 매핑** 보일러플레이트가 모듈·메서드마다 복붙.
- **공통 벌크 버전이 이미 존재하나 방치됨** — `CommonSanctionServiceImpl.mergeSanctionInfo(List)`:
  - 키 전체 수집 → `selectSanctionDemandMap(keys)` **단 1쿼리** → 메모리 병합(= N+1 해소).
  - 주석: *"승인정보 컬럼명이 메뉴마다 달라 공통화 어려움 … 참고용 유지"* → 방치.
  - **방치 진짜 원인 = 입력 키 컬럼명 하드코딩**(`SANCTN_COMPANY_ID`/`SANCTN_PROJ_CODE`/`DEM_SN`, CESC 기준). DCMT(`CFM_DEM_SN`) 등은 그대로 못 씀.
- **장애물은 작다** — **출력 컬럼은 이미 표준**(`mergeSanctionInfo` 가 심는 컬럼 = CESC 인라인이 심는 컬럼과 동일). 가변인 건 **승인 키 3개**뿐.

### 효율 비교
| 축 | A. 모듈 인라인(현행) | **B. 공통 벌크 병합(권장)** | C. SQL 레벨 조인 |
|---|---|---|---|
| 실행(쿼리) | ❌ N+1 | ✅ 2쿼리(목록+벌크) | ✅✅ 1쿼리 |
| 개발/유지보수 | ❌ 메서드마다 15줄 복붙 | ✅ 호출 1줄 | △ 모듈 SQL마다 조인 |
| 표준 정합 | ❌ 액션만 공통·조회 방치 | ✅ Bridge(액션)↔merge(조회) 대칭 | △ Java 가드/가공 재사용 불가 |
| 결합도 | 낮음 | 낮음(키만 파라미터) | 높음(모듈 SQL↔승인 스키마) |

### 반영 사항
1. **`mergeSanctionInfo` 를 파라미터화해 부활** — 입력 승인 키 3개를 모듈이 지정(기본 = 표준명). 나머지(벌크 조회·표준 컬럼 병합)는 공통.
   ```java
   // 표준 조회 병합 — CESC 의 for 루프 + 15줄 put + N+1 을 한 줄로 대체
   sanctionService.mergeSanctionInfo(lResult, keySpec("SANCTN_COMPANY_ID","SANCTN_PROJ_CODE","DEM_SN"));
   ```
2. **Handler 불필요** — 순수 데이터 조인이라 모듈 훅이 필요 없음. 액션 경로(Bridge+Handler)보다 더 가볍게 공통화됨.
3. **인라인(A) 지양** — 신규/전환 건은 B 사용. 기존 인라인은 전환 시 B로 치환.
4. **탈출구(C)** — 초대량·핫 리스트라 2번째 벌크 쿼리조차 부담이면, 공용 함수 `SFCC_GET_SANCTN_BTN_PSBL_TF(..., #{SESSION_USER_NO}, 액션)` 를 모듈 목록 SQL에 인라인해 1쿼리로. 대신 해당 SQL이 승인 스키마에 결합됨. **기본 B, 성능 임계 화면만 C.**

---

## 반영 우선순위
- **구현 착수 시 즉시**: #1 (스테레오타입 `@Service` + 규약) — 와이어링 정확성 직결.
- **구현 착수 시 즉시**: #3 배선 보완 + 서버측 재검증 — 보안/권한 직결(FE 노출 + BE 거부 2겹).
- **표준 1차 구축분**: #4 조회 병합 공통화 — 액션(Bridge)과 함께 조회(merge)까지 넣어야 표준이 완결. `mergeSanctionInfo` 파라미터화 부활.
- **요구 확정 후**: #2 (라벨 오버라이드) — 각 모듈 전환 시 필요분만 파라미터로.
