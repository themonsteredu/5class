// 모둠 로봇 공통 규칙: 4·5차시가 같은 로봇 이름, 나라, 담당 유물, 문장의 주인을 쓰도록 한 곳에 둡니다.
// sentences는 3차시 문장판, facts는 로봇이 배운 문장(lesson-four-store.js의 readRoom)입니다.
import {artifacts} from './data.js';
import {defaultTeams} from './robot.js';

export const groups=[1,2,3,4,5,6];
export const robotFace={'고구려':'🔴','백제':'🟡','신라':'🟢','가야':'🔵'};
export const nameOf=id=>artifacts.find(a=>a.id===id)?.name||id;
export const idOfName=name=>artifacts.find(a=>a.name===name)?.id||'';
const nationOf=id=>artifacts.find(a=>a.id===id)?.nation||'';

// 모둠이 3차시에 처음 올린 세 문장에서 가장 많이 나온 유물의 나라가 로봇의 나라입니다.
export function boardNation(sentences,group){
 const ids=sentences.filter(s=>s.group===group).slice(0,3).map(s=>idOfName(s.artifact)).filter(Boolean);if(!ids.length)return '';
 const count={};ids.forEach(id=>count[id]=(count[id]||0)+1);
 return nationOf(ids.reduce((best,id)=>count[id]>count[best]?id:best,ids[0]));
}
export const nationOfRobot=(sentences,g)=>boardNation(sentences,g)||defaultTeams[g]||'고구려';
export const robotName=(sentences,g)=>`${g}모둠 ${nationOfRobot(sentences,g)} 로봇`;
export const groupArtifacts=(sentences,g)=>[...new Set(sentences.filter(s=>s.group===g).map(s=>idOfName(s.artifact)).filter(Boolean))];
// 3차시 문장판에서 가르친 문장은 그 문장을 올린 모둠의 로봇 것입니다.
// 나라별 로봇 시절(10월 7일)에는 같은 나라 모둠의 문장이 한 로봇 칸에 모여 저장되어서, 출처 문장으로 원래 모둠을 찾습니다.
export const robotOf=(sentences,f)=>(f.source&&sentences.find(s=>s.id===f.source)?.group)||f.robot;
export const robotFacts=(sentences,facts,g)=>facts.filter(f=>robotOf(sentences,f)===g);
