import {escapeHtml as e} from './model.js';
import {artifacts,textbook} from './data.js';

export const firstSteps=['여섯 자료 만나기','자세히 관찰하기','궁금한 점 모으기','우리 모둠의 질문','AI가 도울 일','발견 나누기'];
export const observationIds=['susan','spoon','house','figurines','armor','pagoda'];
export const worksheetUrl='assets/worksheets/lesson-1.pdf';
const times=[6,8,8,8,6,4];
const notes={
 susan:{topic:'옷차림과 신분',look:['사람의 크기','옷의 무늬','손에 든 물건'],question:'왜 어떤 사람을 더 크게 그렸을까?',limit:'그림 속 크기가 실제 키와 같을까요?',notice:'벽화의 인물 부분을 발췌했어요.'},
 spoon:{topic:'음식과 식기',look:['수저의 모양','사발의 깊이','오늘날 식기와 차이'],question:'이 그릇에는 어떤 음식을 담았을까?',limit:'그릇의 모양만으로 먹었던 음식을 알 수 있을까요?'},
 house:{topic:'집과 건물',look:['지붕의 모양','아래쪽 기둥','바닥의 높이'],question:'왜 집의 바닥을 높게 만들었을까?',limit:'집을 본뜬 물건 하나로 모든 집의 모습을 알 수 있을까요?',notice:'사람이 사는 집이 아니라 집 모양으로 만든 토기예요.'},
 figurines:{topic:'사람의 모습',look:['팔과 다리의 자세','옷의 모양','두 인물의 차이'],question:'왜 사람의 모습을 흙으로 작게 만들었을까?',limit:'작은 인물의 자세만 보고 무엇을 하는지 알 수 있을까요?'},
 armor:{topic:'철을 다루는 기술',look:['머리를 덮는 부분','몸을 감싸는 부분','이어 붙인 부분'],question:'갑옷을 입고 어떻게 움직였을까?',limit:'사진만 보고 갑옷의 무게나 움직임을 알 수 있을까요?'},
 pagoda:{topic:'건축과 불교문화',look:['층마다 있는 지붕','아래쪽 기둥','위아래 크기 차이'],question:'사람들은 왜 큰 탑을 세웠을까?',limit:'겉모양만 보고 탑을 세운 까닭을 알 수 있을까요?',notice:'교과서에 실린 석탑 복원 모습이에요.'}
};
const get=id=>artifacts.find(a=>a.id===id);
export const observationKey=(id,kind)=>`l1-${id}-${kind}`;
const chosen=(answer,key)=>observationIds.includes(answer(key))?answer(key):'susan';

export function lessonOneFigure(id){
 const a=get(id);
 return `<figure class="l1-figure"><div class="l1-image"><img src="assets/images/${e(a.image)}" alt="${e(a.name)}${id==='pagoda'?' · 복원 모습':''}"></div><figcaption><span>${e(a.name)}${id==='pagoda'?' · 복원 모습':''}</span><a href="${textbook.url}" target="_blank" rel="noopener">비상 사회 5-2 · ${a.page}쪽 ↗</a></figcaption></figure>`;
}
function selector(active,btn){
 return `<div class="l1-source-strip" role="group" aria-label="관찰 자료 선택">${observationIds.map((id,i)=>btn(`<img src="assets/images/${get(id).image}" alt=""><span>0${i+1}</span>`,'l1-object',`data-id="${id}" aria-label="${e(get(id).name)} 보기" title="${e(get(id).name)}" aria-pressed="${active===id}"`)).join('')}<span>다른 자료도 살펴보세요.</span></div>`;
}
const paper=(number,message)=>`<div class="l1-paper-note"><span>활동지 ${number}</span><p>${message}</p></div>`;

// Keep previously saved digital notes available through the project report.
export function lessonOneReport(answer){
 const id=chosen(answer,'l1-focus');
 return `<p><b>모둠이 고른 자료:</b> ${e(get(id).name)}</p>${observationIds.map(a=>{const seen=answer(observationKey(a,'observed')),q=answer(observationKey(a,'question'));return seen||q?`<h4>${e(get(a).name)}</h4>${seen?`<p>직접 본 것: ${e(seen)}</p>`:''}${q?`<p>궁금한 점: ${e(q)}</p>`:''}`:'';}).join('')}${[['curious','모둠 질문'],['ai-help','AI에게 부탁할 일'],['l1-human-check','우리가 확인할 일']].map(([k,label])=>answer(k)?`<p><b>${label}:</b> ${e(answer(k))}</p>`:'').join('')}`;
}

export function lessonOne({step,source='susan',btn}){
 const id=observationIds.includes(source)?source:'susan',n=notes[id];
 let title='',lead='',content='';
 if(step===0){
  title='옛사람들은 어떻게 살았을까요?';
  lead='여섯 자료를 둘러보고, 가장 궁금한 자료를 짝에게 말해 보세요.';
  content=`<div class="l1-gallery">${observationIds.map((key,i)=>{const a=get(key);return `<button class="l1-gallery-item" data-action="l1-open" data-id="${key}" aria-label="${e(a.name)} 자세히 관찰하기"><span class="l1-gallery-image"><img src="assets/images/${e(a.image)}" alt="${e(a.name)}${key==='pagoda'?' 복원 모습':''}"></span><span class="l1-gallery-caption"><small>0${i+1} · ${a.nation}</small><strong>${a.name}</strong><span>${notes[key].topic}${key==='pagoda'?' · 복원 모습':''}</span></span></button>`;}).join('')}</div>${paper('01','자세히 보고 싶은 자료 하나에 표시해요.')}<p class="l1-source-credit">사진: 비상교육 사회 5-2(설규주) 25·26·28·30쪽 · 사진을 누르면 크게 볼 수 있어요.</p>`;
 }
 if(step===1){
  title='어느 부분이 눈에 들어왔나요?';
  lead='사진에서 직접 보이는 것을 찾고, 그 부분을 짝에게 짚어 주세요.';
  content=`<div class="l1-observe">${lessonOneFigure(id)}<div class="l1-observe-copy"><p class="l1-side-label">찬찬히 살펴봐요</p><ul class="l1-clues">${n.look.map(x=>`<li>${x}</li>`).join('')}</ul><p class="l1-speaking-hint">“위쪽에는 …이 있어요.”<br>“두 부분의 모양이 …해요.”</p>${n.notice?`<p class="l1-note">${n.notice}</p>`:''}</div></div>${selector(id,btn)}${paper('02','눈으로 찾은 특징 두 가지를 짧게 적어요.')}`;
 }
 if(step===2){
  title='사진만 보고 알 수 있을까요?';
  lead='눈으로 찾은 특징에서 더 알아보고 싶은 점을 떠올려 보세요.';
  content=`<div class="l1-observe">${lessonOneFigure(id)}<div class="l1-observe-copy"><p class="l1-side-label">생각을 여는 질문</p><h2 class="l1-open-question">${n.limit}</h2><p class="l1-question-words">누가 · 언제 · 어떻게 · 왜</p><details class="l1-hint"><summary>질문이 잘 떠오르지 않으면</summary><p>${n.question}</p></details></div></div>${selector(id,btn)}${paper('03','「내 질문」에 궁금한 점 하나를 적어요.')}`;
 }
 if(step===3){
  title='함께 알아보고 싶은 것은?';
  lead='각자의 활동지를 펼치고, 모둠 친구들의 질문을 들어 보세요.';
  content=`<ol class="l1-talk-list"><li><span>01</span><div><h2>내 질문을 읽어요.</h2><p>어떤 자료를 보고 무엇이 궁금했는지 돌아가며 말해요.</p></div></li><li><span>02</span><div><h2>함께 궁금한 것을 골라요.</h2><p>왜 알아보고 싶은지 이야기하고, 질문 하나를 정해요.</p></div></li><li><span>03</span><div><h2>우리 말로 질문을 다듬어요.</h2><p>무엇을 알아보려는지 분명하게 말해 봐요.</p></div></li></ol>${paper('03','「우리 모둠 질문」에 함께 정한 질문을 한 줄로 적어요.')}<p class="l1-note">오늘 발견한 궁금증을 다음 시간 탐구로 이어 갑니다.</p>`;
 }
 if(step===4){
  title='AI가 우리 탐구를 어떻게 도울까요?';
  lead='우리 모둠의 질문을 살펴보고, 어떤 도움을 받고 싶은지 이야기해 보세요.';
  const helps=[['메모 정리하기','우리가 관찰한 내용을 보기 쉽게 묶어 줄 수 있을까?'],['낱말 뜻 알아보기','토우·청동·석탑 같은 말을 쉽게 설명해 줄 수 있을까?'],['질문 더 떠올리기','우리 질문과 이어지는 다른 궁금증을 제안해 줄 수 있을까?']];
  content=`<div class="l1-help-list">${helps.map(([name,description],i)=>`<section><span>0${i+1}</span><h2>${name}</h2><p>${description}</p></section>`).join('')}</div>${paper('04','AI에게 부탁하고 싶은 일에 표시해요. 다른 부탁을 적어도 좋아요.')}<div class="l1-ai-note"><b>AI의 답도 함께 확인해요.</b><p>교과서나 박물관 자료와 비교하면 좋겠지요? 실제 AI에게 묻는 활동은 다음 시간에 해요.</p></div>`;
 }
 if(step===5){
  title='우리는 이것이 궁금해졌어요.';
  lead='활동지를 보며, 우리 모둠의 질문을 친구들에게 소개해 주세요.';
  content=`<div class="l1-share-statement"><span>이렇게 이야기해요</span><p>“우리는 <span class="l1-blank">어떤 자료</span>을 보고, <span class="l1-blank">궁금한 점</span>이 궁금해졌어요.”</p></div><div class="l1-share-prompts"><p><b>발표할 때</b> 사진의 어느 부분을 보았는지도 말해요.</p><p><b>들을 때</b> 우리 모둠의 질문과 어떤 점이 다른지 생각해요.</p></div><div class="l1-next-lesson"><span>다음 시간</span><p>활동지의 질문을 AI에게 묻고, 답을 역사 자료와 비교해요.</p></div>`;
 }
 return `<div class="l1-workspace"><nav class="l1-progress" aria-label="1차시 활동 순서"><ol>${firstSteps.map((name,i)=>`<li>${btn(`<span>0${i+1}</span>${name}`,'l1-step',`data-step="${i}" ${i===step?'aria-current="step"':''}`)}</li>`).join('')}</ol></nav><article class="l1-content"><header class="l1-page-heading"><p class="l1-kicker">1차시 · LOOK <span>${firstSteps[step]} · ${times[step]}분</span></p><h1>${title}</h1><p class="l1-lead">${lead}</p></header>${content}<nav class="l1-nav" aria-label="1차시 활동 이동">${btn('← 이전','l1-step',`data-step="${step-1}" ${step===0?'disabled':''}`,'quiet')}<span>${step+1} / 6</span>${step<5?btn('다음 →','l1-step',`data-step="${step+1}"`,'primary'):'<a class="button primary" href="#lesson/2">2차시로 →</a>'}</nav></article></div>`;
}
