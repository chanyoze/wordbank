---
title: "승인 모듈 재사용 표준화 — 발표 대본 (스피커 노트)"
sidebar_label: "발표 대본"
sidebar_position: 2
date: 2026-07-01
kind: 동결
raw: "RAW-DOC:cip-defg-saas/OTAT/설계아카이브/발표자료/SCNT_표준승인_발표_대본.md"
---

# 승인 모듈 재사용 표준화 — 발표 대본 (스피커 노트)

> 발표자료: [SCNT_표준승인_발표.html](./SCNT_표준승인_발표.html) (좌우 화살표 ←/→, **14장**)
> 마일스톤: **[ATMS26-012] 한화오션(주) 상시·수시위험성평가 승인모듈 기능 추가**
> 이번 발표 = **공통화·재사용 표준에 집중** (상시·수시 적용 상세는 별도).
> 파일·코드명(`cips_sanction.js`·`CommonSanctionBridge`·`SFAS_AT` 등)은 모두 **가제** — 합의 시 확정.
> 대상: 파트 리더 리뷰.
> **진행 방식: 슬라이드는 가볍게 리뷰 → 코드는 IDE로 직접 시연.** 파일별 시연 가이드 = 맨 아래 **[부록 A. 코드 직접 시연 가이드](#부록-a-코드-직접-시연-가이드)**.

---

## 1. 표지 — 승인 모듈, 재사용 표준으로 재편

- 한화오션 작업으로 도입된 **승인 프로세스(이하 "승인 모듈")** 가 이미 있습니다. 이번 작업은 새 도입이 아니라, 그걸 **다른 모듈도 손쉽게 붙일 수 있는 재사용 표준으로 재편**하는 것.
- 한 가지 약속: **프레임워크 코어 `cips.js`는 손대지 않습니다.**

## 2. 배경① — 왜 승인을 공통화하나 (FE)

- CESC·DCMT의 화면 스크립트(`onDataLoad`) 안 기본승인단계 생성 코드. 노랑(`SANCTNER_*`·`ARB_DECIS_TF`)이 **두 모듈 완전 동일**, 파랑만 차이.
- 즉 거의 같은 승인 코드를 메뉴마다 복붙. 한 곳만 누락·오타 나도 버그.

## 3. 배경② — 백엔드 컨트롤러도 똑같이 복붙

- 화면만이 아니라 승인 처리 컨트롤러도 모듈마다 동일 보일러플레이트. 파랑(URL·메서드·서비스 호출)만 다름.
- 모듈당 5벌(`trscCfmDem/Act/Rej/Canc/DemCanc`) + 서비스까지 반복. → 그래서 공통화가 필요.

## 4. 구현 계획 (핵심 방향)

- **전략**: 자체 승인 → **표준 승인 모듈로 전환(신규 건)**. 원청(Rcpt)+협력사(Sub) 동시.
- **표준 형태**: FE = 헬퍼 `cips_sanction.js` + **그리드·버튼 wframe**(`CommonSanctionGrid`·`CommonSanctionButtons`) / BE = `CommonSanctionBridge` + 모듈별 `CommonSanctionTargetHandler` / 가이드 = 등록·스캐폴드 가이드(ref-document 브랜치에 사용 가이드 문서 기입 예정).
- **도메인**: 승인 단위 = 평가서 1건. 상태 = 기존 DCMT 5단계 그대로(다음 장).
- **워크플로우**: 기존 승인 모듈 워크플로우 그대로 채용 — 추가 구현 거의 없음.
- **데이터**: 호스트 `TSF_ASSMNT_RECEIVE`. 승인라인 등은 기존 `CommonSanctionService` 로직 그대로.
- **전환(중요)**: 기존 **옵션60**(결재프로세스)을 **덮어쓰지 않습니다.** 값을 추가 — **60-1 = 기존 AS-IS 결재 프로세스 유지**, **60-2 = 신규 승인 모듈 부착**. 현장별 토글, **신규 건만** 적용.
  - 각주: **60-2**는 공사팀장→안전팀장→현장소장으로 고착됐던(60-1) 라인을, 사용자가 **원하는 승인라인으로 설정** 가능.

## 5. 상태값은 기존 DCMT 방식 그대로 (5단계)

- 새로 만들지 않고, **DCMT·CESC가 이미 쓰는 `STS_CODE` 5단계**를 그대로 채용.
- 10 요청대기 → 20 승인대기 → 30 승인중 → 50 승인완료 / 40 승인반려.
- 호스트 `updateStsCode`가 SCNT 코어 단계상태를 매핑: **REG→10 · DEM→20 · PROG→30 · REJ→40 · CMPL→50**.
- 승인 미사용(옵션 off, 즉 60-1)이면 10 = 등록완료.

## 6. 표준 아키텍처 — 한 번 만들고 재사용

- **FE**: 호스트 화면(내용 뷰는 모듈 담당자 직접 구축) → **그리드·버튼 wframe 2개**를 배치·연결 → wframe이 `cips_sanction.js`(로직) 호출. wframe = 로직과 화면을 잇는 **교두보**(버튼은 그리드와 **분리** 배치).
- **BE**: `CommonSanctionTargetHandler`(모듈당 1개) → `CommonSanctionBridge`(오케스트레이터) → `CommonSanctionService`(코어, 이미 존재).
- 초록 = 기존 코어 그대로, 그 외 = 새로 추가하는 얇은 층(가제). `cips.js`·`config.xml` 미수정.

## 7. 새로 만드는 건 딱 세 조각 (코드 미리보기)

- 모듈이 새로 쓰는 코드는 이게 전부: ① FE 호출 `cips.sanction.request/act` · ② BE 핸들러 `CommonSanctionTargetHandler` 1개 · ③ 화면 `<wframe>` **2개(그리드/버튼)**.
- 공통이 자동 제공: 제네릭 엔드포인트 1쌍 · 의견 팝업(기존 `CommonPopRegSanctionOpinion`) · 상태/단계 이력 · 승인라인·결재함·푸시.

## 8. 표준 상세 ① FE — cips_sanction.js (가제)

- 코어 미수정, `cips` 네임스페이스만 확장하는 얇은 헬퍼.
- 위치 `js/sanction/`, config.xml 전역 X(화면 head 개별 include), 객체(네임스페이스)형, 의존은 전부 기존 `cips.*`.
- 공개 API: request / act / loadStatus / cancel. 화면 JS가 수십 줄 → 몇 줄.

## 9. 표준 상세 ② 승인 wframe — 그리드·버튼 분리 (가제)

- wframe = 다른 화면(.xml)을 한 줄로 끼우는 재사용 조각. 신설 공통 **`CommonSanctionGrid.xml` + `CommonSanctionButtons.xml` 2개로 분리**(의견 팝업은 기존 공용 재사용).
- 승인 화면 = [모듈 내용 뷰] + [승인 **그리드** wframe] + [승인 **버튼** wframe]. **버튼은 그리드에 붙지 않고 독립 배치** — 화면마다 버튼 위치가 다를 수 있어서.
  - **Grid** = 상태·단계 이력 그리드. **Buttons** = 승인/반려/취소 버튼 + 노출 규칙 + 공용 의견 팝업(버튼 목록은 한 곳에서 설정).
  - 호스트가 하는 일 = 내용 뷰 배치 + wframe 2개 임베드 + `{tgtCode, demSn, keys}` 전달 + 둘 연결(액션→그리드 리로드).
- 적용 범위·한계(구현 시 검증): 두 wframe은 표준 메커닉만. 내용 뷰·모듈 특수규칙(예: 협력사 권한)은 파라미터/훅. 너무 특수하면 `cips_sanction.js` 헬퍼 직접 호출(wframe=편의 / 헬퍼=보장).

## 10. 표준 상세 ③ BE — CommonSanctionBridge (가제)

- 호스트 ↔ 코어 사이 어댑터+오케스트레이터. 3층: ① 제네릭 Controller(공용 1쌍) → ② `CommonSanctionBridgeService`(@Service, module/common, `tgtCode`로 디스패치, **if/switch 없음**) → ③ `CommonSanctionService`(코어, 수정 X) + `CommonSanctionTargetHandler`(모듈당 1개 훅).
- 디스패치는 `Map<String, Handler> handlers` 에 스프링이 빈이름(=tgtCode)으로 자동 주입 → `handlers.get(tgtCode)` 한 줄.
- 새 모듈 = Handler 1개 추가, Bridge·Controller·Core 무수정(개방-폐쇄). "새 마법이 아니라 복붙의 공통화."

## 11. 표준 상세 ③ BE — DCMT의 Select·Trsc가 전부 어디로 가나 (실측)

> 사용자 질문 정면 답변: 컨트롤러의 승인 Select·Trsc가 전부 어떻게 처리되나.

- **승인 Select(3개)는 이미 전부 코어 호출**: `selectCdStdCfmStep`→`selectDefaultSanctionLineStep`, `selectCfmList`→`selectSanctionDemand`, `selectCfmStepList`→`selectSanctionDemandStep`. → 제네릭 조회 / `cips.sanction.loadStatus`로.
- **승인 Trsc(5개)는 전부 "코어 + updateStsCode" 두 줄**:
  - `trscCfmDem/Act/Rej` → `cfmAndUpdateStsCode` = `cfmService.actSanction(m)` + `updateStsCode(m)`
  - `trscCfmCanc/DemCanc` → `cancelAndUpdateStsCode` = `cfmService.cancelSanction(m)` + `updateStsCode(m)`
  - → **코어(actSanction/cancelSanction) = Bridge로, `updateStsCode`(상태매핑) = Handler로.**
- **문서 고유만 호스트에 남김**: `selectDocInfo`·조회 권한 검증·문서 `save`.
- 핵심: 컨트롤러·서비스가 이미 코어 위 얇은 래퍼라, 표준화 = 그 래퍼를 공통으로 끌어올리는 것.

## 12. 파일로 보면 — 공통은 1번, 모듈은 핸들러 1개

- **신규 = 공통 7개(전체 1회만) + 모듈당 1개.**
  - 공통 7: `CommonSanctionTargetHandler`/`BridgeService`/`BridgeServiceImpl`/`BridgeController` + `cips_sanction.js` + `CommonSanctionGrid.xml` + `CommonSanctionButtons.xml`.
  - 모듈당 1: `DcmtSanctionHandler.java`(훅만, SQL 0줄 — 기존 매퍼만 호출).
- Handler는 실측 분석 반영(v2)해 **쓰기(onDemandCreated/onActionApplied) + 읽기(canView 보안게이트·onStatusLoaded 가공)·완료후속(onCompleted)** 훅까지.
- 호출 흐름: 버튼 → `/common/sanction/action.do` → **Bridge**(`service.actSanction` + `handlers.get("DCMT").onActionApplied`). `handlers.get(tgtCode)` 한 줄이 **if/switch 없이 모듈을 갈아끼움**.
- 스켈레톤 실물: `docs/atot/예시구현/`.

## 13. 실증 (구현 가능성) — 설계로 끝내지 않는다

- 제안한 예시구현이 **문서상 그림이 아니라 돌아가는 코드**임을 두 가지로 확인했습니다.
- **① 실제로 컴파일된다** — BE 5개 파일을 **회사와 동일한 번들 JDK 8**로 그대로 컴파일 → 성공. 가제로 잡은 시그니처가 **실제 코어 `CommonSanctionService` API와 맞물린다**는 뜻(설계가 실존 코드와 정합).
- **② 구현 가능성 = 단위테스트로 돈다** — 협력자(코어·매퍼)만 모킹해 **JUnit·Mockito 31개** 그린, **JaCoCo 80% 게이트 통과**. 격리 테스트베드라 **회사 pom·빌드는 무관**.
- **핵심 멘트**: "한 번 돌리면 **컴파일 → 단위테스트 → 게이트**가 한 흐름으로 통과합니다. 테스트가 돌았다는 건 컴파일은 이미 됐다는 뜻이고요."

### (선택) 라이브 시연
- `docs/atot/예시구현/testbed/발표_커버리지실행.bat` **더블클릭** → 터미널 `Tests run: 31 … BUILD SUCCESS` + `All coverage checks have been met` → 커버리지 리포트 자동 오픈.
- 또는 PowerShell: `mvn -o -B clean verify` (오프라인 — **발표장 네트워크 무관**). 리허설 때 한 번 미리 돌려두기.
- 리포트에서 `DcmtSanctionHandler` 클릭 → 줄별 초록 하이라이트(상태매핑 5분기 등).

### (정직하게 · 질문 대비)
- 이 커버리지는 **"구조가 테스트 가능"**의 근거지, **"승인 로직 정확성"의 증명은 아님**. 브리지는 위임이 많아 수치가 쉽게 높게 나옴 — 로직 검증은 리뷰/후속 구현에서.
- 실제로 **커버리지 도구가 초기 스텁**(항상 `PROG` 반환)을 지목 → 코어 반환값을 읽도록 **수정**하고 그 경로(`CMPL→완료후속`)까지 테스트로 커버. 도구가 개선점을 실제로 잡아준 사례.

## 14. 마무리 — 감사합니다

- 표준 한 번, 모든 모듈이 이득. 만든 헬퍼·wframe·Bridge로 다음 모듈은 **"핸들러 1개 + 화면 한 줄"**. 리뷰 후 구현 착수.

---

# 부록 A. 코드 직접 시연 가이드

> **연출**: 슬라이드는 6~13장을 **가볍게** 넘긴 뒤, "말로만 하면 감이 안 오니 실제 파일을 보겠습니다" 하고 IDE로 전환. 스켈레톤 실물: `docs/atot/예시구현/`.
> **원칙**: 파일당 **30초~1분**, "짚을 한 줄"만. 코드를 읽어 내리지 말고 **한 곳만 커서로 짚고 메시지를 말한다.** 한 파일 끝날 때 다음 파일로 넘어가는 "연결 문장"을 준비.

### 시연 내내 3번 반복할 핵심 메시지
1. **"새 마법이 아니라 복붙의 공통화"** — 없던 걸 만든 게 아니라, 이미 모듈마다 복붙돼 있던 걸 한 층으로 끌어올린 것.
2. **"`if/switch` 한 줄 없이 모듈이 갈아 끼워진다"** — 스프링 빈이름(=`tgtCode`) 자동주입.
3. **"모듈이 새로 쓰는 코드는 파일 하나"** — `XxxSanctionHandler.java` 뿐, SQL 0줄.

### 시연 순서 (요청→디스패치→모듈 훅 흐름 그대로, BE 4 + FE 2)

**① 진입점 — `be/common/CommonSanctionBridgeController.java`** *(제네릭 컨트롤러)*
- 짚을 곳: `action()` (53~63줄) — **엔드포인트 하나**가 `act` 값(`SANCTN`/`REJ`/`CANCEL`/`DEM_CANCEL`)으로 승인·반려·취소·요청취소를 전부 분기.
- 할 말: *"옛날엔 모듈마다 `trscCfmDem/Act/Rej/Canc/DemCanc` 5벌 + 서비스였는데, 지금은 이 파일 하나. 컨트롤러는 받아서 Bridge에 넘기기만 합니다."*
- 넘어가며: *"그럼 실제 분기는 어디서? 다음 파일입니다."*

**② 디스패치 심장 — `be/common/CommonSanctionBridgeServiceImpl.java`** *(여기가 하이라이트)*
- 짚을 곳 1: `@Autowired Map<String, ...> handlers` (28줄) + `handler()`의 `handlers.get(sTgtCode)` (39~43줄). → *"`if`문이 한 줄도 없습니다. 스프링이 빈이름을 키로 자동 주입해서 `tgtCode`로 바로 꺼냅니다. 새 모듈은 Bridge를 **안 건드립니다** — 개방-폐쇄."*
- 짚을 곳 2: `applyAction()` (78~82줄) — `service.actSanction()`(코어) 호출 → 반환 Map에서 상태를 읽어 훅에 넘김. **여기가 실증에서 말한 "커버리지 도구가 잡아준 그 코드"**: `stepStatusOf()`(161줄)가 예전엔 무조건 `"PROG"` 반환 스텁이었고, 단위테스트 짜면서 코어 반환값을 읽도록 고친 자리. (실증 슬라이드 질문 나오면 이 줄을 띄우면 됨)
- 짚을 곳 3(선택): `cancel()` (95~99줄) — `cancelSanction`은 반환이 `void`라 `reloadDemand()`(174줄)로 상태 재조회. *"실제 코어 시그니처에 맞춰 조정한 부분."*

**③ 모듈이 새로 쓰는 유일한 파일 — `be/dcmt/DcmtSanctionHandler.java`** *(가장 오래 머물 곳)*
- 짚을 곳 1: `@Component("DCMT")` (25줄) — *"이 빈이름 `\"DCMT\"`가 곧 `tgtCode`. 그래서 Bridge가 `if` 없이 찾아냈던 겁니다."* (②의 메시지와 연결)
- 짚을 곳 2: `onActionApplied`→`mapStatus()` (114~123줄) — 코어 단계상태(REG/DEM/PROG/REJ/CMPL) → DCMT `STS_CODE`(10~50) 매핑. *"옛 `updateStsCode`가 하던 일이 그대로 이 훅으로."*
- 짚을 곳 3: `canView()`(78줄, 보안게이트) + `onStatusLoaded()`(99~103줄, CMPL→취소불가 가공) — *"모듈 특수규칙은 전부 이 훅들 안에. 그리고 `mapper.updateDoc/updateStsCode/...` — **SQL은 0줄, 기존 매퍼만 호출**합니다."*
- 할 말(마무리): *"새 모듈 추가 = 이 파일 복사해서 `@Component` 이름 바꾸고 훅만 채우면 끝."*

**④ 계약 확인 — `be/common/CommonSanctionTargetHandler.java`** *(짧게, 선택)*
- 짚을 곳: 필수는 `tgtCode`·`onDemandCreated`·`onActionApplied` 3개, 나머지(`validateBeforeDemand`/`onCompleted`/`canView`/`onStatusLoaded`)는 `default {}` (36·66·77·88줄). → *"호스트가 상태를 자기 테이블에 캐시 안 하면 구현할 게 거의 없습니다."*

**⑤ FE — 호스트가 하는 일 "이게 전부" — `fe/HOST_사용예시_DCMT.js`**
- 짚을 곳: `openSanction()` (11~35줄) — 키 추출 + 그리드/버튼 wframe 2개 `fnInit` + 둘 연결(액션→그리드 리로드)만. 하단 주석(37~41줄)이 흐름 요약.
- 할 말: *"옛날 화면의 `onDataLoad` 승인 복붙, 컨트롤러 5개, 서브미션 5개가 **전부 사라지고** 이 함수 하나만 남습니다."* (2·3장 "복붙" 슬라이드와 수미상관)

**⑥ FE 헬퍼 — `fe/cips_sanction.js`** *(선택)*
- 짚을 곳: 상단 `cips.sanction = cips.sanction || {}` (7줄) + `request/act/cancel/loadStatus/changeLine` 함수들. → *"코어 `cips.js`는 손 안 대고 `cips.sanction` 네임스페이스만 확장. 각 함수가 팝업+서브미션을 캡슐화해서 화면 JS가 수십 줄→몇 줄."*

### 시연 중 질문 대비 (코드 위치로 답)
- **"모듈마다 다른 특수 규칙(예: 협력사 권한)은?"** → `DcmtSanctionHandler`의 `canView`/`onStatusLoaded` 훅을 띄우며 *"여기로 격리됩니다."*
- **"wframe으로 안 되는 너무 특수한 화면은?"** → *"그때는 wframe 대신 `cips_sanction.js` 헬퍼를 직접 호출. wframe=편의, 헬퍼=보장."*
- **"코어(`CommonSanctionService`)는 정말 안 바뀌나?"** → Bridge가 `service.actSanction/cancelSanction/select*`만 **호출**하는 걸 짚기. 코어 파일은 열지 않음(수정 대상 아님).
- **"이름들이 확정인가?"** → *"전부 가제입니다. 리뷰에서 합의되면 확정."*

### 사전 준비 (리허설 때)
- IDE에 위 6개 파일을 **탭으로 미리 열어두기**(순서대로). 폰트 확대(발표 화면 가독성).
- `예시구현/` 폴더 트리를 한 번 펼쳐 보여주면 "공통 4 + 모듈 1 + FE" 구조가 눈에 들어옴.
- (원하면) 실증 슬라이드 → `발표_커버리지실행.bat`로 테스트 그린까지 이어붙이면 "이 코드가 실제로 돈다"로 마무리.
