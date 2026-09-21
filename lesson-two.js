import {escapeHtml as e} from './model.js';
import {textbook} from './data.js';
import {lessonOneFigure,observationIds} from './lesson-one.js';
import {verificationSets} from './lesson-two-data.js';
export const secondSteps=['유물 선택','먼저 예상','근거 찾기','최종 판단','바로잡기','검증 나누기'];
export const secondTimes=[4,5,15,6,6,4];
export const secondWorksheet='assets/worksheets/lesson-2.pdf';
export const worksheetFor=id=>observationIds.includes(id)?`assets/worksheets/lesson-2-${id}.pdf`:secondWorksheet;
const paper=t=>`<div class="l1-paper-note"><span>종이 활동지</span><p>${t}</p></div>`;
const link=(url,label)=>`<a class="button quiet" href="${e(url)}" target="_blank" rel="noopener">${e(label)} ↗</a>`;
const statements=set=>`<ol class="l2-claims">${set.claims.map((c,i)=>`<li><span>문장 ${i+1}</span><p>${e(c.text)}</p></li>`).join('')}</ol>`;
export function teacherForm(id='house'){
 const set=verificationSets[id]||verificationSets.house;
 return `<h2>교사용 정답·근거 · ${e(set.name)}</h2><p>학생이 근거를 찾고 최종 판단을 기록한 뒤 해설을 함께 살펴봅니다. 아래 판단은 제시된 자료를 기준으로 합니다.</p><ol class="l2-teacher-answers">${set.claims.map(c=>`<li><h3>${e(c.text)}</h3><p><b>${e(c.result)}</b> · ${e(c.reason)}</p>${c.fix?`<p>수정 예시: ${e(c.fix)}</p>`:''}</li>`).join('')}</ol><p>확인 자료: 비상교육 사회 5-2 ${set.page}쪽 / ${e(set.site)} · ${e(set.search)}</p>${link(textbook.url,'교과서 열기')}${link(set.url,set.direct?'공식 설명 열기':'공식 기관에서 자료 찾기')}<p class="l1-note">AI 설명 검증을 위한 학습용 문장입니다. 사실과 오류, 제시 자료로 확인할 수 없는 내용을 섞어 준비했습니다. 실시간 AI 답변이 아닙니다. 예상의 정오보다 출처와 근거가 최종 판단을 뒷받침하는지 살펴봅니다.</p>`;
}
export function lessonTwo({step,btn,source='house'}){
 const id=observationIds.includes(source)?source:'house',set=verificationSets[id];
 const titles=['어떤 유물을 검증할까요?','세 문장, 사실일까요?','어디에서 확인할 수 있을까요?','근거를 보고 판단해 봅시다.','잘못된 설명을 바로잡아 봅시다.','우리 모둠은 이렇게 확인했습니다.'];
 const leads=['1차시에 살펴본 유물을 고르고, 해당 유물의 활동지를 준비해 봅시다.','설명을 읽고 활동지의 ‘처음 생각’에 표시해 봅시다.','교과서와 공식 기관의 자료에서 각 문장을 확인할 근거를 찾아봅시다.','처음 생각과 달라도 괜찮습니다. 찾은 근거를 바탕으로 최종 판단을 표시해 봅시다.','거짓으로 확인한 문장 하나를 골라 사실에 맞게 고쳐 써 봅시다.','한 문장을 골라 확인한 자료, 근거, 최종 판단을 발표해 봅시다.'];
 const selector=`<div class="l2-source-tabs" role="group" aria-label="검증할 유물 선택">${observationIds.map(key=>btn(verificationSets[key].name,'l2-source',`data-id="${key}" aria-pressed="${key===id}"`,'quiet small')).join('')}</div>`;
 let body='';
 if(step===0)body=`<div class="l1-observe">${lessonOneFigure(id)}<div class="l1-observe-copy"><p class="l1-side-label">오늘의 검증 대상</p><h2>${e(set.name)}</h2><p>설명 3개를 읽고 예상한 뒤, 자료를 찾아 사실인지 확인합니다.</p><p>판단과 근거는 종이 활동지에 기록합니다.</p>${link(worksheetFor(id),'이 유물 활동지 받기')}</div></div>`;
 if(step===1)body=`${statements(set)}${paper('문장 1~3의 처음 생각에 사실 / 거짓 / 잘 모르겠음 중 하나를 표시해 봅시다.')}<p class="l1-note">친구와 생각이 다르면, 어떤 부분을 확인해야 할지 이야기해 봅시다.</p>`;
 if(step===2)body=`${statements(set)}<div class="l2-research-sources"><section><h2>교과서에서 찾기</h2><p>비상교육 사회 5-2 <strong>${set.page}쪽</strong>의 사진과 설명을 살펴봅니다.</p>${link(textbook.url,'교과서 열기')}</section><section><h2>공식 기관 자료에서 찾기</h2><p>${e(set.site)}</p><p>찾을 자료·검색어: <strong>${e(set.search)}</strong></p>${link(set.url,set.direct?'공식 설명 바로 열기':'공식 사이트 열기')}<p class="l1-note">${set.direct?'페이지의 46장 설명을 살펴봅니다.':'기관 첫 화면에서 검색 또는 소장품·전시 메뉴로 이동해 위 검색어로 찾습니다.'} 다른 유물의 설명과 혼동하지 않도록 이름과 시대를 확인합니다.</p></section></div>${paper('각 문장의 ‘확인한 자료’와 ‘찾은 근거’를 채워 봅시다. 근거를 못 찾았다면 ‘이 자료에서는 확인할 수 없음’이라고 씁니다.')}<details class="l1-hint"><summary>어떻게 기록하나요?</summary><p>자료: 교과서 ○쪽 / 또는 기관 이름 · 자료 제목</p><p>근거: 판단에 도움이 된 문장을 짧게 옮겨 쓰거나 내 말로 정리합니다.</p></details>`;
 if(step===3)body=`${statements(set)}<div class="l2-check-guide"><p><b>사실</b> 자료의 설명이 문장의 내용을 뒷받침합니다.</p><p><b>거짓</b> 자료에서 문장과 다른 사실을 확인했습니다.</p><p><b>판단하기 어려움</b> 살펴본 자료만으로 맞는지 틀린지 알 수 없습니다.</p></div>${paper('문장마다 최종 판단을 표시하고, 친구에게 근거가 있는 부분을 짚어 설명해 봅시다.')}<p class="l1-note">자료에 없다는 이유만으로 거짓이라고 판단하지 않습니다.</p>`;
 if(step===4)body=`${statements(set)}<div class="l2-exit"><h2>틀린 부분만 정확하게 바꾸기</h2><p>문장 번호를 쓰고, 찾은 근거에 맞게 설명을 고쳐 씁니다.</p><p>‘판단하기 어려움’으로 남긴 내용은 사실처럼 고쳐 쓰지 않습니다.</p></div>${paper('활동지 아래 ‘바로잡은 설명’을 완성해 봅시다.')}`;
 if(step===5)body=`<div class="l1-share-statement"><span>근거를 들어 발표하기</span><p>“문장 …번을 …이라고 판단했습니다. …에서 …이라는 내용을 확인했기 때문입니다.”</p></div><div class="l2-exit"><p><b>서로 확인하기</b> 친구의 근거가 그 문장을 판단하는 데 도움이 되나요?</p><p><b>오늘의 발견</b> AI가 알려 준 내용도 자료로 확인해야 합니다.</p></div><details class="l1-hint"><summary>검증을 마친 뒤 · 선생님과 해설 확인</summary>${teacherForm(id)}</details><div class="l1-next-lesson"><span>3차시 예고</span><p>오늘 고른 유물과 활동지를 그대로 사용합니다. 확인한 사실을 바탕으로 옛사람들의 생활을 설명하고 유물 소개문을 씁니다.</p></div>`;
 return `<div class="l1-workspace"><nav class="l1-progress" aria-label="2차시 활동 순서"><ol>${secondSteps.map((n,i)=>`<li>${btn(`<span>0${i+1}</span>${n}`,'l2-step',`data-step="${i}" ${i===step?'aria-current="step"':''}`)}</li>`).join('')}</ol></nav><article class="l1-content"><header class="l1-page-heading"><p class="l1-kicker">2차시 · LOOK <span>${secondSteps[step]} · ${secondTimes[step]}분</span></p><h1>${titles[step]}</h1><p class="l1-lead">${leads[step]}</p></header>${selector}<p class="l2-example-label">AI 설명 검증을 위한 학습용 문장 · 오류가 포함되어 있습니다.</p>${body}<nav class="l1-nav" aria-label="2차시 활동 이동">${btn('← 이전','l2-step',`data-step="${step-1}" ${step===0?'disabled':''}`,'quiet')}<span>${step+1} / 6</span>${step<5?btn('다음 →','l2-step',`data-step="${step+1}"`,'primary'):'<a class="button primary" href="#lesson/3">3차시로 →</a>'}</nav></article></div>`;
}
