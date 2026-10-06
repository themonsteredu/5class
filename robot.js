// 나라별 역사 로봇: 아이들이 가르친 우리 반 검증 문장만 보고 대답합니다.
// 3차시 문장 상태가 대답 방식이 됩니다: 사실 확인 → 맞아요, 고친 문장 → 원래 말은 틀렸어요, 판단 보류 → 알 수 없어요.
export const nations=['고구려','백제','신라','가야'];
export const defaultTeams={1:'고구려',2:'고구려',3:'백제',4:'신라',5:'신라',6:'가야'};

// 아이들이 말하는 유물 이름. 문장 앞쪽에 먼저 나온 유물을 주인공으로 봅니다.
const aliases={
 susan:['수산리 고분 벽화','수산리 벽화','수산리'],
 kitchen:['안악 3호분','안악','부엌 그림','부엌','고기 창고'],
 dancers:['춤추는 사람들 그림','춤추는 사람','춤 그림','무용총 춤'],
 guests:['손님맞이 그림','손님맞이'],
 spoon:['청동 수저','수저','숟가락','젓가락','사발'],
 house:['집 모양 토기','집모양 토기','집모양토기','집 모양'],
 armor:['철 갑옷','갑옷','투구'],
 figurines:['토우'],
 'gold-crown':['금관'],
 belt:['금제 허리띠','허리띠'],
 pagoda:['미륵사지 석탑','미륵사지','석탑'],
 buddha:['연가 7년명','연가','금동 불상','여래 입상'],
 seosan:['마애여래 삼존상','마애 삼존상','삼존상','마애불','마애'],
 glass:['유리 제품','유리잔','유리 그릇','유리병'],
 star:['첨성대'],
 burner:['금동대향로','향로'],
 tomb:['무령왕릉']
};
// 서로 함께 맞을 수 없는 낱말 묶음: 질문과 배운 문장이 다른 낱말을 쓰면 '아니에요'로 봅니다.
const exclusive=[['고구려','백제','신라','가야'],['금동','청동','철','쇠','흙','돌','유리','나무','금']];
const sameAs={'쇠':'철'};
const stop=new Set(['이다','였다','었다','했다','한다','된다','있다','있었','있어','이에','에요','니다','습니','으로','에서','에게','하는','만들','들었','이었','였어','이야','였던','했던','유물','것이','뭐야','뭐가','무엇','무슨','어디','누가','누구','언제','어떻','떻게','어떤','알려','려줘','해줘','줄래','로봇','는지','었니','했니','이니','인가','나요','까요','니까','거야','건가']);
const questionWords=/뭐|무엇|무슨|어디|누가|누구|언제|왜|어떻게|어떤|몇|알려/;

export function findArtifact(text){
 const hits=[];
 for(const [id,list] of Object.entries(aliases))for(const alias of list){const index=text.indexOf(alias);if(index>=0)hits.push({id,alias,index});}
 hits.sort((a,b)=>a.index-b.index||b.alias.length-a.alias.length);
 return hits[0]||null;
}
const withoutNames=text=>Object.values(aliases).flat().sort((a,b)=>b.length-a.length).reduce((t,alias)=>t.split(alias).join(' '),text);
function exclusiveWord(text,group){
 let rest=withoutNames(text);
 for(const word of [...group].sort((a,b)=>b.length-a.length))if(rest.includes(word))return sameAs[word]||word;
 return '';
}
function bigrams(text){const out=new Set();for(const w of text.split(/[^가-힣a-z0-9]+/).filter(Boolean))for(let i=0;i<w.length-1;i++){const b=w.slice(i,i+2);if(!stop.has(b))out.add(b);}return out;}
export function similarity(question,sentence){
 const q=bigrams(question),s=bigrams(sentence);
 if(!q.size)return {score:0,words:[]};
 const words=[...q].filter(b=>s.has(b));
 return {score:words.length/q.size,words};
}
// 질문과 배운 문장이 나라·재료 낱말에서 부딪히면 true
function conflicts(question,sentence){
 return exclusive.some(group=>{const a=exclusiveWord(question,group),b=exclusiveWord(sentence,group);return a&&b&&a!==b&&!withoutNames(sentence).includes(a);});
}
const batchim=word=>{const code=word.charCodeAt(word.length-1)-0xac00;return code>=0&&code<11172?code%28:0;};
const josa=(word,[withEnd,without])=>word+(batchim(word)?withEnd:without);

export function askNationRobot(input,nation,facts,nameOf=id=>id){
 const text=String(input||'').replace(/\s+/g,' ').trim();
 const thought={artifact:'',match:'',score:0,words:[]};
 const reply=(answer,say,fact=null)=>({answer,say,fact,thought});
 if(!text)return reply('','');
 const mine=facts.filter(f=>f.nation===nation);
 if(!mine.length)return reply('몰라요',`저는 아직 아무것도 배우지 않았어요. ${nation} 유물에 대해 가르쳐 주세요!`);
 const asking=questionWords.test(text);
 const subject=findArtifact(text);
 let pool=mine;
 if(subject){
  thought.artifact=nameOf(subject.id);
  pool=mine.filter(f=>f.artifact===subject.id);
  if(!pool.length)return reply('몰라요',`저는 ${josa(nameOf(subject.id),['을','를'])} 배우지 않았어요. 다른 나라 로봇에게 물어볼까요?`);
 }
 if(!subject&&/뭐가 있|무엇이 있|어떤 유물|무슨 유물/.test(text)){
  const names=[...new Set(mine.map(f=>f.artifact).filter(Boolean))].map(nameOf);
  return reply('알려 줄게요',`제가 배운 ${nation} 유물은 ${names.join(', ')}이에요.`);
 }
 const scored=pool.map(f=>{
  const now=similarity(text,f.sentence),before=f.original?similarity(text,f.original):{score:0,words:[]};
  const best=before.score>now.score?{...before,side:'original'}:{...now,side:'sentence'};
  return {f,...best};
 }).sort((a,b)=>b.score-a.score);
 const top=scored[0];
 Object.assign(thought,{match:top?.f.sentence||'',score:top?Math.round(top.score*100):0,words:top?.words||[]});
 const enough=top&&(top.score>=0.3||top.words.length>=3||(subject&&top.words.length>=1));
 if(!enough){
  if(subject&&asking)return reply('알려 줄게요',`${nameOf(subject.id)}에 대해 제가 배운 건 이거예요. ${pool.slice(0,2).map(f=>f.sentence).join(' ')}`,pool[0]);
  return reply('몰라요','그건 아직 배우지 않았어요. 가르쳐 줄래요?');
 }
 const f=top.f;
 if(f.status==='판단 보류')return reply('알 수 없어요',`그건 자료로는 알 수 없어요. 우리 반이 판단을 보류한 내용이에요.`,f);
 if(f.status==='고친 문장'&&top.side==='original')return reply('아니에요',`그건 틀린 말이에요! 바르게 고친 문장은 이거예요. ${f.sentence}`,f);
 if(!asking&&conflicts(text,f.sentence))return reply('아니에요',`제가 배운 것과 달라요. ${f.sentence}`,f);
 return asking?reply('알려 줄게요',f.sentence,f):reply('맞아요',`맞아요! ${f.sentence}`,f);
}

// 진짜 AI(챗GPT 음성 대화 등)에 넣어 같은 나라 로봇을 만드는 요청문입니다.
export function nationPrompt(nation,facts,nameOf=id=>id){
 const lines=facts.filter(f=>f.nation===nation).map(f=>`- [${f.status}] ${f.artifact?`(${nameOf(f.artifact)}) `:''}${f.sentence}${f.original?` / 원래 틀린 문장: ${f.original}`:''}`);
 return `너는 초등학교 5학년 우리 반이 만든 "${nation} 역사 로봇"이야.\n아래 [배운 문장]만 사용해서 대답해. 네가 원래 알고 있는 지식은 쓰지 마.\n- [사실 확인] 문장과 같은 내용이면 "맞아요"라고 해.\n- [고친 문장]의 원래 틀린 문장처럼 말하면 "아니에요"라고 하고 고친 문장을 알려 줘.\n- [판단 보류] 문장은 "자료로는 알 수 없어요"라고 해.\n- 배운 문장에 없는 질문은 반드시 "몰라요, 아직 배우지 않았어요"라고 해.\n초등학생이 알아듣기 쉽게 한두 문장으로 짧게 대답해.\n\n[배운 문장]\n${lines.join('\n')||'- (아직 없음)'}\n\n준비되었으면 "안녕! 나는 ${nation} 로봇이야. 무엇이든 물어봐!"라고만 말해.`;
}
