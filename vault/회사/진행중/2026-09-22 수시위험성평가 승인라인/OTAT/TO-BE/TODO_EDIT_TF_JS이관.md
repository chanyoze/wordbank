---
title: "[백로그] EDIT_TF 수정가능 판정 → JS 이관 (시간 날 때)"
sidebar_label: "EDIT_TF JS 이관 (백로그)"
sidebar_position: 8
date: 2026-07-21
kind: 동결
raw: "RAW-DOC:cip-defg-saas/OTAT/TO-BE/TODO_EDIT_TF_JS이관.md"
---

# [백로그] EDIT_TF 수정가능 판정 → JS 이관 (시간 날 때)

> 작성: 2026-07-21 / 이찬호
> 성격: **품질/아키텍처 개선** (버그 아님 — 현재 SQL EDIT_TF 는 정상 동작 + DB 검증 완료)
> 관련: [SCNT_구현방식_공유.md](../현행/SCNT_구현방식_공유.md)

## 문제의식

- `EDIT_TF`(수정가능여부)를 **SQL 에서 계산**하는데, "수정 가능한가"는 UI 관심사라 JS 가 맞다.
- 그 과정에서 `CHECK_TF`(접수여부)를 EDIT_TF 계산에 섞음 → `CHECK_TF` 는 **순수하게 접수 스위치로만** 쓰는 게 맞다.

## 현재 상태 (참고)

- SQL `SfasRegAtRiskasmtRcptSql.selectLstMain` 의 `EDIT_TF` Case 가 판정:
  - SCNT: `CFM_STS_CODE` 기준 (DEM/PROG/CMPL 잠금, REG/REJ/작성중 허용)
  - 레거시: `CHECK_TF`(미접수 잠금) + `STTS_CD 40~60` 결재자 본인 수정권
- `EDIT_TF` 소비처 **21곳** (readOnly 3 · JS가드 ~9 · 버튼노출 1 · 재해사례팝업 2 · 값쓰기 3 · 정렬메뉴 1)
  → 단순 readOnly 가 아니라 추가/삭제/순서/일괄수정/알림버튼까지 게이팅.

## 권장 방식 — (B) SQL 은 원시데이터만, JS 가 계산해 컬럼 write

- SQL: `CFM_STS_CODE`·`CHECK_TF`·`APPRV_*` **원시값만** 반환 (CHECK_TF 오버로딩 제거)
- JS: `gridMainControl`(이미 행별 실행)에서 행별로 `EDIT_TF` 계산해 `wdlMain` 에 write
- **소비처 21곳은 그대로** (여전히 컬럼 읽음) → 공수 중 / 회귀 낮음
- (A) 완전제거(21곳 인라인 교체)는 공수 높음·회귀 높음 → 비권장

## 남는 까다로운 부분

- 레거시 **결재자 본인 수정권**(`APPRV_C/BD/A_USER_NO = SESSION_USER_NO`)이 EDIT_TF 에서 가장 지저분.
- **하이브리드 대안**: SCNT 는 JS 로 깔끔하게, 레거시 결재자 로직은 SQL 에 남김
  (레거시는 소급유지용이라 신규 생성 안 됨 → 굳이 옮길 필요 없음).

## 착수 시 체크

- [ ] `gridMainControl` 이 행별 호출인지 재확인 (write 위치)
- [ ] rBtnCstCtr(알림전송 버튼)이 EDIT_TF 컬럼 의존 → 컬럼 유지 필요
- [ ] EDIT_TF write 3곳(신규행 세팅)과의 충돌 검토
- [ ] 회귀: 추가/삭제/순서/일괄수정/알림 전부 재확인
