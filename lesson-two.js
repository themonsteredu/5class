import {escapeHtml as e} from './model.js';
import {artifacts,textbook} from './data.js';
import {lessonOneFigure,observationIds} from './lesson-one.js';
export const secondSteps=['질문 다시 보기','비교 연습','AI 답변 비교','자료로 확인','질문 다듬기','다음 탐구 준비'];
export const secondTimes=[5,6,10,9,7,3];
export const secondWorksheet='assets/worksheets/lesson-2.pdf';
export const sharedQuestion='가야의 집 모양 토기를 보면 당시 집에 대해 무엇을 알 수 있나요?';
const get=id=>artifacts.find(a=>a.id===id);
const paper=(n,t)=>`<div class="l1-paper-note"><span>활동지 ${n}</span><p>${t}</p></div>`;
export const teacherReady=a=>['question','answer-a','answer-b','tool'].every(k=>a('l2-teacher-'+k).trim());
export const inquiryPrompt=q=>`초등학교 5학년의 역사 탐구입니다. 다음 질문에 쉬운 말로 3문장 이내로 답해 주세요. 확실하지 않은 내용은 확실하지 않다고 밝혀 주세요. 근거를 확인할 자료도 알려 주세요.\n\n질문: ${q}`;
export function teacherForm(answer){
 const fields=[['question','우리 반이 함께 물을 질문',1,sharedQuestion],['tool','실제로 사용한 AI 이름 · 질문한 날짜',1,'예: 사용한 AI 이름 / 2026-09-18'],['answer-a','첫 번째 실제 AI 답변',4,'실제 AI에서 받은 답변을 그대로 붙여 넣으세요.'],['answer-b','같은 질문의 두 번째 실제 AI 답변',4,'같은 요청문으로 다시 물어본 답변을 붙여 넣으세요.']];
 return `<h2>실제 AI 답변 준비</h2><p>선생님이 사용하는 AI에서 같은 요청문으로 두 번 질문한 뒤 답변을 옮겨 주세요. 학생은 종이 활동지에 기록합니다.</p><form id="l2-teacher-form">${fields.map(([key,label,rows,placeholder])=>`<label class="field"><span>${label}</span>${rows===1?`<input name="${key}" required maxlength="300" value="${e(answer('l2-teacher-'+key)||(key==='question'?sharedQuestion:''))}" placeholder="${e(placeholder)}">`:`<textarea name="${key}" required maxlength="4000" rows="${rows}" placeholder="${e(placeholder)}">${e(answer('l2-teacher-'+key))}</textarea>`}</label>`).join('')}<label class="field"><span>교과서에서 함께 살펴볼 자료</span><select name="source">${observationIds.map(id=>`<option value="${id}" ${(answer('l2-teacher-source')||'house')===id?'selected':''}>${get(id).name}</option>`).join('')}</select></label><p class="l1-note">이 화면은 AI에 자동으로 연결되지 않습니다. 준비한 답변은 이 기기에 저장됩니다.</p><div class="settings-actions"><button type="submit" class="primary">수업 화면에 띄우기</button>${teacherReady(answer)?'<button type="button" class="quiet" data-action="l2-clear">준비한 답변 비우기</button>':''}</div></form>`;
}
export function lessonTwo({step,answer,btn,source='house',showReason=false}){
 const ready=teacherReady(answer),question=answer('l2-teacher-question')||sharedQuestion;
 const id=observationIds.includes(source)?source:'house',a=get(id);
 let title='',lead='',body='';
 if(step===0){
  title='지난 시간, 무엇이 궁금했나요?';lead='1차시 활동지를 펼치고, 어떤 자료에서 생긴 질문인지 짝에게 소개해 주세요.';
  body=`<div class="l2-recap"><div><p class="l1-side-label">우리 모둠의 출발점</p><h2>어떤 것을 보았나요?</h2><p>사진에서 찾았던 부분을 짚어 주세요.</p><h2>무엇이 궁금해졌나요?</h2><p>활동지에 적은 질문을 읽어 주세요.</p></div><div class="l2-mini-gallery">${observationIds.map(id=>`<figure><img src="assets/images/${get(id).image}" alt="${e(get(id).name)}"><figcaption>${get(id).name}</figcaption></figure>`).join('')}</div></div>${paper('01','지난 시간의 모둠 질문을 한 줄로 옮겨요.')}<p class="l1-lesson-point">오늘은 AI의 설명을 자료와 비교하고, 더 알아볼 질문을 다듬어요.</p>`;
 }
 if(step===1){
  title='두 설명, 무엇이 다른가요?';lead='집 모양 토기를 보며 설명을 읽어 보세요. 더 확인해야 할 말은 무엇인가요?';
  body=`<p class="l2-example-label">비교 연습용 문장 · 실제 AI 답변이 아닙니다.</p><div class="l2-practice">${lessonOneFigure('house')}<div><section class="l2-practice-line"><small>설명 A</small><p>가야 사람들은 모두 이 토기와 똑같은 모양의 집에서 살았어요.</p></section><section class="l2-practice-line"><small>설명 B</small><p>집 모양 토기는 당시 건물의 모습을 살펴볼 단서예요. 모든 집이 같았는지는 다른 자료도 살펴봐야 해요.</p></section>${btn(showReason?'생각 접기':'이야기한 뒤 확인하기','l2-reason','','quiet')} ${showReason?'<p class="l2-reason">A의 “모두”, “똑같은”을 확인해야 해요. 토기 하나만으로 모든 사람의 집을 알 수는 없어요. B도 자료와 비교하며 읽어요.</p>':''}</div></div><p class="l1-note">어느 설명이 더 길거나 자신 있게 말하는지보다, 어떤 근거가 있는지 살펴봐요.</p>`;
 }
 if(step===2){
  title='같은 질문, AI는 어떻게 답했나요?';lead='선생님과 같은 요청문으로 두 번 물어본 뒤, 공통된 말과 다른 말을 찾아보세요.';
  body=`<div class="l2-shared-question"><span>${ready?'우리 반의 공통 질문':'함께 물어볼 질문 예시'}</span><p>${e(question)}</p>${btn('AI에게 줄 요청문 보기','l2-prompt','','quiet small')}</div>${ready?`<p class="l2-answer-meta">선생님이 준비한 실제 AI 답변 · ${e(answer('l2-teacher-tool'))}</p><div class="l2-answer-pair">${['a','b'].map((key,i)=>`<section><h2>${i+1}번째 답변</h2><div class="l2-answer-text">${e(answer('l2-teacher-answer-'+key))}</div></section>`).join('')}</div>`:`<div class="l2-ready-guide"><h2>선생님과 실제 AI에 물어봐요.</h2><ol><li>같은 요청문을 바꾸지 않고 두 번 물어봐요.</li><li>두 답변을 나란히 읽고, 확인하고 싶은 문장을 골라요.</li></ol>${btn('선생님 · 실제 답변 준비','l2-prepare','','quiet')}<p>준비한 실제 답변이 아직 없어요. 수업 전이나 수업 중에 답변을 넣으면 여기에 나타납니다.</p></div>`}${paper('02','자료로 확인하고 싶은 문장 하나를 짧게 적어요.')}<p class="l1-note">답이 서로 같아도 맞는지는 확인해야 해요. 다르게 답했다면 어느 부분이 다른지 찾아봐요.</p>`;
 }
 if(step===3){
  title='자료에서도 그렇게 말하나요?';lead='활동지 02의 문장을 읽고, 교과서나 박물관 설명에서 같은 내용을 찾아보세요.';
  body=`<div class="l1-observe">${lessonOneFigure(id)}<div class="l1-observe-copy"><p class="l1-side-label">교과서 연계 설명 · 내용을 풀어 쓴 글</p><h2 class="l2-evidence-title">${a.name}</h2><p class="l2-evidence-text">${e(a.fact)}</p><p class="l1-note">${e(a.caution)}</p><a href="${textbook.url}" target="_blank" rel="noopener" class="button quiet">교과서 ${a.page}쪽 확인 ↗</a></div></div><div class="l2-source-tabs" role="group" aria-label="확인할 자료">${observationIds.map(key=>btn(get(key).name,'l2-source',`data-id="${key}" aria-pressed="${key===id}"`,'quiet small')).join('')}</div><div class="l2-check-guide"><p><b>자료에 나와요</b> 어디에 어떤 설명이 있는지 말해요.</p><p><b>다르게 나와요</b> 어느 부분이 다른지 말해요.</p><p><b>아직 모르겠어요</b> 설명이 없으면 다른 자료를 더 찾아요.</p></div>${paper('03','확인한 자료의 이름·쪽수와 확인한 내용을 짧게 적어요.')}<p class="l1-note">자료에 없다는 것만으로 틀렸다고 단정하지 않아요. AI가 알려 준 출처도 직접 열어 확인해요.</p>`;
 }
 if(step===4){
  title='어떤 질문으로 더 알아볼까요?';lead='AI 답변과 자료를 보고, 우리 모둠이 다음 시간에 조사할 질문을 다듬어 보세요.';
  body=`<div class="l2-question-revision"><section><span>넓은 질문</span><p>옛날 사람들은 어떻게 살았을까?</p></section><section><span>자료와 알고 싶은 것을 넣은 질문</span><p>가야의 집 모양 토기에서 당시 건물의 어떤 모습을 알 수 있을까?</p></section></div><ol class="l1-talk-list"><li><span>01</span><div><h2>어느 나라의 어떤 자료인가요?</h2><p>집 모양 토기, 수저와 사발, 고분 벽화처럼 자료를 넣어요.</p></div></li><li><span>02</span><div><h2>어떤 생활 모습이 궁금한가요?</h2><p>집, 음식, 옷차림처럼 알아보고 싶은 것을 넣어요.</p></div></li></ol>${paper('04','우리 모둠이 조사할 질문을 한 문장으로 적어요.')}<p class="l1-note">처음 질문이 이미 구체적이면 그대로 써도 좋아요. 그 질문을 이어 가는 까닭을 말해 주세요.</p>`;
 }
 if(step===5){
  title='우리 모둠의 탐구가 시작돼요.';lead='정한 질문과 다음 시간에 찾아볼 자료를 옆 모둠에 소개해 주세요.';
  body=`<div class="l1-share-statement"><span>우리 모둠의 조사 계획</span><p>“우리는 <span class="l1-blank">알고 싶은 것</span>을 알아보기 위해 <span class="l1-blank">찾아볼 자료</span>를 살펴볼 거예요.”</p></div>${paper('04','다음 시간에 찾아볼 자료나 검색할 낱말 하나를 적어요.')}<div class="l2-exit"><p><b>오늘 기억할 것</b> AI의 설명은 역사 자료와 비교해요.</p><p><b>함께 이야기해요</b> 질문이 어떻게 달라졌나요? 왜 그렇게 정했나요?</p></div><div class="l1-next-lesson"><span>3차시 예고</span><p>우리 질문에 필요한 자료를 모으고, 어디에서 찾았는지 함께 기록해요.</p></div>`;
 }
 return `<div class="l1-workspace"><nav class="l1-progress" aria-label="2차시 활동 순서"><ol>${secondSteps.map((name,i)=>`<li>${btn(`<span>0${i+1}</span>${name}`,'l2-step',`data-step="${i}" ${i===step?'aria-current="step"':''}`)}</li>`).join('')}</ol></nav><article class="l1-content"><header class="l1-page-heading"><p class="l1-kicker">2차시 · LOOK <span>${secondSteps[step]} · ${secondTimes[step]}분</span></p><h1>${title}</h1><p class="l1-lead">${lead}</p></header>${body}<nav class="l1-nav" aria-label="2차시 활동 이동">${btn('← 이전','l2-step',`data-step="${step-1}" ${step===0?'disabled':''}`,'quiet')}<span>${step+1} / 6</span>${step<5?btn('다음 →','l2-step',`data-step="${step+1}"`,'primary'):'<a class="button primary" href="#lesson/3">3차시로 →</a>'}</nav></article></div>`;
}
