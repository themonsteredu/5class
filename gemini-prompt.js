// 제미나이에게 보내는 요청문을 한 곳에서 만듭니다.
// 화면에 보여 주는 요청문과 서버(api/gemini.js)가 제미나이에게 보내는 글이 똑같도록 둘 다 이 파일을 씁니다.
export const statuses=['사실 확인','고친 문장','판단 보류'];
export const verdicts=['맞아요','고쳐야 해요','자료로는 알 수 없어요'];
export const answers=['맞아요','아니에요','알려 줄게요','알 수 없어요','몰라요'];
export const limits={facts:30,sentence:300,name:40,question:120};
// 아이들이 붙인 표시가 맞다면 제미나이가 내놓아야 할 판정입니다. 고친 문장은 고친 뒤 문장을 확인합니다.
export const expectedVerdict={'사실 확인':'맞아요','고친 문장':'맞아요','판단 보류':'자료로는 알 수 없어요'};

const clip=(value,size)=>String(value??'').replace(/\s+/g,' ').trim().slice(0,size);

// 브라우저가 보낸 값을 그대로 믿지 않고, 길이와 종류를 정리한 뒤에만 요청문을 만듭니다.
// 화면도 같은 정리를 거친 값으로 요청문을 보여 주므로, 보이는 글과 보내는 글이 같습니다.
export function tidyRequest(body){
 const b=body&&typeof body==='object'?body:{};
 const mode=['check','ask'].includes(b.mode)?b.mode:'';
 const facts=(Array.isArray(b.facts)?b.facts:[]).map(f=>{
  const status=statuses.includes(f?.status)?f.status:'사실 확인';
  return {artifact:clip(f?.artifact,limits.name),status,sentence:clip(f?.sentence,limits.sentence),original:status==='고친 문장'?clip(f?.original,limits.sentence):''};
 }).filter(f=>f.sentence).slice(0,limits.facts);
 return {mode,robot:clip(b.robot,limits.name),facts,question:mode==='ask'?clip(b.question,limits.question):''};
}
export function cleanRequest(body){
 const request=tidyRequest(body);
 if(!request.mode)throw Error('요청 종류가 올바르지 않아요.');
 if(!request.robot)throw Error('로봇 이름이 없어요.');
 if(request.mode==='check'&&!request.facts.length)throw Error('로봇이 아직 배운 문장이 없어요.');
 if(request.mode==='ask'&&!request.question)throw Error('물어볼 말을 적어 주세요.');
 return request;
}

const tag=f=>f.artifact?`(${f.artifact}) `:'';
// 요청문은 역할 → 할 일 → 답하는 방법 → 자료 순서로 나눠 씁니다. 화면에는 칸으로, 제미나이에게는 글로 보냅니다.
export function checkSections({robot,facts}){
 return [
  {title:'역할',text:'너는 초등학교 5학년 사회 수업을 돕는 역사 선생님이야.'},
  {title:'할 일',text:`아이들이 "${robot}"에게 아래 문장을 가르쳤어. 문장마다 역사적으로 맞는지 하나씩 확인해 줘. 아이들은 문장마다 사실 확인, 고친 문장, 판단 보류 중 하나로 표시했어.`},
  {title:'답하는 방법',lines:[
   '문장마다 판정을 "맞아요", "고쳐야 해요", "자료로는 알 수 없어요" 중 하나로 골라.',
   '판정한 이유를 초등학생이 알아듣는 쉬운 말로 한두 문장 설명해.',
   '"고쳐야 해요"라면 바르게 고친 문장도 알려 줘.',
   '확실하지 않으면 지어내지 말고 "자료로는 알 수 없어요"라고 해.',
   '마지막에 이 로봇에게 더 가르치면 좋을 내용을 한 문장으로 추천해 줘.'
  ]},
  {title:'확인할 문장',numbered:true,lines:facts.map(f=>`${tag(f)}[${f.status}] ${f.sentence}${f.original?` (고치기 전 문장: ${f.original})`:''}`)}
 ];
}
export function askSections({robot,facts,question}){
 return [
  {title:'역할',text:`너는 초등학교 5학년 아이들이 만든 "${robot}"이야.`},
  {title:'규칙',lines:[
   '아래 [배운 문장]만 사용해서 대답해. 네가 원래 알고 있는 지식은 쓰지 마.',
   '[사실 확인] 문장과 같은 내용이면 "맞아요"라고 해.',
   '[고친 문장]의 고치기 전 문장처럼 말하면 "아니에요"라고 하고 바르게 고친 문장을 알려 줘.',
   '[판단 보류] 문장에 대한 질문에는 "알 수 없어요"라고 해.',
   '무엇인지 묻는 질문에 배운 문장으로 답할 수 있으면 "알려 줄게요"라고 하고 알려 줘.',
   '배운 문장에 없는 내용은 반드시 "몰라요"라고 해.',
   '초등학생이 알아듣기 쉽게 한두 문장으로 짧게 대답해.'
  ]},
  {title:'배운 문장',lines:facts.map(f=>`[${f.status}] ${tag(f)}${f.sentence}${f.original?` / 고치기 전 문장: ${f.original}`:''}`)},
  {title:'질문',text:question||'(아직 없음)'}
 ];
}
export const sectionsFor=request=>request.mode==='check'?checkSections(request):askSections(request);
export function promptText(sections){
 return sections.map(s=>`[${s.title}]\n${s.lines?s.lines.map((line,i)=>`${s.numbered?`${i+1}.`:'-'} ${line}`).join('\n')||'- (아직 없음)':s.text}`).join('\n\n');
}

// 제미나이가 정해진 모양(JSON)으로만 대답하게 하는 틀입니다.
export const checkSchema={type:'object',properties:{results:{type:'array',items:{type:'object',properties:{no:{type:'integer',description:'확인할 문장의 번호'},verdict:{type:'string',enum:verdicts},reason:{type:'string',description:'초등학생이 알아듣는 쉬운 이유 한두 문장'},fix:{type:'string',description:'고쳐야 해요일 때 바르게 고친 문장, 아니면 빈 글'}},required:['no','verdict','reason','fix']}},tip:{type:'string',description:'로봇에게 더 가르치면 좋을 내용 한 문장'}},required:['results','tip']};
export const askSchema={type:'object',properties:{answer:{type:'string',enum:answers},say:{type:'string',description:'로봇이 할 말 한두 문장'}},required:['answer','say']};
export const schemaFor=mode=>mode==='check'?checkSchema:askSchema;

// 제미나이의 대답을 화면에 쓸 수 있게 정리합니다. 이상한 값은 버립니다.
export function readCheck(value,count){
 const results=[];
 for(const r of Array.isArray(value?.results)?value.results:[]){
  const no=Number(r?.no);
  if(!Number.isInteger(no)||no<1||no>count||results.some(x=>x.no===no))continue;
  const verdict=verdicts.includes(r.verdict)?r.verdict:'자료로는 알 수 없어요';
  results.push({no,verdict,reason:clip(r.reason,400),fix:verdict==='고쳐야 해요'?clip(r.fix,300):''});
 }
 return {results:results.sort((a,b)=>a.no-b.no),tip:clip(value?.tip,300)};
}
export function readAsk(value){return {answer:answers.includes(value?.answer)?value.answer:'몰라요',say:clip(value?.say,400)};}
export const readReply=(request,value)=>request.mode==='check'?readCheck(value,request.facts.length):readAsk(value);
