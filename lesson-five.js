import {openFifthWorksheet} from './lesson-five-worksheet.js';
import {escapeHtml as e} from './model.js';
import {mountMuseum,exhibitImage} from './museum.js';
import {artifacts} from './data.js';
import {loadSession as load,saveSession,token,rpc,loadRoom,readRoom,readCache,writeCache,forget} from './lesson-four-store.js';
import {askNationRobot,findArtifact} from './robot.js';
import * as room from './robot-room.js';
import {openStep} from './lesson-four.js';
import {personalities,catchphrases,voices,parts,backgrounds,limits,maxImageChars,decodeProfile,decodeDesign,uploadImage,loadImage,saveProfile,saveDesign,teachMore} from './lesson-five-store.js';

// 5차시: 대표 유물의 이미지로 로봇을 준비하고, 가르친 내용을 바탕으로 박물관에서 정체를 추리합니다.
export const fifthSteps=['로봇 준비','더 가르치기','유물 박물관','최종 답안·현황'];
const fifthTimes=[5,10,20,5];
let disposeMuseum=null;
const {groups,nameOf}=room;
const statusMark={'사실 확인':'✓','고친 문장':'✎','판단 보류':'?'};
const kinds={'맞아요':'ok','아니에요':'no','알려 줄게요':'ok','알 수 없어요':'mixed','몰라요':'unknown'};
const josa=(word,[withEnd,without])=>{const code=word.charCodeAt(word.length-1)-0xac00;return word+(code>=0&&code<11172&&code%28?withEnd:without);};

let session=load(),tab=0,sentences=[],facts=[],profileRows=[],designRows=[],roomRows=[],loaded=false,error='',notice='',timer=null,liveRoot=null;
// 4차시와 같은 방식: 기억해 둔 자료를 먼저 보여 주고, 3차시 문장판을 받을 때까지 8초마다 다시 부릅니다.
let boardOk=false,roomOk=false,live=false,fromCache=false,loadError='';
let draft=null,fact=null,editor=null,showRobot=0,chats={},voiceOn=true,listening=false,busy=false,saveRun=0;
const images=new Map();// 그림 방 이름 → {status:'loading'|'done'|'error',url}
const blankFact=()=>({artifact:'',status:'사실 확인',sentence:'',original:'',source:''});

const joined=()=>session.code&&session.group!==null&&session.author;
const teacher=()=>session.group===0;
const nationOfRobot=g=>room.nationOfRobot(sentences,g);
const robotLabel=g=>room.robotName(sentences,g);
const groupArtifacts=g=>room.groupArtifacts(sentences,g);
const robotFacts=g=>room.robotFacts(sentences,facts,g);
const profileOf=g=>decodeProfile(profileRows.find(p=>p.group===g));
const designOf=g=>decodeDesign(designRows.find(d=>d.group===g));
const nameFor=g=>profileOf(g)?.name||robotLabel(g);
// 로봇이 설명할 수 있는 유물: 3차시에 모둠이 올린 유물. 없으면 로봇 나라의 유물.
const choosable=g=>{const own=groupArtifacts(g);return own.length?own:artifacts.filter(a=>a.nation===nationOfRobot(g)).map(a=>a.id);};
const rowsLeft=g=>40-roomRows.filter(r=>r.group===g).length;
// 프로필과 로봇 카드는 새로 쓴 뒤 예전 것을 지우므로, 더 가르치기는 두 줄을 남겨 둡니다.
const teachLeft=g=>rowsLeft(g)-2;
const FULL='우리 모둠 저장 칸이 가득 찼어요. 2번 화면에서 5차시 문장 하나를 ‘지우기’로 지우면 저장할 수 있어요.';
const ownRow=(g,kind)=>roomRows.some(r=>r.group===g&&r.artifact===kind&&r.mine);
const latestId=(list,g)=>list.find(x=>x.group===g)?.id||'';

function imageUrl(id){
 if(!id)return '';
 const known=images.get(id);if(known)return known.status==='done'?known.url:'';
 images.set(id,{status:'loading',url:''});
 loadImage(session.author,id).then(url=>{images.set(id,url?{status:'done',url}:{status:'error',url:''});paint();const r=liveRoot;if(r?.isConnected&&!teacher()&&(tab===0||tab===2&&!editor?.img))refreshPreview(r);}).catch(()=>{images.delete(id);paint();});
 return '';
}

// 준비 화면은 대표 유물 이미지, 박물관의 비공개 전시는 공통 로봇 이미지를 사용합니다.
// 이전에 저장한 사진과 꾸미기는 이 화면의 이미지에 영향을 주지 않습니다.
function robotCard(g,{pick=false}={}){
 const p=profileOf(g),id=[p?.favorite,...groupArtifacts(g)].find(id=>artifacts.some(a=>a.id===id));
 const url=id?exhibitImage(id):'assets/museum/guide.webp';
 return `<article class="c5-card ${pick?'is-picked':''}" style="--card:${backgrounds[5]}">${pick===null?'':`<button type="button" class="c5-card-hit" data-c5="pick" data-group="${g}" aria-label="${e(nameFor(g))} 고르기"></button>`}<div class="c5-photo c5-artifact-photo"><img src="${e(url)}" alt="${e(id?nameOf(id):'대표 유물을 골라 주세요')}" decoding="async"></div><div class="c5-card-body"><h3>${e(nameFor(g))}</h3><p class="c5-tag">${room.robotFace[nationOfRobot(g)]} ${e(robotLabel(g))}${p?.personality?` · ${e(p.personality)}`:''}</p>${p?.intro?`<p class="c5-bubble">${e(p.intro)}${p.catchphrase?` <b>${e(p.catchphrase)}</b>`:''}</p>`:''}<p class="c5-meta">배운 문장 ${robotFacts(g).length}개${id?` · 대표 유물 ${e(nameOf(id))}`:''}</p></div></article>`;
}
const cardsView=(pickable=false)=>`<div class="c5-cards">${groups.map(g=>robotCard(g,{pick:pickable?g===showRobot:null})).join('')}</div>`;

function joinView(){
 return `<section class="c3-card c3-join"><p class="c3-kicker">5차시 · 이름을 잃어버린 박물관</p><h1>수업코드를 넣고 입장해요</h1><p class="c3-lead">3·4차시와 같은 수업코드를 넣어요.</p><form data-c5-form="join"><label class="field"><span>수업코드</span><input name="code" inputmode="numeric" autocomplete="off" maxlength="12" value="${e(session.code)}" placeholder="3차시와 같은 숫자" required></label><fieldset class="c3-choices c3-group-pick"><legend>우리 모둠</legend>${groups.map(g=>`<label><input type="radio" name="group" value="${g}" ${session.group===g?'checked':''}><span>${g}모둠</span></label>`).join('')}</fieldset><button class="primary c3-wide" type="submit">입장하기</button><button class="quiet c3-wide" type="submit" name="teacher" value="1">선생님 화면</button></form>${error?`<p class="c3-message" role="alert">${e(error)}</p>`:''}</section>`;
}

// 같은 모둠의 다른 태블릿이 새로 저장했는데 이 태블릿에서 이미 고치고 있으면, 덮어쓰기 전에 알려 줍니다.
function formNote(){
 if(teacher()||!session.group)return '';
 const g=session.group;
 if(tab===0&&draft&&draft.base!==latestId(profileRows,g))return '<p class="c3-guide c5-note">같은 모둠의 다른 태블릿이 프로필을 새로 저장했어요. <button class="quiet small" type="button" data-c5="reload-form">새로 저장된 것 불러오기</button></p>';
 if(tab===2&&editor&&!editor.saving&&editor.base!==latestId(designRows,g))return '<p class="c3-guide c5-note">같은 모둠의 다른 태블릿이 로봇 카드를 새로 저장했어요. <button class="quiet small" type="button" data-c5="reload-form">새로 저장된 것 불러오기</button></p>';
 return '';
}
// 1. 로봇 프로필
function ensureDraft(){
 if(draft||teacher())return;
 const p=profileOf(session.group);
 draft={name:p?.name||'',personality:p?.personality||'',catchphrase:p?.catchphrase||'',intro:p?.intro||'',favorite:p?.favorite||'',custom:!!p?.personality&&!personalities.includes(p.personality),base:latestId(profileRows,session.group)};
}
function profileView(){
 if(teacher())return `<section class="c3-board"><div class="c3-board-head"><h2>모둠 로봇 프로필</h2><span>가르치기를 마치면 유물 박물관을 열어요.</span></div><div data-live="cards">${cardsView()}</div></section>`;
 if(!loaded)return '';
 ensureDraft();
 const g=session.group,custom=draft.custom;
 return `<div data-live="formnote">${formNote()}</div><section class="c3-card c5-split"><form data-c5-form="profile"><p class="c3-guide">우리 로봇은 <b>${e(robotLabel(g))}</b>이에요. 이름과 성격, 말버릇을 정해 주세요. 대표 유물을 고르면 유물 이미지가 자동으로 나타나요. 박물관에서는 모두 같은 로봇 모습으로 정체를 숨겨요.</p>
 <label class="field"><span>1. 로봇 이름 <small>${limits.name}자까지</small></span><input name="name" maxlength="${limits.name}" value="${e(draft.name)}" placeholder="예: 금관이"></label>
 <fieldset class="c3-choices c5-chips"><legend>2. 성격</legend>${personalities.map(p=>`<label><input type="radio" name="personality" value="${p}" ${draft.personality===p?'checked':''}><span>${p}</span></label>`).join('')}<label><input type="radio" name="personality" value="__custom" ${custom?'checked':''}><span>직접 쓰기</span></label></fieldset>${custom?`<label class="field"><span>우리가 정한 성격</span><input name="personality-custom" maxlength="${limits.personality}" value="${e(draft.personality)}"></label>`:''}
 <label class="field"><span>3. 말버릇 <small>대답 끝에 붙어요</small></span><input name="catchphrase" maxlength="${limits.catchphrase}" value="${e(draft.catchphrase)}" placeholder="예: 삐빅!"></label><div class="c4-examples">${catchphrases.map(c=>`<button type="button" class="quiet small" data-c5="catch" data-value="${e(c)}">${e(c)}</button>`).join('')}</div>
 <label class="field"><span>4. 자기소개 <small>${limits.intro}자까지</small></span><input name="intro" maxlength="${limits.intro}" value="${e(draft.intro)}" placeholder="예: 안녕! 나는 신라 금관을 알려 주는 금관이야."></label>
 <label class="field"><span>5. 대표 유물</span><select name="favorite"><option value="">골라 주세요</option>${choosable(g).map(id=>`<option value="${id}" ${draft.favorite===id?'selected':''}>${e(nameOf(id))}</option>`).join('')}</select></label>
 <button class="primary c3-wide" type="submit">프로필 저장하기</button>${notice?`<p class="c3-guide c3-done" role="status">${e(notice)}</p>`:''}</form><div class="c5-preview"><p class="c5-preview-label">미리 보기</p>${previewCard(g)}</div></section>`;
}
// 저장하지 않은 프로필도 미리 보기에 바로 보여 줍니다.
function previewCard(g){
 const saved=profileRows.find(p=>p.group===g);
 const fake=draft?{group:g,name:draft.name||robotLabel(g),raw:JSON.stringify({p:draft.personality,t:draft.catchphrase,i:draft.intro,f:draft.favorite})}:saved;
 const keep=profileRows;profileRows=[...profileRows.filter(p=>p.group!==g),...(fake?[fake]:[])];
 const html=robotCard(g,{pick:null});profileRows=keep;return html;
}

// 2. 더 가르치기
function factItem(f){
 return `<li><span class="c3-status" data-status="${e(f.status)}">${statusMark[f.status]||''} ${e(f.status)}</span> ${f.artifact?`<span class="c3-tag">${e(nameOf(f.artifact))}</span> `:''}${f.status==='고친 문장'&&f.original?`<s>${e(f.original)}</s> → `:''}${e(f.sentence)}${f.added?` <b class="c5-new">5차시</b>`:''}${f.added&&f.source?` <small>출처: ${e(f.source)}</small>`:''}${f.added&&f.mine?` <button class="quiet small" type="button" data-c5="forget" data-id="${e(f.id)}">지우기</button>`:''}</li>`;
}
function teachView(){
 if(teacher())return `<section class="c3-board"><div class="c3-board-head"><h2>5차시에 더 가르친 문장</h2><button class="quiet small" type="button" data-c5="gemini">✨ 제미나이로 확인하기 (4차시 화면)</button></div><div data-live="added" class="c5-added">${addedView()}</div></section>`;
 if(!loaded)return '';
 fact??=blankFact();
 const g=session.group,list=robotFacts(g),fixed=fact.status==='고친 문장',left=teachLeft(g);
 return `<section class="c3-card"><p class="c3-guide">교과서와 자료에서 <b>우리 유물에 대한 새 문장</b>을 찾아 가르쳐요. <b>어디에서 찾았는지(출처)</b>를 꼭 적어요. 선생님이 나중에 제미나이로 확인해요.</p>
 <form data-c5-form="teach" class="c4-own"><label class="field"><span>유물</span><select name="artifact"><option value="">유물을 골라 주세요</option>${choosable(g).map(id=>`<option value="${id}" ${fact.artifact===id?'selected':''}>${e(nameOf(id))}</option>`).join('')}</select></label>
 <fieldset class="c3-choices c3-status-pick"><legend>어떤 문장인가요?</legend>${['사실 확인','고친 문장','판단 보류'].map(s=>`<label><input type="radio" name="status" value="${s}" ${fact.status===s?'checked':''}><span><b>${s}</b></span></label>`).join('')}</fieldset>
 ${fixed?`<label class="field c3-original"><span>틀렸던 원래 문장</span><input name="original" maxlength="300" value="${e(fact.original)}"></label>`:''}
 <label class="field"><span>${fixed?'바르게 고친 문장':'가르칠 문장'}</span><input name="sentence" maxlength="300" value="${e(fact.sentence)}" placeholder="예: 금관에는 나뭇가지 모양 장식이 있다."></label>
 <label class="field"><span>출처 <small>어디에서 찾았나요?</small></span><input name="source" maxlength="${limits.source}" value="${e(fact.source)}" placeholder="예: 교과서 28쪽, 국립경주박물관"></label>
 <button class="primary c3-wide" type="submit" ${left<=0?'disabled':''}>로봇에게 가르치기</button>${left<=5?`<p class="c3-message">${left<=0?'우리 모둠 저장 칸이 거의 찼어요. 프로필과 로봇 카드를 저장할 자리를 남겨 두었어요. 더 가르치려면 5차시 문장 하나를 지워 주세요.':`앞으로 ${left}줄 더 저장할 수 있어요.`}</p>`:''}${notice?`<p class="c3-guide c3-done" role="status">${e(notice)}</p>`:''}</form>
 <h3 class="c4-sub">${e(josa(nameFor(g),['이','가']))} 배운 문장 <small>${list.length}개</small></h3><ul class="c4-board-list" data-live="mine">${list.map(factItem).join('')||'<li class="c3-empty">아직 배운 문장이 없어요.</li>'}</ul></section>`;
}
const addedView=()=>groups.map(g=>{const list=robotFacts(g).filter(f=>f.added);return `<section class="c3-group"><h3>${e(nameFor(g))} <small>새 문장 ${list.length}개 · 모두 ${robotFacts(g).length}개</small></h3>${list.length?`<ul class="c4-board-list">${list.map(factItem).join('')}</ul>`:'<p class="c3-empty">아직 없어요.</p>'}</section>`;}).join('');

// 3. 로봇 디자인
const PREVIEW=320,OUT=384;
function ensureEditor(){
 if(editor||teacher())return;
 const d=designOf(session.group);
 editor={img:null,rotation:0,zoom:1,x:0,y:0,background:d?.background||backgrounds[0],stickers:[...(d?.stickers||[]),{part:parts[0],artifact:'',evidence:''},{part:parts[1],artifact:'',evidence:''},{part:parts[2],artifact:'',evidence:''}].slice(0,limits.stickers),dirty:false,saving:false,progress:'',base:latestId(designRows,session.group),image:''};
}
function designView(){
 if(teacher())return `<section class="c3-board"><div class="c3-board-head"><h2>모둠 로봇 카드</h2><span>가르치기를 마치면 유물 박물관을 열어요.</span></div><div data-live="cards">${cardsView()}</div></section>`;
 if(!loaded)return '';
 ensureEditor();
 const g=session.group,d=designOf(g),ids=choosable(g);
 return `<div data-live="formnote">${formNote()}</div><section class="c3-card c5-split"><div><ol class="c4-steps-list c5-how"><li>설계도의 <b>네모 안 그림</b>을 사진으로 찍어요. (얼굴이나 이름은 찍지 않아요)</li><li>그림을 움직이고 키워서 네모에 꼭 맞춰요.</li><li>배경색을 고르고, 어느 부분을 어떤 유물에서 따왔는지 <b>근거 스티커</b>를 붙여요.</li><li><b>로봇 카드 저장하기</b>를 눌러요.</li></ol>
 <div class="c5-file"><label class="button primary">📷 사진 찍기<input type="file" accept="image/*" capture="environment" data-c5-file hidden ${editor.saving?'disabled':''}></label><label class="button quiet">🖼 사진 고르기<input type="file" accept="image/*" data-c5-file hidden ${editor.saving?'disabled':''}></label></div>
 ${editor.img?`<div class="c5-tools"><label>크기 <input type="range" min="1" max="3" step="0.05" value="${editor.zoom}" data-c5-zoom></label><button type="button" class="quiet small" data-c5="rotate">↻ 돌리기</button><button type="button" class="quiet small" data-c5="center">가운데로</button></div><p class="c5-hint">그림 위를 손가락으로 끌면 움직여요.</p>`:d?.image?'<p class="c5-hint">저장한 그림이 있어요. 새 사진을 올리면 바뀌어요.</p>':''}
 <fieldset class="c5-swatches"><legend>배경색</legend>${backgrounds.map((c,i)=>`<label><input type="radio" name="background" value="${c}" ${editor.background===c?'checked':''} data-c5-bg><span style="background:${c}" aria-label="배경색 ${i+1}"></span></label>`).join('')}</fieldset>
 <h3 class="c4-sub">근거 스티커 <small>이 모양은 어떤 유물에서 왔나요?</small></h3>${editor.stickers.map((s,i)=>`<div class="c5-sticker-row"><select data-c5-sticker="${i}" data-key="part" aria-label="부분 ${i+1}">${parts.map(p=>`<option ${s.part===p?'selected':''}>${p}</option>`).join('')}</select><select data-c5-sticker="${i}" data-key="artifact" aria-label="유물 ${i+1}"><option value="">유물</option>${ids.map(id=>`<option value="${id}" ${s.artifact===id?'selected':''}>${e(nameOf(id))}</option>`).join('')}</select><input data-c5-sticker="${i}" data-key="evidence" maxlength="${limits.evidence}" value="${e(s.evidence)}" placeholder="근거 예: 나뭇가지 모양 장식 · 교과서 28쪽" aria-label="근거 ${i+1}"></div>`).join('')}
 <button class="primary c3-wide" type="button" data-c5="save-design" ${editor.saving?'disabled':''}>${editor.saving?e(editor.progress||'저장하는 중…'):'로봇 카드 저장하기'}</button>${notice?`<p class="c3-guide c3-done" role="status">${e(notice)}</p>`:''}</div>
 <div class="c5-preview"><p class="c5-preview-label">로봇 카드 미리 보기</p>${designPreview(g)}</div></section>`;
}
// 편집 중인 배경색·스티커와 새 그림(캔버스)을 미리 보기 카드에 보여 줍니다.
function designPreview(g){
 const keep=designRows,saved=designRows.find(d=>d.group===g);
 const raw=JSON.stringify({b:backgrounds.indexOf(editor.background),s:editor.stickers.filter(s=>s.artifact||s.evidence).map(s=>[parts.indexOf(s.part),s.artifact,s.evidence])});
 designRows=[...designRows.filter(d=>d.group!==g),{group:g,image:saved?.image||'',raw}];
 const html=robotCard(g,{pick:null,photo:editor.img?'canvas':''});designRows=keep;return html;
}
async function readPicture(file){
 if(!file)return;
 if(!/^image\//.test(file.type||'image/'))throw Error('사진 파일을 골라 주세요.');
 if(file.size>30*1024*1024)throw Error('사진이 너무 커요. 다른 사진을 골라 주세요.');
 let img;
 try{img=await createImageBitmap(file,{imageOrientation:'from-image'});}
 catch{img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('사진을 열지 못했어요. 다른 사진으로 해 보세요.'));i.src=URL.createObjectURL(file);});}
 Object.assign(editor,{img,rotation:0,zoom:1,x:0,y:0,dirty:true});
}
function drawPicture(ctx,size){
 const {img,rotation,zoom,x,y}=editor,w=img.width,h=img.height,turned=rotation%180!==0;
 const scale=Math.max(size/(turned?h:w),size/(turned?w:h))*zoom,k=size/PREVIEW;
 ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);
 ctx.save();ctx.translate(size/2+x*k,size/2+y*k);ctx.rotate(rotation*Math.PI/180);ctx.drawImage(img,-w*scale/2,-h*scale/2,w*scale,h*scale);ctx.restore();
}
function drawCanvas(){const c=liveRoot?.querySelector('[data-c5-canvas]');if(c&&editor?.img)drawPicture(c.getContext('2d'),PREVIEW);}
// 저장할 그림: 384×384, 웹 그림(WebP)이 안 되면 JPEG. 저장 칸(약 16만 자)을 넘지 않게 화질을 낮춥니다.
export function exportPicture(){
 for(const [size,type,quality] of [[OUT,'image/webp',0.75],[OUT,'image/jpeg',0.75],[OUT,'image/webp',0.5],[OUT,'image/jpeg',0.5],[256,'image/jpeg',0.5]]){
  const c=document.createElement('canvas');c.width=c.height=size;drawPicture(c.getContext('2d'),size);
  const url=c.toDataURL(type,quality);
  if(url.startsWith(`data:${type};base64,`)&&url.length-url.indexOf(',')-1<maxImageChars-700)return url;
 }
 throw Error('그림이 너무 복잡해서 저장하지 못했어요. 그림을 조금 더 확대해 보세요.');
}

// 4. 로봇 발표회
function askRobot(question,g){
 const nation=nationOfRobot(g),r=askNationRobot(question,nation,robotFacts(g).map(f=>({...f,nation})),nameOf);
 const hit=findArtifact(String(question||''));
 if(r.answer==='몰라요'&&hit){const owners=groups.filter(x=>x!==g&&(groupArtifacts(x).includes(hit.id)||robotFacts(x).some(f=>f.artifact===hit.id)));if(owners.length)r.say=`저는 ${josa(nameOf(hit.id),['을','를'])} 배우지 않았어요. ${owners.map(o=>nameFor(o)).join(', ')}에게 물어봐 주세요!`;}
 return r;
}
function showView(){
 const g=showRobot||(teacher()?1:session.group),p=profileOf(g),list=chats[g]||[],speech=!!(window.SpeechRecognition||window.webkitSpeechRecognition);
 showRobot=g;
 return `<section class="c3-board"><div class="c3-board-head"><h2>로봇 발표회 <small>카드를 눌러 질문할 로봇을 골라요</small></h2></div><div data-live="cards">${cardsView(true)}</div></section>
 <section class="c3-card c4-robot"><div class="c4-robot-head"><span class="c4-face" aria-hidden="true">🤖<i>${room.robotFace[nationOfRobot(g)]}</i></span><div><h2>${e(nameFor(g))}에게 물어봐요</h2><p>${p?.intro?e(p.intro):e(robotLabel(g))}</p></div><button class="quiet small" type="button" data-c5="voice" aria-pressed="${voiceOn}">${voiceOn?'🔊 목소리 켜짐':'🔇 목소리 꺼짐'}</button></div>
 <form data-c5-form="ask"><label class="field"><span>로봇에게 물어볼 말</span><input name="question" maxlength="120" autocomplete="off" placeholder="예: 금관은 무엇으로 만들었어?"></label><div class="c4-ask-row">${speech?`<button class="quiet c4-mic ${listening?'is-on':''}" type="button" data-c5="listen">${listening?'듣는 중… 말해 주세요':'🎤 말로 묻기'}</button>`:''}<button class="primary" type="submit">⌨️ 글로 묻기</button></div></form>
 <ol class="c4-chat">${list.map(({q,r,name,tail})=>`<li><p class="c4-q">${e(q)}</p><p class="c4-a" data-kind="${kinds[r.answer]||'unknown'}"><span class="c5-speaker">${e(name)}</span> <b>${e(r.answer)}</b> ${e(r.say.startsWith(r.answer)?r.say.slice(r.answer.length).replace(/^[!.]?\s*/,''):r.say)}${tail?` <b>${e(tail)}</b>`:''}</p></li>`).join('')}</ol>
 <p class="c3-guide">발표하는 모둠은 로봇 카드의 <b>근거 스티커</b>를 하나씩 소개해요. 듣는 모둠은 그 로봇에게 질문을 하나씩 해요.</p></section>`;
}
function speak(text,g){
 if(!voiceOn||!('speechSynthesis' in window)||!text)return;
 speechSynthesis.cancel();
 const say=new SpeechSynthesisUtterance(text),v=voices[profileOf(g)?.personality]||{pitch:1.3,rate:1};
 say.lang='ko-KR';say.pitch=v.pitch;say.rate=v.rate;
 const voice=speechSynthesis.getVoices().find(x=>x.lang?.startsWith('ko'));if(voice)say.voice=voice;
 speechSynthesis.speak(say);
}
function ask(root,question){
 const g=showRobot,q=String(question||'').trim().slice(0,120);if(!q||!g)return;
 const r=askRobot(q,g),p=profileOf(g),tail=p?.catchphrase||'';
 chats[g]=[{q,r,name:nameFor(g),tail},...(chats[g]||[])].slice(0,6);render(root);
 speak(`${r.answer==='알려 줄게요'||r.say.startsWith(r.answer)?r.say:`${r.answer}. ${r.say}`} ${tail}`,g);
 root.querySelector('input[name=question]')?.focus();
}
function listen(root){
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition||listening)return;
 const rec=new Recognition();rec.lang='ko-KR';rec.interimResults=false;rec.maxAlternatives=1;
 rec.onresult=event=>{listening=false;ask(root,event.results[0][0].transcript);};
 rec.onerror=event=>{error=event.error==='not-allowed'?'마이크 사용을 허락해 주세요. 주소창 옆 자물쇠에서 마이크를 허용할 수 있어요.':'잘 듣지 못했어요. 다시 말해 주세요.';};
 rec.onend=()=>{if(listening){listening=false;render(root);}};
 listening=true;error='';render(root);
 try{rec.start();}catch{listening=false;render(root);}
}

function openSheets(){openFifthWorksheet({facts,code:session.code});}

function statusView(){
 // 저장 오류(error)는 다음에 무언가 누를 때까지 남기고, 불러오기 오류(loadError)는 새로 불러올 때마다 바뀝니다.
 const message=error||loadError;
 return `${message?`<p class="c3-message" role="alert">${e(message)}</p>`:''}${!loaded?'<p class="c3-guide">반 자료를 불러오는 중이에요…</p>':fromCache&&!live&&!message?'<p class="c3-guide">마지막으로 불러온 자료를 먼저 보여 주고 있어요. 새 자료를 불러오는 중이에요…</p>':''}`;
}
function showCached(){
 const c=readCache(session.code);if(!c||!joined())return;
 const v=readRoom(c.rows);sentences=c.board;roomRows=c.rows;facts=v.facts;profileRows=v.profiles;designRows=v.designs;loaded=true;fromCache=true;
}
function render(root){
 if(!joined()){disposeMuseum?.();disposeMuseum=null;root.innerHTML=`<div class="c3-page">${joinView()}</div>`;return;}
 disposeMuseum?.();disposeMuseum=null;
 const body=tab<2?[profileView,teachView][tab](): '<div data-museum-mount></div>';
 root.innerHTML=`<div class="c3-page c4-page c5-page ${teacher()?'c4-tv':''}"><div class="c3-bar"><p>수업코드 <b>${e(session.code)}</b> · <b>${teacher()?'선생님 화면':e(tab>=2?`${session.group}조`:nameFor(session.group))}</b></p><div>${teacher()?`<button class="quiet small" type="button" data-c5="sheets" ${!loaded?'disabled':''}>활동지 · OX 인쇄</button>`:''}<button class="quiet small" type="button" data-c5="refresh">다시 불러오기</button><button class="quiet small" type="button" data-c5="leave">나가기</button></div></div><nav class="c4-tabs" aria-label="5차시 활동 순서">${fifthSteps.map((label,i)=>`<button type="button" data-c5="tab" data-tab="${i}" ${i===tab?'aria-current="step"':''}><span>${i+1}</span>${label}<small>${fifthTimes[i]}분</small></button>`).join('')}</nav><div data-live="status">${statusView()}</div>${body}</div>`;
 if(tab>=2)disposeMuseum=mountMuseum(root.querySelector('[data-museum-mount]'),()=>({session,facts}),{answersOnly:tab===3});
 drawCanvas();
}
// 바뀐 곳만 다시 그립니다. 쓰고 있는 글이나 고른 글은 건드리지 않습니다.
function put(el,html){
 if(!el||el.dataset.v===html)return;
 const sel=window.getSelection?.();if(sel&&!sel.isCollapsed&&el.contains(sel.anchorNode))return;
 el.innerHTML=html;el.dataset.v=html;
}
function paint(){
 const root=liveRoot;if(!root?.isConnected)return;
 put(root.querySelector('[data-live=cards]'),cardsView(tab===3));
 put(root.querySelector('[data-live=added]'),addedView());
 put(root.querySelector('[data-live=formnote]'),formNote());
 if(!teacher())put(root.querySelector('[data-live=mine]'),robotFacts(session.group).map(factItem).join('')||'<li class="c3-empty">아직 배운 문장이 없어요.</li>');
}
async function refresh(root,full=false){
 if(!joined())return;
 const code=session.code,author=session.author;
 const [list,data]=await Promise.allSettled([full||!boardOk?rpc('class5_list',{p_code:code,p_author:author}):Promise.resolve(null),loadRoom(code,author)]);
 if(code!==session.code||author!==session.author)return;
 const problems=[];let boardChanged=false;
 if(list.status==='fulfilled'&&list.value){const next=Array.isArray(list.value.sentences)?list.value.sentences:[];boardChanged=!boardOk||JSON.stringify(next)!==JSON.stringify(sentences);sentences=next;boardOk=true;}
 else if(list.status==='rejected')problems.push('3차시 유물 문장');
 if(data.status==='fulfilled'){({facts,profiles:profileRows,designs:designRows,rows:roomRows}=data.value);roomOk=true;}
 else problems.push('로봇 자료');
 if(boardOk||roomOk)writeCache(code,sentences,roomRows);
 const firstLive=!live&&boardOk&&roomOk;if(firstLive)live=true;
 const wasLoaded=loaded;loaded=true;
 loadError=problems.length?`인터넷이 느려서 ${problems[0]}을 아직 못 불러왔어요. 8초마다 자동으로 다시 불러와요.${fromCache||boardOk?' 그동안 마지막으로 불러온 자료를 보여 줘요.':''}`:'';
 // 기억해 둔 자료로 만든 입력 칸은, 아직 손대지 않았다면 새 자료로 다시 채웁니다.
 if(firstLive&&draft&&!draft.touched)draft=null;
 if(firstLive&&editor&&!editor.img&&!editor.touched)editor=null;
 // 다른 태블릿이 새로 저장했고 이 태블릿은 아직 손대지 않았으면 새 내용으로 다시 채웁니다.
 let reform=false;
 if(!teacher()&&session.group){
  const g=session.group;
  if(draft&&!draft.touched&&draft.base!==latestId(profileRows,g)){draft=null;reform=reform||tab===0;}
  if(editor&&!editor.saving&&!editor.img&&!editor.touched&&editor.base!==latestId(designRows,g)){editor=null;reform=reform||tab===2;}
 }
 if(!root.isConnected)return;
 // 쓰고 있는 프로필·문장·그림을 지우지 않도록, 처음 불러올 때와 문장판이 바뀌었을 때만 화면 전체를 다시 그립니다.
 if(tab<2&&(!wasLoaded||boardChanged&&!editor?.img||firstLive&&fromCache&&!editor?.img))return render(root);
 if(reform)return keepPlace(root,()=>render(root));
 put(root.querySelector('[data-live=status]'),statusView());
 paint();
}

export function mountLessonFive(root){
 const fresh=load();if(fresh.code!==session.code||fresh.group!==session.group){session=fresh;loaded=false;draft=null;fact=null;editor=null;sentences=[];facts=[];profileRows=[];designRows=[];roomRows=[];chats={};showRobot=0;boardOk=roomOk=live=fromCache=false;}
 if(!loaded)showCached();
 liveRoot=root;error='';notice='';render(root);
 clearInterval(timer);
 timer=setInterval(()=>{if(!root.isConnected)return clearInterval(timer);if(document.visibilityState==='visible')refresh(root);},8000);
 refresh(root,true);
 let drag=null;
 root.addEventListener('pointerdown',event=>{const c=event.target.closest('[data-c5-canvas]');if(!c||!editor?.img)return;const rect=c.getBoundingClientRect();drag={id:event.pointerId,x:event.clientX,y:event.clientY,k:PREVIEW/rect.width};c.setPointerCapture(event.pointerId);event.preventDefault();});
 root.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.id)return;editor.x+=(event.clientX-drag.x)*drag.k;editor.y+=(event.clientY-drag.y)*drag.k;drag.x=event.clientX;drag.y=event.clientY;editor.dirty=true;drawCanvas();});
 const stop=()=>{drag=null;};root.addEventListener('pointerup',stop);root.addEventListener('pointercancel',stop);
 root.addEventListener('input',event=>{
  const el=event.target,form=el.form?.dataset.c5Form;
  if(form==='profile'&&draft)draft.touched=true;
  if(form==='profile'&&draft){if(el.name==='personality-custom')draft.personality=el.value;else if(['name','catchphrase','intro'].includes(el.name))draft[el.name]=el.value;notice='';refreshPreview(root);}
  if(form==='teach'&&fact&&['sentence','original','source'].includes(el.name))fact[el.name]=el.value;
  if(el.dataset.c5Zoom!==undefined){editor.zoom=+el.value;editor.dirty=true;drawCanvas();}
  if(el.dataset.c5Sticker!==undefined&&el.tagName==='INPUT'){editor.touched=true;editor.stickers[+el.dataset.c5Sticker][el.dataset.key]=el.value;refreshPreview(root);}
 });
 root.addEventListener('change',async event=>{
  const el=event.target,form=el.form?.dataset.c5Form;
  if(form==='profile'&&draft&&el.name==='favorite'){draft.touched=true;draft.favorite=el.value;notice='';refreshPreview(root);}
  if(form==='profile'&&draft&&el.name==='personality'){draft.touched=true;draft.custom=el.value==='__custom';draft.personality=draft.custom?'':el.value;notice='';keepPlace(root,()=>render(root));if(draft.custom)root.querySelector('input[name=personality-custom]')?.focus();}
  if(form==='teach'&&fact&&['artifact','status'].includes(el.name)){fact[el.name]=el.value;notice='';keepPlace(root,()=>render(root));}
  if(el.dataset.c5Bg!==undefined){editor.touched=true;editor.background=el.value;keepPlace(root,()=>render(root));}
  if(el.dataset.c5Sticker!==undefined&&el.tagName==='SELECT'){editor.touched=true;editor.stickers[+el.dataset.c5Sticker][el.dataset.key]=el.value;refreshPreview(root);}
  if(el.dataset.c5File!==undefined){const file=el.files?.[0];el.value='';try{await readPicture(file);error='';notice='';}catch(err){error=err.message;}keepPlace(root,()=>render(root));}
 });
 root.addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.target,data=Object.fromEntries(new FormData(form)),kind=form.dataset.c5Form;
  if(kind==='join'){
   const code=String(data.code||'').trim().toLowerCase(),asTeacher=event.submitter?.name==='teacher';
   if(!/^[0-9a-z]{4,12}$/.test(code)){error='수업코드는 숫자 4~12자리로 입력해 주세요.';return render(root);}
   if(!asTeacher&&!data.group){error='우리 모둠을 골라 주세요.';session.code=code;return render(root);}
   session={code,group:asTeacher?0:Number(data.group),author:session.author||token()};saveSession(session);
   loaded=false;draft=null;fact=null;editor=null;chats={};showRobot=0;error='';sentences=[];facts=[];profileRows=[];designRows=[];roomRows=[];boardOk=roomOk=live=fromCache=false;showCached();render(root);refresh(root,true);return;
  }
  if(kind==='profile'){
   if(!draft.name.trim()){error='로봇 이름을 지어 주세요.';return render(root);}
   if(rowsLeft(session.group)<1&&!ownRow(session.group,'P')){error=FULL;return render(root);}
   if(busy)return;busy=true;form.querySelector('button[type=submit]')?.setAttribute('disabled','');
   try{await saveProfile(session.code,session.author,session.group,draft,roomRows);error='';notice=`${josa(draft.name.trim(),['이','가'])} 프로필을 저장했어요!`;await refresh(root);draft=null;}
   catch(err){error=err.message;}
   finally{busy=false;}
   render(root);
  }
  if(kind==='teach'){
   Object.assign(fact,{sentence:String(data.sentence||''),original:String(data.original??fact.original),source:String(data.source||'')});
   if(!fact.artifact){error='어떤 유물에 대한 문장인지 골라 주세요.';return render(root);}
   if(!fact.sentence.trim()){error='가르칠 문장을 적어 주세요.';return render(root);}
   if(fact.status==='고친 문장'&&!fact.original.trim()){error='틀렸던 원래 문장도 적어 주세요.';return render(root);}
   if(!fact.source.trim()){error='어디에서 찾았는지 출처를 적어 주세요.';return render(root);}
   if(teachLeft(session.group)<1){error='우리 모둠 저장 칸이 거의 찼어요. 더 가르치려면 5차시 문장 하나를 지워 주세요.';return render(root);}
   if(busy)return;busy=true;form.querySelector('button[type=submit]')?.setAttribute('disabled','');
   try{await teachMore(session.code,session.author,session.group,{nation:nationOfRobot(session.group),artifact:fact.artifact,sentence:fact.sentence.trim(),original:fact.original.trim(),status:fact.status,source:fact.source.trim()});
    fact={...blankFact(),artifact:fact.artifact,source:fact.source};error='';notice=`${josa(nameFor(session.group),['이','가'])} 새 문장을 배웠어요!`;await refresh(root);}
   catch(err){error=err.message;}
   finally{busy=false;}
   render(root);
  }
  if(kind==='ask')ask(root,data.question);
 });
 root.addEventListener('click',async event=>{
  const el=event.target.closest('[data-c5]');if(!el)return;
  const action=el.dataset.c5;
  if(action==='tab'){tab=+el.dataset.tab;notice='';error='';render(root);window.scrollTo(0,0);}
  if(action==='leave'&&editor?.saving&&!confirm('로봇 카드를 저장하는 중이에요. 저장은 계속돼요. 나갈까요?'))return;
  if(action==='leave'){session={code:session.code,group:null,author:session.author};saveSession(session);draft=null;fact=null;editor=null;chats={};showRobot=0;render(root);}
  if(action==='refresh'){await refresh(root,true);render(root);}
  if(action==='catch'&&draft){draft.touched=true;draft.catchphrase=el.dataset.value;keepPlace(root,()=>render(root));}
  if(action==='forget'&&confirm('로봇이 이 문장을 잊게 할까요?')){
   try{const id=el.dataset.id;await forget(session.code,session.author,id);facts=facts.filter(f=>f.id!==id);roomRows=roomRows.filter(r=>r.id!==id);keepPlace(root,()=>render(root));}
   catch(err){error=err.message;render(root);}
  }
  if(action==='reload-form'){if(tab===0)draft=null;if(tab===2&&editor&&!editor.saving){if(editor.img&&!confirm('올려 둔 새 사진은 지워져요. 불러올까요?'))return;editor=null;}keepPlace(root,()=>render(root));}
  if(action==='gemini'){openStep(3);location.hash='#lesson/4';}
  if(action==='sheets')openSheets();
  if(action==='rotate'&&editor?.img){editor.rotation=(editor.rotation+90)%360;editor.dirty=true;drawCanvas();}
  if(action==='center'&&editor?.img){Object.assign(editor,{x:0,y:0,zoom:1,dirty:true});keepPlace(root,()=>render(root));}
  if(action==='save-design'&&editor&&!editor.saving){
   // 저장하는 동안 나가거나 다른 것을 눌러도 이 저장은 처음 상태(ed)로 끝까지 갑니다.
   const ed=editor,g=session.group,code=session.code,author=session.author,run=++saveRun;
   if(rowsLeft(g)<1&&!ownRow(g,'D')){error=FULL;return keepPlace(root,()=>render(root));}
   const sent=ed.img&&ed.dirty?{img:ed.img,rotation:ed.rotation,zoom:ed.zoom,x:ed.x,y:ed.y}:null;
   ed.saving=true;ed.progress='';notice='';error='';keepPlace(root,()=>render(root));
   let problem='',message='로봇 카드를 저장했어요! 4번 발표회 화면에서 친구들과 함께 봐요.';
   try{
    let image=ed.image||designOf(g)?.image||'',rows=roomRows;
    if(sent){
     const url=exportPicture();
     image=await uploadImage(author,url,(done,total)=>{if(run!==saveRun||editor!==ed)return;ed.progress=`그림 올리는 중 ${done}/${total}`;const b=root.querySelector('[data-c5=save-design]');if(b)b.textContent=ed.progress;});
     images.set(image,{status:'done',url});ed.image=image;
    }else{
     // 새 사진 없이 꾸미기만 저장할 때는, 다른 태블릿이 방금 올린 그림을 놓치지 않게 한 번 더 불러옵니다.
     try{const fresh=await loadRoom(code,author);rows=fresh.rows;const d=fresh.designs.find(x=>x.group===g);if(d?.image)image=d.image;}catch{}
    }
    await saveDesign(code,author,g,image,ed,rows);
    if(session.code===code)await refresh(root);
    ed.base=latestId(designRows,g);
   }catch(err){problem=err.message;}
   ed.saving=false;
   if(editor!==ed||session.code!==code||session.group!==g)return;
   if(!problem){
    const same=sent&&ed.img===sent.img&&ed.rotation===sent.rotation&&ed.zoom===sent.zoom&&ed.x===sent.x&&ed.y===sent.y;
    if(!sent||same)Object.assign(ed,{img:null,dirty:false,touched:false});
    else message='저장하는 동안 바꾼 그림은 아직 저장되지 않았어요. 한 번 더 저장해 주세요.';
   }
   notice=problem?'':message;error=problem;keepPlace(root,()=>render(root));
  }
  if(action==='pick'){showRobot=+el.dataset.group;render(root);const input=root.querySelector('[data-c5-form=ask] input[name=question]');input?.scrollIntoView({behavior:'smooth',block:'center'});input?.focus({preventScroll:true});}
  if(action==='voice'){voiceOn=!voiceOn;if(!voiceOn&&'speechSynthesis' in window)speechSynthesis.cancel();render(root);}
  if(action==='listen')listen(root);
 });
}
// 미리 보기 카드만 다시 그립니다(입력 칸은 그대로).
function refreshPreview(root){
 const box=root.querySelector('.c5-preview');if(!box)return;
 box.innerHTML=`<p class="c5-preview-label">${tab===2?'로봇 카드 미리 보기':'미리 보기'}</p>${tab===2?designPreview(session.group):previewCard(session.group)}`;
 drawCanvas();
}
function keepPlace(root,action){const y=window.scrollY;action();window.scrollTo(0,y);}
