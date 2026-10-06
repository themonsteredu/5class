// 우리 반 역사 로봇: 아이들이 가르친 지식 카드만 보고 문장이 맞는지 판단합니다.
// 카드에 없는 내용은 지어내지 않고 '몰라요'라고 답합니다.
export const nations=['고구려','백제','신라','가야'];
export const materials=['흙','금','금동','청동','철','돌','유리','나무','벽에 그린 그림'];

// 아이들이 문장에 쓰는 유물 이름. 문장 앞쪽에 먼저 나온 유물을 주인공으로 봅니다.
const aliases={
 susan:['수산리 고분 벽화','수산리 벽화','수산리'],
 kitchen:['안악 3호분','안악','부엌 그림','고기 창고'],
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
 seosan:['마애여래 삼존상','마애 삼존상','삼존상','마애','서산'],
 glass:['유리 제품','유리잔','유리 그릇'],
 star:['첨성대'],
 burner:['금동대향로','향로'],
 tomb:['무령왕릉']
};
const materialWords=[['벽에 그린 그림','벽에 그린 그림'],['금동','금동'],['청동','청동'],['황금','금'],['진흙','흙'],['화강암','돌'],['바위','돌'],['벽화','벽에 그린 그림'],['그림','벽에 그린 그림'],['쇠','철'],['철','철'],['금','금'],['흙','흙'],['돌','돌'],['유리','유리'],['나무','나무']];
const stop=new Set(['이다','였다','었다','했다','한다','된다','있다','있었','이에','에요','니다','습니','으로','에서','에게','하는','만들','들었','이었','였어','이야','였던','했던','유물','것이']);

function findArtifact(text){
 const hits=[];
 for(const [id,list] of Object.entries(aliases))for(const alias of list){const index=text.indexOf(alias);if(index>=0)hits.push({id,alias,index});}
 if(!hits.length)return null;
 hits.sort((a,b)=>a.index-b.index||b.alias.length-a.alias.length);
 return hits[0];
}
function findMaterial(text){
 for(const [word,value] of materialWords)if(text.includes(word))return {word,value};
 return null;
}
const wordsOf=text=>text.split(/[^가-힣a-z0-9]+/).filter(Boolean);
function bigrams(text){const out=new Set();for(const w of wordsOf(text))for(let i=0;i<w.length-1;i++){const b=w.slice(i,i+2);if(!stop.has(b))out.add(b);}return out;}
export function sameWords(a,b){const target=bigrams(b);return [...bigrams(a)].filter(x=>target.has(x));}
const unique=list=>[...new Set(list.filter(Boolean))];
const who=card=>card.group===0?'선생님':`${card.group}모둠`;
const batchim=word=>{const code=word.charCodeAt(word.length-1)-0xac00;return code>=0&&code<11172?code%28:0;};
const josa=(word,[withEnd,without])=>word+(batchim(word)?withEnd:without);
const ro=word=>word+(batchim(word)&&batchim(word)!==8?'으로':'로');
const ieyo=word=>word+(batchim(word)?'이에요':'예요');

export function askRobot(input,cards,nameOf=id=>id){
 const text=String(input||'').replace(/\s+/g,' ').trim();
 const thought={artifact:'',nation:'',material:'',words:[]};
 if(!text)return {answer:'',reason:'',thought,evidence:[]};
 const negative=/아니|않/.test(text);
 const subject=findArtifact(text);
 let rest=subject?text.slice(0,subject.index)+' '+text.slice(subject.index+subject.alias.length):text;
 const nation=nations.find(n=>rest.includes(n))||'';
 if(nation)rest=rest.replace(nation,' ');
 const material=findMaterial(rest);
 if(material)rest=rest.replace(material.word,' ');
 Object.assign(thought,{artifact:subject?nameOf(subject.id):'',nation,material:material?.value||''});
 const finish=(answer,reason,evidence=[])=>{
  if(negative&&(answer==='맞아요'||answer==='아니에요'))answer=answer==='맞아요'?'아니에요':'맞아요';
  return {answer,reason,thought,evidence};
 };
 if(subject){
  const name=nameOf(subject.id),known=cards.filter(c=>c.artifact===subject.id);
  if(!known.length)return finish('몰라요',`${josa(name,['은','는'])} 아직 배우지 않았어요. 가르쳐 줄래요?`);
  const checks=[];
  if(nation){
   const values=unique(known.map(c=>c.nation));
   if(values.length>1)return finish('헷갈려요',`카드마다 나라가 달라요: ${known.map(c=>`${who(c)} ${c.nation}`).join(', ')}. 어느 카드가 맞는지 확인해 주세요.`,known);
   checks.push({ok:values[0]===nation,fact:`${josa(name,['은','는'])} ${values[0]} 유물이에요.`});
  }
  if(material){
   const withMaterial=known.filter(c=>c.material);
   const values=unique(withMaterial.map(c=>c.material));
   if(values.length>1)return finish('헷갈려요',`카드마다 재료가 달라요: ${withMaterial.map(c=>`${who(c)} ${c.material}`).join(', ')}. 어느 카드가 맞는지 확인해 주세요.`,withMaterial);
   if(values.length)checks.push({ok:values[0]===material.value,fact:`${name}의 재료는 ${ieyo(values[0])}.`});
   else if(!nation)return finish('몰라요',`${name}의 재료는 아직 배우지 않았어요.`,known);
  }
  if(checks.length){
   const wrong=checks.find(c=>!c.ok);
   return finish(wrong?'아니에요':'맞아요',`우리 반 카드에서 ${checks.map(c=>c.fact).join(' ')}`,known);
  }
  const matched=known.map(c=>({c,w:sameWords(rest,`${c.use} ${c.feature}`)})).filter(x=>x.w.length);
  thought.words=unique(matched.flatMap(x=>x.w));
  if(matched.length)return finish('맞아요',`카드에서 같은 말(${thought.words.join(', ')})을 찾았어요.`,matched.map(x=>x.c));
  return finish('몰라요',`${name}에 대해 그 내용은 아직 배우지 않았어요.`,known);
 }
 if(nation){
  const known=cards.filter(c=>c.nation===nation);
  if(!known.length)return finish('몰라요',`${nation}에 대해서는 아직 배우지 않았어요.`);
  const all=/모두|전부/.test(text);
  if(material){
   const has=known.filter(c=>c.material===material.value),others=known.filter(c=>c.material&&c.material!==material.value);
   if(all)return others.length?finish('아니에요',`${nation} 유물 중에 ${josa(material.value,['이','가'])} 아닌 것도 있어요: ${others.map(c=>`${nameOf(c.artifact)}(${c.material})`).join(', ')}.`,others):has.length?finish('맞아요',`우리 반 카드의 ${nation} 유물은 모두 ${ieyo(material.value)}.`,has):finish('몰라요',`${nation} 유물의 재료는 아직 배우지 않았어요.`);
   return has.length?finish('맞아요',`${nation} 유물 중에 ${ro(material.value)} 만든 것이 있어요: ${has.map(c=>nameOf(c.artifact)||'나라 카드').join(', ')}.`,has):finish('몰라요',`${nation} 유물 중 ${ro(material.value)} 만든 것은 아직 배우지 않았어요.`);
  }
  const matched=known.map(c=>({c,w:sameWords(rest,`${c.use} ${c.feature}`)})).filter(x=>x.w.length);
  thought.words=unique(matched.flatMap(x=>x.w));
  if(matched.length)return finish('맞아요',`${nation} 카드에서 같은 말(${thought.words.join(', ')})을 찾았어요.`,matched.map(x=>x.c));
  return finish('몰라요',`${nation}에 대해 그 내용은 아직 배우지 않았어요.`);
 }
 if(material){
  const has=cards.filter(c=>c.material===material.value);
  return has.length?finish('맞아요',`${ro(material.value)} 만든 유물을 배웠어요: ${has.map(c=>nameOf(c.artifact)||c.nation).join(', ')}.`,has):finish('몰라요',`${ro(material.value)} 만든 유물은 아직 배우지 않았어요.`);
 }
 return finish('못 알아들었어요','유물 이름이나 나라 이름을 넣어서 다시 물어봐 주세요. 예: 금관은 신라 유물이다.');
}

// 진짜 AI에게 같은 지식 카드를 주고 우리 로봇처럼 대답하게 하는 요청문입니다.
export function realAiPrompt(cards,nameOf=id=>id){
 const lines=cards.map(c=>`- ${c.artifact?nameOf(c.artifact):`${c.nation} 전체`} | 나라: ${c.nation}${c.material?` | 재료: ${c.material}`:''}${c.use?` | 쓰임: ${c.use}`:''}${c.feature?` | 특징: ${c.feature}`:''}`);
 return `너는 초등학교 5학년 우리 반이 만든 "역사 로봇"이야.\n아래 [지식 카드]에 적힌 내용만 사용해서 대답해. 네가 원래 알고 있는 지식은 쓰지 마.\n학생이 문장을 말하면 "맞아요", "아니에요", "몰라요" 중 하나로 먼저 대답하고, 근거가 된 카드를 한 줄로 말해 줘.\n카드에 없는 내용이면 반드시 "몰라요"라고 대답해.\n\n[지식 카드]\n${lines.join('\n')||'- (아직 없음)'}\n\n준비되었으면 "질문해 주세요!"라고만 말해.`;
}
