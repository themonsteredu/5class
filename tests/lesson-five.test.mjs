import test from 'node:test';import assert from 'node:assert/strict';
import {encodeProfile,decodeProfile,encodeDesign,decodeDesign,splitImage,joinImage,newImageRoom,maxImageChars,backgrounds,parts} from '../lesson-five-store.js';
import {readRoom} from '../lesson-four-store.js';
test('robot profile survives the 300-character storage row and drops unknown values',()=>{
 const {name,raw}=encodeProfile({name:'  금관이  ',personality:'씩씩한',catchphrase:'삐빅!',intro:'안녕! 나는 신라 금관을 알려 주는 금관이야.'.repeat(3),favorite:'gold-crown'});
 assert.equal(name,'금관이');assert.ok(raw.length<=300);
 const back=decodeProfile({name,raw});
 assert.equal(back.personality,'씩씩한');assert.equal(back.catchphrase,'삐빅!');assert.ok(back.intro.length<=60&&back.intro.length>=58);assert.equal(back.favorite,'gold-crown');
 assert.equal(decodeProfile({name:'x',raw:'{"f":"<img>","p":7}'}).favorite,'');
 assert.equal(decodeProfile({name:'x',raw:'not json'}).intro,'');
});
test('robot design keeps background and up to three evidence stickers within 300 characters',()=>{
 const raw=encodeDesign({background:backgrounds[2],stickers:[{part:'머리',artifact:'gold-crown',evidence:'나뭇가지 모양 장식 · 교과서 28쪽'},{part:'몸통',artifact:'belt',evidence:'"'.repeat(40)},{part:'팔',artifact:'glass',evidence:'"'.repeat(40)},{part:'다리',artifact:'armor',evidence:'넷째'}]});
 assert.ok(raw.length<=300,String(raw.length));
 const d=decodeDesign({image:'pabcdefghijk',raw});
 assert.equal(d.image,'pabcdefghijk');assert.equal(d.background,backgrounds[2]);assert.equal(d.stickers.length,3);
 assert.equal(d.stickers[0].part,'머리');assert.equal(d.stickers[0].artifact,'gold-crown');assert.match(d.stickers[0].evidence,/28쪽/);
 assert.equal(decodeDesign({image:'javascript:x',raw:'{"b":99,"s":[[42,"x y","e"]]}'}).image,'');
 assert.equal(decodeDesign({image:'',raw:'{"b":99,"s":[[42,"x y","e"]]}'}).stickers[0].part,parts[0]);
});
test('a drawing is split into storage rows and joined back exactly',()=>{
 const b64=Buffer.from(Array.from({length:30000},(_,i)=>i*7%256)).toString('base64');
 const url=`data:image/webp;base64,${b64}`;
 const rows=splitImage(url);
 assert.equal(rows.length,Math.ceil(b64.length/700));
 for(const r of rows){assert.ok(r.sentence.length>=1&&r.sentence.length<=300);assert.ok(r.original.length<=300);assert.ok(r.source.length<=100);}
 const stored=rows.map(r=>({artifact:`I|${r.index}|${r.total}|${r.mime}`,sentence:r.sentence,original:r.original,source:r.source})).reverse();
 assert.equal(joinImage(stored),url);
 assert.equal(joinImage(stored.slice(1)),'');
 assert.equal(joinImage([...stored,{artifact:'I|0|5|webp',sentence:'AAAA',original:'',source:''}]),url);
 assert.throws(()=>splitImage('data:text/html;base64,AAAA'),/그림을 읽지 못했어요/);
 assert.throws(()=>splitImage(`data:image/jpeg;base64,${'A'.repeat(maxImageChars+4)}`),/너무 커요/);
 assert.match(newImageRoom(),/^p[a-z0-9]{11}$/);
});
test('the class room reader returns the latest profile and design per group and marks 5th-lesson sentences',()=>{
 const rows=[{id:'1',group:2,artifact:'P',sentence:'옛이름',original:'{}',mine:true},{id:'2',group:2,artifact:'P',sentence:'금관이',original:'{"p":"씩씩한"}',mine:false},{id:'3',group:2,artifact:'D',sentence:'pabcdefghijk',original:'{"b":1}',mine:true},{id:'4',group:5,artifact:'D',sentence:'-',original:'{"b":0}',mine:false},{id:'5',group:2,artifact:'R|신라|gold-crown|n',sentence:'새 문장',original:'',status:'사실 확인',source:'교과서 28쪽'}];
 const v=readRoom(rows);
 assert.equal(v.profiles.find(p=>p.group===2).name,'금관이');
 assert.equal(v.designs.find(d=>d.group===2).image,'pabcdefghijk');assert.equal(v.designs.find(d=>d.group===5).image,'');
 assert.equal(v.facts[0].added,true);assert.equal(v.facts[0].source,'교과서 28쪽');
});
test('a later card saved without a picture keeps the earlier drawing',()=>{
 const v=readRoom([{id:'1',group:2,artifact:'D',sentence:'pabcdefghijk',original:'{"b":1}'},{id:'2',group:2,artifact:'D',sentence:'-',original:'{"b":3}'}]);
 const d=v.designs.find(x=>x.group===2);
 assert.equal(d.image,'pabcdefghijk');assert.equal(d.raw,'{"b":3}');assert.equal(d.id,'2');
});
