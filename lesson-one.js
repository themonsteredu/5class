import {escapeHtml as e} from './model.js';
import {artifacts,textbook} from './data.js';

export const firstSteps=['여섯 자료 살펴보기','생활의 단서 찾기','사진으로 모르는 것','우리 모둠의 질문','알아볼 방법','질문 나누기'];
export const observationIds=['susan','spoon','house','figurines','armor','pagoda'];
export const worksheetUrl='assets/worksheets/lesson-1.pdf';
const times=[6,8,7,8,7,4];
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
const paper=(number,message)=>`<div class="l1-paper-note"><span>활동지${number?' '+number:''}</span><p>${message}</p></div>`;

// Keep previously saved digital notes available through the project report.
export function lessonOneReport(answer){
 const id=chosen(answer,'l1-focus');
 return `<p><b>모둠이 고른 자료:</b> ${e(get(id).name)}</p>${observationIds.map(a=>{const seen=answer(observationKey(a,'observed')),q=answer(observationKey(a,'question'));return seen||q?`<h4>${e(get(a).name)}</h4>${seen?`<p>직접 본 것: ${e(seen)}</p>`:''}${q?`<p>궁금한 점: ${e(q)}</p>`:''}`:'';}).join('')}${[['curious','모둠 질문'],['ai-help','AI에게 부탁할 일'],['l1-human-check','우리가 확인할 일']].map(([k,label])=>answer(k)?`<p><b>${label}:</b> ${e(answer(k))}</p>`:'').join('')}`;
}

export function lessonOne({step,source='susan',exampleStep=0,btn}){
 const id=observationIds.includes(source)?source:'susan',n=notes[id];
 let title='',lead='',content='';
 if(step===0){
  title='옛사람들은 어떻게 살았을까요?';
  lead='사람의 모습, 먹고사는 생활, 옛날 기술을 보여 주는 자료를 함께 살펴보세요.';
  content=`<div class="l1-gallery">${observationIds.map((key,i)=>{const a=get(key);return `<button class="l1-gallery-item" data-action="l1-open" data-id="${key}" aria-label="${e(a.name)} 자세히 관찰하기"><span class="l1-gallery-image"><img src="assets/images/${e(a.image)}" alt="${e(a.name)}${key==='pagoda'?' 복원 모습':''}"></span><span class="l1-gallery-caption"><small>0${i+1} · ${a.nation}</small><strong>${a.name}</strong><span>${notes[key].topic}${key==='pagoda'?' · 복원 모습':''}</span></span></button>`;}).join('')}</div>${paper('','여섯 자료를 모두 살펴본 뒤, 자세히 볼 자료 하나에 표시해요.')}<p class="l1-source-credit">사진: 비상교육 사회 5-2(설규주) 25·26·28·30쪽 · 사진을 누르면 크게 볼 수 있어요.</p>`;
 }
 if(step===1){
  title='옛생활의 단서를 찾아볼까요?';
  lead='사진에서 직접 보이는 것을 말하고, 어느 부분을 보았는지 짚어 주세요.';
  content=`<div class="l1-observe">${lessonOneFigure(id)}<div class="l1-observe-copy"><p class="l1-side-label">찬찬히 살펴봐요</p><ul class="l1-clues">${n.look.map(x=>`<li>${x}</li>`).join('')}</ul><p class="l1-speaking-hint">“위쪽에는 …이 있어요.” “두 부분의 모양이 …해요.”</p>${n.notice?`<p class="l1-note">${n.notice}</p>`:''}</div></div>${selector(id,btn)}${paper('01','사진에서 본 것 두 가지를 짧게 적어요.')}`;
 }
 if(step===2){
  title='그릇만 보고 음식도 알 수 있을까요?';
  lead='백제의 그릇으로 함께 생각해 봅시다. 먼저 내 생각을 말한 뒤 다음 내용을 열어 보세요.';
  const reveal=Math.max(0,Math.min(2,exampleStep));
  const prompts=['그릇과 수저가 보여요. 무엇을 담아 먹었는지도 보이나요?','먹었던 음식은 사진에 보이지 않아요. 그렇다면 무엇이 궁금한가요?','보이는 단서에서 출발해, 더 알아볼 질문이 생겼어요.'];
  content=`<div class="l1-example-work">${lessonOneFigure('spoon')}<div class="l1-example-copy"><p class="l1-side-label">함께 연습하기 · 백제의 식기</p><ol class="l1-example-chain"><li><span>본 것</span><p>수저와 그릇이 있어요.</p></li>${reveal>=1?'<li><span>사진으로 모르는 것</span><p>무엇을 담아 먹었는지는 보이지 않아요.</p></li>':''}${reveal>=2?'<li class="l1-example-question"><span>더 알아볼 질문</span><p>백제 사람들은 어떤 음식을 먹었을까요?</p></li>':''}</ol><p class="l1-example-prompt" aria-live="polite">${prompts[reveal]}</p><div class="l1-example-controls">${reveal<2?btn(reveal===0?'사진에 없는 정보 생각하기 →':'궁금증을 질문으로 바꾸기 →','l1-example',`data-example="${reveal+1}"`,'quiet'):btn('처음부터 다시 보기','l1-example','data-example="0"','quiet small')}</div></div></div><p class="l1-lesson-point">유물은 옛생활의 단서예요. 사진에 없는 정보는 다른 자료에서 더 찾아봐야 해요.</p>`;
 }
 if(step===3){
  title='우리 자료에서는 무엇이 궁금한가요?';
  lead='사진으로 모르는 것을 각자 말하고, 우리 모둠이 함께 알아볼 질문 하나를 정해 보세요.';
  content=`<div class="l1-observe l1-question-transfer">${lessonOneFigure(id)}<div class="l1-observe-copy"><p class="l1-side-label">활동지 01의 관찰 기록을 다시 봐요</p><h2 class="l1-open-question">${n.limit}</h2><ol class="l1-question-turns"><li>각자 궁금한 점을 말해요.</li><li>함께 가장 알아보고 싶은 것을 골라요.</li><li>무엇을 알아볼지 한 문장으로 말해요.</li></ol><details class="l1-hint"><summary>질문을 만드는 데 도움이 필요하면</summary><p>“누가 / 어떻게 / 왜 …?”로 시작해 보세요.</p><p class="l1-question-example">예: ${n.question}</p></details></div></div>${selector(id,btn)}${paper('02','우리 모둠의 질문 하나를 적어요. 왜 궁금한지는 말로 이야기해요.')}`;
 }
 if(step===4){
  title='우리 질문은 어떻게 알아볼까요?';
  lead='활동지의 질문을 읽고, 먼저 해 볼 방법 하나를 골라 보세요.';
  content=`<div class="l1-research-list"><section><span>01</span><div><h2>교과서에서 찾아요.</h2><p>사진 주변 설명과 다른 자료에서 우리 질문의 단서를 찾아요.</p></div></section><section><span>02</span><div><h2>박물관 설명을 찾아요.</h2><p>자료의 이름으로 검색해 설명을 읽고, 비슷한 유물도 살펴봐요.</p></div></section><section><span>03</span><div><h2>AI에게 도움을 부탁해요.</h2><p>찾아볼 낱말을 제안하거나, 어려운 낱말을 쉽게 설명해 줄 수 있을까요?</p><details class="l1-hint"><summary>우리 자료로 부탁 문장 생각하기</summary><p>“${get(id).name}에 대해 더 알아보려면 어떤 낱말로 찾아보면 좋을까?”</p><small>AI에게 해 볼 부탁의 예시예요. 실제 답변은 다음 시간에 함께 살펴봐요.</small></details></div></section></div>${paper('03','먼저 해 볼 방법에 표시하고, 무엇을 찾거나 부탁할지 짧게 적어요.')}<p class="l1-ai-note">AI의 설명은 교과서나 박물관 자료와 비교해 확인해요.</p>`;
 }
 if(step===5){
  title='무엇을, 왜 알아보고 싶나요?';
  lead='활동지를 보며 우리 모둠의 질문과 알아볼 방법을 소개해 주세요.';
  content=`<div class="l1-share-statement"><span>관찰에서 탐구로</span><p>“우리는 <span class="l1-blank">본 것</span>을 보고, <span class="l1-blank">질문</span>이 궁금해졌어요.”</p></div><div class="l1-share-prompts"><p><b>이어서 말해요</b> “그래서 먼저 …을 찾아보거나 부탁하려고 해요.”</p><p><b>친구 이야기를 들어요</b> 어떤 단서에서 그 질문이 생겼나요?</p></div><div class="l1-next-lesson"><span>2차시 예고</span><p>오늘 만든 질문을 실제 AI에게 묻고, 답을 역사 자료와 비교해요. 활동지를 다음 시간에도 가져오세요.</p></div>`;
 }
 return `<div class="l1-workspace"><nav class="l1-progress" aria-label="1차시 활동 순서"><ol>${firstSteps.map((name,i)=>`<li>${btn(`<span>0${i+1}</span>${name}`,'l1-step',`data-step="${i}" ${i===step?'aria-current="step"':''}`)}</li>`).join('')}</ol></nav><article class="l1-content"><header class="l1-page-heading"><p class="l1-kicker">1차시 · LOOK <span>${firstSteps[step]} · ${times[step]}분</span></p><h1>${title}</h1><p class="l1-lead">${lead}</p></header>${content}<nav class="l1-nav" aria-label="1차시 활동 이동">${btn('← 이전','l1-step',`data-step="${step-1}" ${step===0?'disabled':''}`,'quiet')}<span>${step+1} / 6</span>${step<5?btn('다음 →','l1-step',`data-step="${step+1}"`,'primary'):'<a class="button primary" href="#lesson/2">2차시로 →</a>'}</nav></article></div>`;
}
