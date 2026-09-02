---
title: "HANDOFF — CCTV관제여부 컬럼 리포트 반영"
sidebar_label: "CCTV관제여부 반영"
sidebar_position: 3
date: 2026-08-28
kind: 갱신
raw: "RAW-DOC:cip-defg-saas/OTAT/RPT/HANDOFF_CCTV관제여부_리포트반영.md"
---

# HANDOFF — CCTV관제여부 컬럼 리포트 반영

> 작성 2026-08-10 / 개정 2026-08-10 (범위 확대 — 초판은 "타입 D 1개"로 잘못 좁혔음)
> 실행 주체: 사람 (Rexpert 디자이너) + Claude CLI (코드·조사)
> 배경 문서: [README.md](./README.md) · [리포트_타입분기_구조개선_검토.md](./리포트_타입분기_구조개선_검토.md)

## 0. 결론 먼저

1. **새 타입(E)을 만들지 않는다.** 옵션120은 "컬럼 하나 보이냐 마냐"라 리포트 **내부 표시조건**으로 처리한다.
2. **"지금 그 옵션 쓰는 현장이 없으니 그 타입은 건너뛴다"는 안 된다.** `SFAS_OPT_120` 은 현장 단위로 언제든 켜지므로, **항목 상세를 인쇄하는 리포트는 전부** 미리 반영한다. 안 그러면 나중에 옵션을 켰을 때 **에러 없이 컬럼만 안 나오는** 상태가 된다 — [구조개선 검토](./리포트_타입분기_구조개선_검토.md) 2장의 157현장 버그와 같은 실패다.
3. **⚠️ 다만 A·D 는 애초에 항목별 상세를 인쇄하지 않는 서식으로 보인다.** 필드 스캔 결과 A·D 는 항목 상세 필드가 **0종**, B·C 는 **10종**이다(3장). CCTV관제여부는 항목별 컬럼이므로 A·D 에는 **넣을 자리가 없을 수 있다.**
4. **그래서 착수 전에 요구사항부터 확인해야 한다** — 1장.

---

## 1. 🔴 착수 전 확인할 것 (블로커)

옵션120(`[한화오션]`)을 켠 현장은 **회사 30212 · 6현장 · 전부 리포트 타입 D** 다.
그런데 **D 는 항목별 상세를 인쇄하지 않는 서식**이다(3장 스캔). 즉 지금 상태로는 요청자가 CCTV 컬럼을 볼 출력물이 없다.

착수 전에 이걸 먼저 확정할 것:

- [ ] **요청자가 말하는 "리포트"가 무엇인가?** 접수(RRPT_ID 31) 인가, 제출(RRPT_ID 82) 인가, 회의록인가?
- [ ] 요청자가 실제로 출력해 쓰는 서식이 D 가 맞는가? (D 는 재해형태 7종 pivot + 종합/승인의견 중심)
- [ ] D 에 넣어야 한다면 **D 서식에 항목 상세 밴드를 새로 만들어야 한다** — 컬럼 하나 추가가 아니라 서식 개편이다. 그러면 공수가 완전히 달라진다.

> 이 확인 없이 B·C 만 고치면, **정작 요청한 회사는 아무 변화도 못 느낀다.**

## 2. 현재 상태 (조사 완료)

### 이미 되어 있는 것 — 손대지 말 것

앱은 **전 화면 반영 완료**다. 리포트에만 안 나온다.

| 위치 | 상태 |
|---|---|
| DB `TSF_ASSMNT_RECEIVE_DETAIL.CCTV_MON_TF` 등 | ✅ 존재 |
| 옵션 `TCC_PROJ_CODE.SFAS_OPT_120` | ✅ 존재 (`[한화오션] CCTV관제여부 컬럼 조회여부`) |
| 화면 20종의 조회/저장/표시제어 | ✅ 완료 (접수·제출·협력사·감리·회의록 초안/확정) |
| 승인 팝업 출력 | ✅ `Decode(a.CCTV_MON_TF, 'T', 'O', 'X')` |

### 안 되어 있는 것 — 이번 작업 범위

| 위치 | 상태 |
|---|---|
| `.crf` (확인한 4종 전부) | ❌ `CCTV_MON_TF` 필드 없음, `SFAS_OPT_120` 참조 없음 |

---

## 3. 대상 `.crf` 목록

### 3-1. 접수 (RRPT_ID 31) — 사본 보유, 스캔 완료

> ⚠️ **2026-09-02 주석** — 아래 판정은 **기본본** 기준이다. 이후 폴더 사본이 개발회사 전용본(`_LGHTEST`)으로 교체되어(README §1-1) 같은 스캔의 결과가 다르게 나온다(A↔B·C 의 항목상세 유무가 반대).
> 스캔을 재실행할 때는 **대상이 기본본인지 개발본인지 명시할 것** → [HANDOFF_금번수정_리포트반영.md §6-3](./HANDOFF_금번수정_리포트반영.md)
>
> ⚠️ **아래 본문의 `DR_CD_1..7`·`DR_NM_IMG1..7` 을 "재해형태 7종 pivot" 으로 읽은 것은 오독이다.** DB 대조 결과 이 필드는 **서명란 7슬롯**(`TSFAS_PROJ_REPORT_DTL.TITLE1`·`TITLE2`·`DR_CD` / `DR_CNT`=서명란수)이다. 재해형태는 이 코드베이스에서 `DISASTER_FORM`·`DR_FORM`·`DR_SN` 을 쓴다. 근거: [README §5-1](./README.md)
> 이 오독은 "A·D 는 항목 상세를 안 찍는 서식" 판정의 근거 일부이므로, 재대조 시 함께 확인할 것.

| DVS_CD | 파일 | 항목상세 필드 | CCTV | 판정 |
|---|---|---|---|---|
| A | `WSfAssesmentReciveRegister.crf` | **0종** | 없음 | ⚠️ 넣을 자리 확인 필요 |
| B | `WSfAssesmentReciveRegisterTypeB.crf` | **10종** | 없음 | ✅ **작업 대상** |
| C | `WSfAssesmentReciveRegisterTypeC.crf` | **10종** | 없음 | ✅ **작업 대상** |
| D | `WSfAssesmentReciveRegisterTypeD.crf` | **0종** | 없음 | ⚠️ 넣을 자리 확인 필요 (요청자가 쓰는 타입) |

항목상세 필드 = `RISK_FACT`·`IMPRV_MTHD`·`PLACE`·`ASSMNT_FQC`·`ASSMNT_STRTH`·`ASSMNT_RANK`·`CONSTRCT_NAME`·`DISASTER_FORM`·`EMPHS_REG`·`WORK_STAFF`

- **B·C** 는 10종을 전부 갖고 있다 → 항목별 그리드를 인쇄한다 → CCTV 컬럼을 넣을 자리가 있다
- **A·D** 는 0종이다. 데이터셋도 `MAIN`/`SUB01`/`ATDT_SUB01`(A), `MAIN`/`SBM`/`SUB01`/`SUB03`(D) 로 **재해형태 7종 pivot(`DR_CD_1..7`·`DR_NM_IMG1..7`) + 종합/승인의견 + 참석·첨부** 구성이다
- ⚠️ **이 판정은 바이너리에서 뽑은 필드명 기반이다.** 한글 라벨은 압축돼 있어 못 읽었다. **디자이너로 열어 최종 확인할 것**

### 3-2. 확인 필요 — 제출 (RRPT_ID 82), 사본 없음

`SfasRegAtRiskasmtSub`(제출 화면)도 옵션120으로 CCTV 컬럼을 켠다 → 그 화면의 리포트도 대상일 가능성이 매우 높다.

| DVS_CD | 파일 |
|---|---|
| A, (null) | `/sfas/WSfAssesmentRegister.crf` |
| B | `/sfas/WSfAssesmentRegisterTypeB.crf` |
| C | `/sfas/WSfAssesmentRegisterTypeC.crf` |
| D | `/sfas/WSfAssesmentRegisterTypeD.crf` |

→ 실물 4개를 받아 4장의 스캔으로 판정할 것.

### 3-3. 확인 필요 — 회의록, 사본 없음

`SfasRegMeetingDraft` / `SfasRegMeetingConfirm` 도 옵션120으로 CCTV 컬럼을 켠다
([SfasRegMeetingDraft.xml:1293](../../../src/main/webapp/wqxml/sfas/SfasRegMeetingDraft.xml#L1293) `wgrdSub02.setColumnVisible("CCTV_MON_TF", … SFAS_OPT_120 == "T")`).

후보: `WSfMeetingDraftRegister01.crf` · `WSfMeetingConfirmRegisterHanhwa.crf` · `WSfMeetingConfirmRegister01Mp.crf` · `WSfAssmntTmRwAllRegister.crf` 등

→ 회의록 리포트가 **평가 상세 그리드를 인쇄하는지** 를 4장의 스캔으로 판정할 것. 인쇄하지 않으면 대상 아님.

### 3-4. 대상 아님

`SfasInqCooperationMeetingConfirm` · `SfasRegCompanyAnytimeRiskAssessmentCheck` · `SfasRegCooperationAnytimeRiskAssessmentCheck` · `SfasInqCompanyAnytimeRiskAssessmentCheck` · `supv/*` — **리포트 바인딩(`setReportForPopup`)이 없다.**

---

## 4. 대상 판정 방법 — `.crf` 필드 스캔

`.crf` 는 바이너리지만 UTF-16LE 문자열은 읽힌다. **`IMPRV_MTHD`(위험성감소대책) 또는 `RISK_FACT`(유해위험요인) 가 있으면 평가 상세 그리드를 인쇄하는 리포트** 이고, CCTV 컬럼 대상이다.

```bash
node -e "
const fs=require('fs'), path=require('path');
process.argv.slice(1).forEach(f=>{
  const b=fs.readFileSync(f); let cur=''; const out=[];
  for(let i=0;i+1<b.length;i+=2){const lo=b[i],hi=b[i+1];
    if(hi===0&&lo>=32&&lo<127)cur+=String.fromCharCode(lo); else{if(cur.length>=3)out.push(cur);cur='';}}
  const S=new Set(out);
  const grid = S.has('IMPRV_MTHD')||S.has('RISK_FACT');
  console.log(
    path.basename(f).padEnd(46),
    '상세그리드='+(grid?'O':'.'),
    ' CCTV='+(S.has('CCTV_MON_TF')?'O':'.'),
    ' OPT120='+(S.has('SFAS_OPT_120')?'O':'.'));
});
" docs/OTAT/RPT/*.crf
```

판정:

| 결과 | 의미 | 조치 |
|---|---|---|
| `상세그리드=O` · `CCTV=.` | 항목별 그리드를 인쇄하는데 CCTV 컬럼이 없다 | ✅ **작업 대상** |
| `상세그리드=O` · `CCTV=O` | 이미 반영됨 | 완료 |
| `상세그리드=.` | 항목별 상세를 인쇄하지 않는 서식 | ⚠️ 넣을 자리가 없다 → 디자이너로 열어 확인. 요청자가 이 서식을 쓴다면 **서식 개편**이 필요하다 |

접수 4종 실행 결과 (2026-08-10):
```
WSfAssesmentReciveRegister.crf         상세그리드=.   CCTV=.   OPT120=.
WSfAssesmentReciveRegisterTypeB.crf    상세그리드=O   CCTV=.   OPT120=.
WSfAssesmentReciveRegisterTypeC.crf    상세그리드=O   CCTV=.   OPT120=.
WSfAssesmentReciveRegisterTypeD.crf    상세그리드=.   CCTV=.   OPT120=.
```

---

## 5. 왜 타입을 늘리면 안 되는가

`RPT_TYPE_CODE` 는 [SfasRegAtRiskasmtRcptSql.xml:63-72](../../../src/main/resources/sqlmap/mappers/sfas/SfasRegAtRiskasmtRcptSql.xml#L63-L72) 의 `Case` 로 옵션 3개에서 결정된다. 여기에 옵션120을 넣으면:

- 조합 8 → 16, 파일 4 → 최대 8 (그리고 제출·회의록까지 곱해진다)
- `Case` 는 **먼저 걸리는 When 이 이긴다** → 새 `When` 이 기존 조합을 삼킨다.
  실제로 그렇게 해서 **157 현장이 이전등급을, 10 현장이 감소후등급을 리포트에서 못 받고 있다**

**옵션120은 지면 구성을 바꾸지 않고 기존 3옵션과 직교한다** → 리포트 내부 표시조건으로 처리한다.

이 시스템에 이미 전례가 있다:

| 옵션 | 처리 방식 |
|---|---|
| `SFAS_OPT_040_001` · `048` · `049` | **리포트 내부 조건** (4개 `.crf` 전부의 MAIN 필드) |
| `SFAS_OPT_092` | **리포트 내부 조건** — 앱이 리포트로 안 넘긴다(팝업에 0회 등장). 리포트가 자체 SQL 로 조달 |
| `066_001` · `066_002` · `048_001` | ❌ 파일 선택으로 승격 → 조합 폭발 + 위 버그의 원인 |

**`SFAS_OPT_120` 은 앞쪽 방식으로 간다.**

---

## 6. 작업 절차

### 6-1. [사람 / Rexpert 디자이너] — 대상 `.crf` **각각**

`.crf` 는 REX30 바이너리라 **Claude CLI 로 편집 불가.**

1. **MAIN 데이터셋 SQL 에 두 컬럼 추가**
   - 상세: `CCTV_MON_TF` — 표기는 승인 팝업과 통일 → `Decode(a.CCTV_MON_TF, 'T', 'O', 'X')`
   - 옵션: `TCC_PROJ_CODE.SFAS_OPT_120` (`SFAS_OPT_040`·`048`·`049`·`092` 를 이미 같은 방식으로 뽑고 있으므로 조인은 이미 있다)
2. **상세 밴드에 컬럼 추가** — 헤더 `CCTV\n관제여부`, 본문 `O`/`X`
   - 위치는 `DR_FORM_NAME`(재해형태) **다음**, `IMPRV_MTHD`(위험성감소대책) **앞**
     (근거: [SfasRegAtRiskasmtRcpt.xml:775](../../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L775) 의 `wgrdCont` 컬럼 순서 — 화면과 같은 순서로 두면 사용자가 헷갈리지 않는다)
3. **표시조건 부여** — 헤더/본문 컨트롤 모두 `SFAS_OPT_120 == 'T'`
   기존 옵션 컨트롤(`SFAS_OPT_049` 등)의 조건 표현식을 열어보고 **같은 스타일**로 맞출 것
4. **폭 재배분** — 숨김일 때 남는 폭 처리. **실질 작업량의 대부분이 여기다**
5. `docs/OTAT/RPT/` 사본 + 리포트 서버 배포본 **둘 다** 갱신
6. [README.md](./README.md) 6장 변경이력에 기록 (바이너리라 `git diff` 불가)

> 4개(또는 8개)에 같은 작업을 반복하게 된다. **첫 파일에서 컬럼 폭·조건식·SQL 조각을 확정하고 나머지에 복제**하는 순서가 빠르다.

### 6-2. [Claude CLI] 코드 변경

**없다.** 리포트가 자체 SQL 로 `SFAS_OPT_120` 을 조달하면 앱은 그대로다 (`SFAS_OPT_092` 선례).

> ⚠️ 리포트 담당자가 "옵션은 파라미터로 받겠다"고 하면 6-3 으로. **6-1의 SQL 조달과 6-3을 둘 다 하면 안 된다** (같은 값이 두 경로로 들어와 어긋난다).

### 6-3. [대안 / Claude CLI] 파라미터 전달 — 리포트가 요구할 때만

`066_001`·`048_001` 이 쓰는 방식. 접수 화면 기준 편집 지점:

1. **본체** `src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml` — `rDclt` 배열(약 1173~1198)
   ```js
   "SFAS_OPT_120=wdlCdOpt.SFAS_OPT_120",
   ```
   > 좌변은 **리포트 계약명**이라 그대로, 우변만 우리 컬럼 (함정12 — 좌변 리네임 금지)
   > `wdlCdOpt.SFAS_OPT_120` 은 [55줄](../../../src/main/webapp/wqxml/sfas/SfasRegAtRiskasmtRcpt.xml#L55)에 선언돼 있고 SQL 도 이미 뽑는다 — 추가 작업 없음

2. **리포트 팝업** `src/main/webapp/wqxml/sfas/SfasPopRtrvAssesmentReciveRptAct.xml` — **기존 `SFAS_OPT_049_001` 패턴 그대로** 5곳
   | 위치 | 추가 |
   |---|---|
   | `wdmScAll` 키 (35~42줄 부근) | `<w2:key id="SFAS_OPT_120" name="옵션120" dataType="text"></w2:key>` |
   | `wdmScAll` 키 (52~59줄 부근) | `<w2:key id="PARA_SFAS_OPT_120" name="파라미터옵션120" dataType="text"></w2:key>` |
   | 파라미터 수신 (127~134줄 부근) | `scwin.para.SFAS_OPT_120 = cips.getPopupParameter("SFAS_OPT_120");` |
   | `wdmScAll.set` 2곳 (185~215줄 부근) | `wdmScAll.set("PARA_SFAS_OPT_120", scwin.para.SFAS_OPT_120);` / `wdmScAll.set("SFAS_OPT_120", scwin.para.SFAS_OPT_120);` |
   | `oRtnDat` (약 253~260줄, `popChoice.onClickBefore`) | `SFAS_OPT_120: wdmScAll.get("SFAS_OPT_120"),` |

3. 제출·회의록도 대상이면 각 화면·각 리포트 팝업에 같은 5곳을 반복

---

## 7. 검증

### 옵션120 켠 현장 확인
```sql
Select
    a.COMPANY_ID,
    a.PROJ_CODE,
    (Case
        When a.SFAS_OPT_066_001 = 'T' And a.SFAS_OPT_066_002 = 'F' And a.SFAS_OPT_048_001 = 'F' Then 'B'
        When a.SFAS_OPT_066_002 = 'T' And a.SFAS_OPT_048_001 = 'F' Then 'C'
        When a.SFAS_OPT_048_001 = 'T' Then 'D'
        Else 'A'
     End) RPT_TYPE
From
    TCC_PROJ_CODE a
Where 1 = 1
And Nvl(a.SFAS_OPT_120, 'F') = 'T'
```

### 출력 테스트 — **타입별로 다 봐야 한다**
- [ ] 옵션120 = `T` → 리포트에 CCTV관제여부 컬럼이 보이고 값이 `O`/`X` 로 화면 체크박스와 일치
- [ ] 옵션120 = `F` → 컬럼이 안 보이고 남은 폭이 깨지지 않음
- [ ] **A·B·C·D 각각** 위 두 케이스. 현재 옵션을 안 쓰는 타입은 **테스트 현장의 옵션120을 임시로 켜서** 확인할 것 (이번 작업의 목적이 "나중에 켜도 되게" 하는 것이므로 반드시 필요)
- [ ] 옵션120 = `F` 기존 사용자 회귀 — 특히 **D(167현장·1,303평가서)**
- [ ] 여러 건 출력 시 페이지 넘김·헤더 반복 정상
- [ ] 제출·회의록도 대상이면 동일 반복

### 반영 확인 (4장 스캔 재실행)
`상세그리드=O` 인 모든 파일이 `CCTV=O`, `OPT120=O` 가 되어야 한다.

---

## 8. 함정

1. **`.crf` 는 Claude CLI 로 못 고친다.** Rexpert 디자이너 필수.
2. **접속정보가 파일에 박혀 있다.** 개발본을 운영에 그대로 올리면 잘못된 DB 를 본다.
3. **A·B·C·D 를 다 고쳐야 한다.** 옵션은 현장 단위로 언제든 켜진다. "지금 안 쓰니까" 로 빼면 나중에 조용히 실패한다.
4. **D 는 지금도 쓰는 사람이 많다** (167현장 / 1,303평가서). 회귀 테스트 필수.
5. **`RPT_TYPE_CODE` 의 `Case` 를 건드리지 말 것.** 새 `When` 은 기존 조합을 삼킨다.
6. **앱 쪽은 이미 다 되어 있다** (화면 20종 + 승인팝업). 중복 작업 금지.
7. 6-1(자체 SQL) 과 6-3(파라미터) 중 **하나만**.

---

## 9. 하지 말 것

- ❌ 타입 E 신설
- ❌ `RPT_TYPE_CODE` `Case` 에 `When` 추가
- ❌ "지금 그 옵션 쓰는 현장이 없으니" 로 특정 타입 건너뛰기
- ❌ 진행 중인 **단어사전 반영 커밋에 섞기** — 별도 커밋

---

## 10. 이번 건이 말해주는 것

앱은 **한 곳**(`setColumnVisible`)만 고치면 끝났는데, 리포트는 **최소 4개, 많으면 12개 바이너리 파일**을 손으로 같은 작업을 반복해야 한다. 옵션이 하나 더 늘면 또 그만큼이다.

이게 [구조개선 검토](./리포트_타입분기_구조개선_검토.md) 가 필요한 이유이고, 이번 작업은 그 검토의 **실증 사례**로 쓰면 된다.

다음에 옵션이 추가될 때의 판단 기준:

> **"이 옵션이 지면 구성을 바꾸나, 컬럼만 켜고 끄나?"**
> 컬럼만 켜고 끈다 → **리포트 내부 표시조건**. 파일도 타입도 늘리지 않는다.
> 지면 구성이 근본적으로 다르다 → 그때만 `DVS_CD` 를 쓴다.
