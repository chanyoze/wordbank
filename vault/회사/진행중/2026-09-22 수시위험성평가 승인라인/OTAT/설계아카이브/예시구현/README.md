---
title: "승인 표준 — 간이 구현(스켈레톤) 📂"
sidebar_label: "예시구현 안내"
sidebar_position: 1
date: 2026-07-07
kind: 동결
raw: "RAW-DOC:cip-defg-saas/OTAT/설계아카이브/예시구현/README.md"
---

# 승인 표준 — 간이 구현(스켈레톤) 📂

> ⚠️ **가제/예시**입니다. 이름·시그니처는 합의 시 확정. 빌드에 엮여 있지 않은 **참고용 스켈레톤**이며, 흐름을 "파일로" 보기 위한 것입니다.
>
> **v2 (적합성 분석 반영)** — DCMT/CESC 실측 분석에서 나온 갭을 `// [분석반영]` 으로 적용. 4훅 → 읽기/완료후속 훅 추가, 패널 가드 파라미터, 라인변경, 벌크 오케스트레이터.

## 🧪 분석으로 추가된 것 (v1 → v2)
| 갭 (실측) | 반영 |
|---|---|
| 읽기 게이트/가공 훅 부재 (보안등급·결과가공) | `Handler.canView()` + `onStatusLoaded()` 신설 |
| 취소 경로 상태매핑 누락 (CESC) | `Bridge.cancel` 도 `onActionApplied` 발화 |
| 완료 후속 전파 (CESC 장비전파) | `Handler.onCompleted()` 신설 |
| 협력사 override (전체숨김/readonly) | 패널 `guard{bHideActions,bForceReadonly}` 파라미터 |
| 승인라인변경 | `cips.sanction.changeLine` + 패널 버튼 + `Bridge.changeLine` |
| save=upsert+역기록 | `createDemand`→`saveDemand`, `onDemandCreated` 가 `updateDoc` |
| 번들/벌크 생성 (CESC trscCrtAll) | 단건 패널 밖 — **필요한 모듈이 생기면 그때 별도 추가**(지금은 미생성) |
| Context·Bulk 파일 | **제거** — 훅은 `Map<String,Object>` 로 단순화, 벌크는 YAGNI |

> 🔴 회귀 위험(코드 아닌 운영주의): ① `loadStatus` 의 `canView` 누락 시 **보안등급 문서 누출** ② 본 화면(DcmtRegPrjt)의 `STS_CODE` 자바 직접 롤백과 **상태 이중소유** → 한쪽으로 일원화.

## 파일 지도 (어디에 뭐가 생기나)

```
[ 공통(새로 1번만 만듦) ]
 be/common/  ── module/common 에 추가
   CommonSanctionTargetHandler.java     ← 호스트가 구현할 "훅" 인터페이스 (훅 인자 = Map)
   CommonSanctionBridgeService.java     ← 오케스트레이터 인터페이스
   CommonSanctionBridgeServiceImpl.java ← 표준 흐름 1회 + tgtCode 디스패치
   CommonSanctionBridgeController.java        ← 제네릭 엔드포인트 1쌍(+취소). 모듈마다 안 만듦
 fe/
   cips_sanction.js               ← FE 헬퍼(cips 확장, 코어 미수정)
   CommonSanctionGrid.xml         ← 승인이력 그리드 wframe
   CommonSanctionButtons.xml      ← 승인버튼 wframe (그리드와 분리, 독립 배치)

[ 모듈이 새로 쓰는 것 — 딱 이것뿐 ]
 be/dcmt/
   DcmtSanctionHandler.java       ← @Component("DCMT") 훅 1개 (= 옛 updateStsCode)
 (FE) 화면에서 <wframe> 2개(그리드/버튼) 배치 + 호스트가 둘을 연결
```

## ✅ 새로 *만드는* 파일 (신규 생성)

**공통 · 신규 7개 (전체 1회만)**
1. `module/common/CommonSanctionTargetHandler.java`
2. `module/common/CommonSanctionBridgeService.java`
3. `module/common/impl/CommonSanctionBridgeServiceImpl.java`
4. `module/common/web/CommonSanctionBridgeController.java`
5. `webapp/js/sanction/cips_sanction.js`
6. `webapp/common/CommonSanctionGrid.xml`
7. `webapp/common/CommonSanctionButtons.xml`

**모듈마다 · 신규 1개** (DCMT 예시)
8. `module/dcmt/sanction/DcmtSanctionHandler.java`

## ✋ 새로 만드는 게 *아닌* 것 (기존 수정·삭제·데이터)
- 화면 `*.xml`(wqxml): `<wframe/>` 한 줄 + 버튼 연결 **(수정)**
- 옛 승인 컨트롤러 5개(`trscCfm*`)·서비스·FE 서브미션 **(삭제)**
- 호스트 테이블 `STS_CODE`·`CFM_*` 추가 / `STTS_CD`·`APPRV_*` deprecated **(DB 스키마)**
- USETGT `TGT_CODE` 등록·승인라인 정의 **(데이터, 기존 관리화면)**

> 요약: **신규 파일 = 공통 7 + 모듈당 1.** 코어(`CommonSanctionService`)는 손대지 않음.

## 한 번의 "승인" 요청이 흐르는 길 (end-to-end)

```
[화면 버튼]  cips.sanction.act({ tgtCode:"DCMT", demSn, act:"SANCTN" })
   │  (의견 팝업 → createSubmission → executeSubmission)
   ▼
POST /common/sanction/action.do            ← CommonSanctionBridgeController (공용 1쌍)
   ▼
bridge.applyAction("DCMT", payload)        ← CommonSanctionBridgeServiceImpl
   ├─ core.actSanction(payload)            ← CommonSanctionService (기존 코어, 수정 X)
   └─ handlers.get("DCMT").onActionApplied(ctx)
                                           ← DcmtSanctionHandler
                                              = 옛 updateStsCode (REG→10 … CMPL→50)
   ▼
DB: 승인이력/단계 (코어) + 호스트 STS_CODE (핸들러)
```

## "옛 DCMT" → "새 구조" 1:1 대응

| 옛 DCMT (실측) | 새 구조 |
|---|---|
| `trscCfmAct.do` 컨트롤러 + `service.trscCfmAct` | `/common/sanction/action.do` → `bridge.applyAction` |
| `cfmService.actSanction(m)` | 그대로 — Bridge가 호출 |
| `updateStsCode(m)` (REG→10…) | **DcmtSanctionHandler.onActionApplied** 로 이동 |
| `selectCfmStepList` → `cfmService.selectSanctionDemandStep` | 제네릭 조회 / `cips.sanction.loadStatus` |
| 컨트롤러 5개 + FE 서브미션 5개 | **사라짐** (제네릭 1쌍) |

→ **모듈이 진짜 새로 쓰는 코드 = `DcmtSanctionHandler` 1개 + 화면 버튼 연결.** 나머지는 공통이 1번만.

## 🧪 구현 가능성 실측 — `testbed/`
위 BE 스켈레톤 5개 파일(측정 4클래스)을 **실제로 컴파일 + 단위테스트(JUnit·Mockito) + JaCoCo 측정**한 격리 미니 Maven 모듈. 회사 빌드 무관.
- 결과(2026-07-01): **31 tests pass · 라인 100% · 분기 93.5% · 80% 게이트 PASS**
- 실행/해설: [`testbed/README.md`](testbed/README.md)
- 발표자료 슬라이드 "09 · 실증"에 시각화됨.
