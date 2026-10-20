import {artifacts} from './data.js';
import {findArtifact, similarity} from './robot.js';
export const artifactById=id=>artifacts.find(a=>a.id===id);
export const nameOf=id=>artifactById(id)?.name||id;
const national=/나라|왕조|국가|시대|고구려|백제|신라|가야|고려|조선|삼국|왕국|국적|출신|지역|출토|발견|출처|어디.*(?:나왔|왔|만들|살)|어느.*(?:왕|지역)|왕.*(?:때|시절)|goguryeo|baekje|silla|gaya|country|dynasty|kingdom/i;
const categoryRules=[
 [/재료|만들어|만들었|무엇으로|뭘로|금속|material/,/청동|금동|금으로|금제|철|쇠|흙|토기|돌|석재|유리|나무|벽돌|벽면|벽에/],
 [/모양|생김|생겼|모습|장식|무늬|특징|색|형태/,/모양|장식|무늬|그려|그림|모습|형태|둥|네모|가지|뿔|소매|인물|색|매달|뚫|줄|크기/],
 [/쓰임|쓰였|사용|용도|무슨 일|역할|썼|쓰는|왜/,/쓰|사용|먹|보관|준비|보호|입|착용|관측|향|재료|교류|꾸미|신분|불교|믿음|생활/]
];
export function blockedQuestion(question){
 const q=String(question).normalize('NFKC').replace(/\s+/g,' ').trim(),compact=q.replace(/[^가-힣a-z0-9]/gi,'');
 if(national.test(q)||national.test(compact))return '나라·시대·지역은 비밀이에요. 재료, 생김새, 쓰임을 물어봐 주세요. 질문 횟수는 줄지 않았어요.';
 if(/이름|정답|정체|누구|뭐니|뭐야|name|identity/i.test(q)&&!categoryRules.some(([r])=>r.test(q))||findArtifact(q)||artifacts.some(a=>compact.includes(a.name.replace(/[^가-힣a-z0-9]/gi,''))))return '유물 이름은 답안에서 골라 주세요. 특징에 대해 물어보면 단서를 드릴게요. 질문 횟수는 줄지 않았어요.';
 return '';
}
// 원본/출처/프로필을 대화에 붙이지 않습니다. 짧은 별칭도 모두 제거합니다.
const secretWords=['고구려','백제','신라','가야','고려','조선','삼국','부여','경주','익산','서산','황남대총','북분','연가','7년명','무령왕','선덕여왕','수산리','무용총','안악','미륵사지','금관','금동대향로','향로','첨성대','토우','덩이쇠','고분군','삼존상','여래 입상','여래입상','불상','허리띠','갑옷','투구','수저','숟가락','젓가락','사발','집 모양 토기','집모양토기'];
export function maskSecrets(text){
 let out=String(text||'');
 for(const name of [...artifacts.map(a=>a.name),...secretWords].sort((a,b)=>b.length-a.length))out=out.split(name).join('이 유물');
 out=out.replace(/(?:이 유물[의 ]*){2,}/g,'이 유물 ').replace(/교과서\s*\d+쪽/g,'자료');
 return out.trim();
}
export function answerMystery(question,id,facts){
 const block=blockedQuestion(question);if(block)return {say:block,charged:false,blocked:true};
 const pool=facts.filter(f=>f.artifact===id&&['사실 확인','고친 문장'].includes(f.status));
 const rule=categoryRules.find(([r])=>r.test(question));
 const scored=pool.map(f=>({f,score:similarity(question,f.sentence).score+(rule&&rule[1].test(f.sentence)?1:0)})).sort((a,b)=>b.score-a.score);
 if(!scored.length||scored[0].score<0.3)return {say:'그건 아직 배우지 못했어요. 다른 특징을 물어봐 주세요. 질문 횟수는 줄지 않았어요.',charged:false};
 const say=maskSecrets(scored[0].f.sentence).slice(0,295);
 if(!say||!say.replace(/이 유물|[은는이가을를의에요다입니.\s]/g,''))return {say:'이름 말고 알려줄 특징을 아직 배우지 못했어요. 질문 횟수는 줄지 않았어요.',charged:false};
 return {say,charged:true};
}
export function shuffle(items,seed){let x=2166136261;for(const c of String(seed))x=Math.imul(x^c.charCodeAt(0),16777619)>>>0;const a=[...items];for(let i=a.length-1;i>0;i--){x=(Math.imul(x,1664525)+1013904223)>>>0;const j=x%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function validConfig(value){
 if(!value||!Array.isArray(value.ids)||value.ids.length<2||value.ids.length>6||new Set(value.ids).size!==value.ids.length||value.ids.some(id=>!artifactById(id)))return null;
 if(!/^[a-z0-9]{8,16}$/.test(value.run||'')||!Number.isInteger(value.limit)||value.limit<1||value.limit>5)return null;
 const groups=(value.groups||[]).filter(g=>Number.isInteger(g)&&g>=1&&g<=6);
 return groups.length?{...value,groups:[...new Set(groups)],open:!!value.open}:null;
}
export function decode(text,fallback=null){try{return JSON.parse(text);}catch{return fallback;}}
export function lastRow(rows,group,key){return [...rows].reverse().find(r=>r.group===group&&r.artifact===key);}
export function groupState(rows,g,config){
 const draft=decode(lastRow(rows,g,'D')?.sentence,{})||{};
 const submission=decode(lastRow(rows,g,'S')?.sentence,null);
 const answers=Array.isArray(submission?.a)?submission.a:[];
 const correct=config.ids.map((id,i)=>answers[i]===id);
 const questions=rows.filter(r=>r.group===g&&/^Q\|\d+$/.test(r.artifact));
 return {draft,submission,correct,questions,joined:!!lastRow(rows,g,'J')||questions.length>0||!!submission,complete:!!submission&&correct.every(Boolean)};
}
export function canSubmit(answers,ids){return answers.length===ids.length&&answers.every(id=>ids.includes(id))&&new Set(answers).size===ids.length;}
