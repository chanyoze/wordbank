---
title: "표준 승인 — 격리 테스트베드 (JaCoCo 실측) 🧪"
sidebar_label: "testbed 안내"
sidebar_position: 2
date: 2026-07-07
kind: 동결
raw: "RAW-DOC:cip-defg-saas/OTAT/설계아카이브/예시구현/testbed/README.md"
---

# 표준 승인 — 격리 테스트베드 (JaCoCo 실측) 🧪

예시구현 **BE 스켈레톤 5개 파일**(측정 대상 4개 클래스 — `CommonSanctionBridgeService`는 순수 인터페이스라 실행 라인 없음)이 "단위테스트 가능"함을 실제로 컴파일·테스트·측정해 보이는 **독립 미니 Maven 모듈**입니다.

> ⚠️ 이 폴더의 스켈레톤은 상위 `예시구현/`의 원본을 **복사**한 것입니다(오늘 기준 동일). 원본이 바뀌면 여기도 재동기화해야 커버리지가 유효합니다. CI 상시 대상 아님(수동 실행).
회사 프로젝트(`cip-defg-saas`) 빌드와 **무관** — 회사 `pom.xml`(EMMA)·소스 트리를 건드리지 않습니다.

## 무엇을 증명 / 무엇을 증명 안 함
- ✅ **증명함**: 표준화된 구조(브리지·핸들러·제네릭 컨트롤러)가 컴파일되고, 협력자를 모킹해 단위테스트로 검증 가능하다.
- ⛔ **증명 안 함**: 승인 "로직의 정확성". 브리지는 위임이 많아 커버리지 수치 자체는 쉽게 높게 나옵니다. 진짜 신호는 `DcmtSanctionHandler`(상태매핑 5분기·보안게이트)에 있습니다.

## 구성
```
src/main/java
  com/cip/defg/saas/module/common/sanction/            ← 예시구현 원본 "그대로 복사" (커버리지 대상)
    CommonSanctionTargetHandler / BridgeService / impl / web
  com/cip/defg/saas/module/dcmt/sanction/DcmtSanctionHandler.java   ← 원본 그대로 (커버리지 대상)
  com/cip/defg/saas/module/common/service/CommonSanctionService.java  ← 코어 stub (테스트 더블, 제외)
  com/cip/defg/saas/module/dcmt/mapper/DcmtPopRegDcmtConfirmMapper.java ← 매퍼 stub (제외)
  com/inswave/util/WqResult.java                       ← 응답봉투 stub (제외)
src/test/java
  …impl/CommonSanctionBridgeServiceImplTest    (8)  ← 디스패치·훅순서·게이트 분기
  …dcmt/sanction/DcmtSanctionHandlerTest       (10) ← mapStatus 5분기·canView 4경우·onStatusLoaded 가공
  …web/CommonSanctionBridgeControllerTest      (10) ← act 분기·성공/예외 봉투
  …sanction/CommonSanctionTargetHandlerDefaultsTest (1) ← default 훅 계약(no-op·canView=true)
```
필드 주입(`@Autowired private`)은 운영코드 변경 없이 `ReflectionTestUtils.setField` 로 채웁니다.

## 실행
```bash
export JAVA_HOME=/c/CIP_DEFG_v2.0.0/bin/jdk1.8.0_281     # 회사 빌드와 동일한 Java 8
export PATH="/c/CIP_DEFG_v2.0.0/bin/apache-maven-3.6.3/bin:$PATH"
mvn -f docs/atot/예시구현/testbed/pom.xml clean verify
```
- `verify` 단계에서 **라인 커버리지 80% 게이트**(jacoco:check) 가 동작 → 미달 시 빌드 실패.
- HTML 리포트: `target/site/jacoco/index.html`

> ⚠️ Windows 참고: 이 경로엔 한글(`예시구현`)이 들어 있어, JaCoCo `exec` 파일만 ASCII 경로(`java.io.tmpdir`)로 뺐습니다(pom 참고). 안 그러면 fork 된 test JVM 이 `-javaagent` 인자의 한글을 코드페이지에서 깨뜨려 커버리지가 0 으로 나옵니다.

## 실측 결과 (2026-07-01)
| 지표 | 값 |
|---|---|
| 테스트 | **31 pass / 0 fail** |
| 라인 | **100%** (101/101) |
| 메서드 | **100%** (33/33) |
| 명령어(instruction) | **100%** (516/516) |
| 분기(branch) | **93.5%** (43/46) |
| 80% 게이트 | ✅ PASS |

미커버 잔여 3분기는 모두 추적 가능한 방어코드 — 예) `reloadDemand` 의 `lDem == null` 단축평가, `canView`/`onStatusLoaded` 의 복합 `&&` 일부 조합.

> **개선 반영(2026-07-01)**: 옛 `readStepStatus()` 가 항상 `"PROG"` 를 반환하던 스텁을 제거하고, **`actSanction` 반환 Map / `selectSanctionDemand` 재조회**에서 실제 `STS_CODE` 를 읽도록 수정. 그 결과 `CMPL→onCompleted` 경로가 도달 가능해져 테스트로 커버됨(`applyAction_whenCoreReturnsCmpl`).

## 실 프로젝트 이관 (데모 이후)
회사 pom 에 이미 존재하는 **`src/local-test/java` + `-P local-tc`** 관례로 옮기면 됩니다. JaCoCo 를 회사 빌드에 상시 추가할지는 별도 결정(현재 EMMA 사용 중).
