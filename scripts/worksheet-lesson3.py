from pathlib import Path
import json,re,fitz
from fontTools.ttLib import TTFont
ROOT=Path(__file__).resolve().parents[1]
for suffix,name in [('5Medium','SCore'),('7ExtraBold','SCoreBold')]:
 f=TTFont(ROOT/f'assets/fonts/S-CoreDream-{suffix}.woff');f.flavor=None
 p=ROOT/f'tmp/pdfs/{name}.otf';p.parent.mkdir(parents=True,exist_ok=True);f.save(p)
def module(path,name):
 text=(ROOT/path).read_text()
 return json.loads(re.search(r'export const '+name+r' = (\{.*\});',text,re.S).group(1))
sets=module('lesson-three-data.js','extraSets')
import subprocess
# 유물 정보는 웹 교재와 같은 data.js에서 읽습니다.
artifacts={a['id']:a for a in json.loads(subprocess.run(['node','--input-type=module','-e',"import('./data.js').then(m=>console.log(JSON.stringify(m.artifacts)))"],cwd=ROOT,capture_output=True,text=True,check=True).stdout)}
def field(id,key):return str(artifacts[id][key])
groups={'kitchen':'1모둠','dancers':'2모둠','gold-crown':'3모둠','buddha':'4모둠','seosan':'5모둠','glass':'6모둠','guests':'보너스','belt':'보너스'}
mm=72/25.4
ink=(.12,.23,.21);muted=(.35,.4,.38);line=(.7,.75,.72)
out=ROOT/'assets/worksheets'
bold=fitz.Font(fontfile=str(ROOT/'tmp/pdfs/SCoreBold.otf'));regular=fitz.Font(fontfile=str(ROOT/'tmp/pdfs/SCore.otf'))
def wrap(text,size,width,font):
 rows=['']
 for word in text.split():
  candidate=(rows[-1]+' '+word).strip()
  if font.text_length(candidate,fontsize=size)>width*mm:rows.append(word)
  else:rows[-1]=candidate
 return rows
allpages=fitz.open()
for id,s in sets.items():
 name,page_no,image,fact,caution=field(id,'name'),field(id,'page'),field(id,'image'),field(id,'fact'),field(id,'caution')
 doc=fitz.open();page=doc.new_page(width=595.276,height=841.89)
 for family in ['SCore','SCoreBold']:page.insert_font(fontname=family,fontfile=str(ROOT/f'tmp/pdfs/{family}.otf'))
 def text(x,y,t,size=10,b=False,color=ink):page.insert_text((x*mm,y*mm),t,fontsize=size,fontname='SCoreBold' if b else 'SCore',color=color)
 def rule(y,x=19,w=172):page.draw_line((x*mm,y*mm),((x+w)*mm,y*mm),color=line,width=.5)
 def choices(y,final=False):
  text(19,y,'최종 판단' if final else '처음 생각',9,True)
  for x,label in zip([49,79,109],['사실','거짓','판단하기 어려움' if final else '잘 모르겠음']):
   page.draw_rect(fitz.Rect(x*mm,(y-2.7)*mm,(x+2.7)*mm,y*mm),color=muted,width=.5);text(x+4,y,label,9)
 text(19,17,'MOAKIT',11,True);text(150,17,'5학년 · 사회 × AI · 3차시',8.5)
 text(19,30,'새 유물 문장을 확인해요',21,True);text(19,40,f'{groups[id]} · {name} · 교과서 {page_no}쪽',12,True)
 text(19,49,'이름: __________________    모둠: __________    날짜: ______________',10)
 page.insert_image(fitz.Rect(19*mm,54*mm,52*mm,86*mm),filename=str(ROOT/'assets/images'/image),keep_proportion=True)
 y=59
 for row in wrap(fact,9.5,136,regular)[:4]:text(56,y,row,9.5);y+=4.8
 for row in wrap('이렇게 단정하지 않아요: '+caution,8.5,136,regular)[:2]:text(56,y+1,row,8.5,color=muted);y+=4.3
 text(19,94,'교과서와 위 설명을 읽고 문장을 확인한 뒤, 웹 문장판에도 올립니다.',9.5)
 for i,c in enumerate(s['claims']):
  y=100+i*50
  rule(y);text(19,y+8,f'{i+1:02d}',10,True)
  rows=wrap(c['text'],10.5,157,bold)
  assert len(rows)<=2,f'Claim needs extra space: {id} {i}'
  for j,row in enumerate(rows):text(30,y+8+j*5,row,10.5,True)
  choices(y+19)
  text(19,y+27,'확인한 자료',9);rule(y+28,46,145)
  text(19,y+36,'찾은 근거',9);rule(y+37,46,145)
  choices(y+45,True)
 rule(252)
 text(19,262,'바로잡은 설명',11,True);text(65,262,'문장 (    )번을 사실에 맞게 고쳐 써 봅시다.',9)
 rule(275)
 text(19,285,'자료에는 교과서 쪽수를 씁니다. 자료에 없는 내용은 거짓으로 단정하지 않고 ‘판단하기 어려움’을 고릅니다.',8)
 text(19,291,'이미지: 교과서 발췌 또는 국립중앙박물관·한성백제박물관 공개 자료',7.5,color=muted)
 doc.set_metadata({'title':f'3차시 새 유물 문장 확인 - {name}','author':'MOAKIT'})
 doc.subset_fonts();doc.save(out/f'lesson-3-{id}.pdf',garbage=4,deflate=True)
 allpages.insert_pdf(doc)
allpages.set_metadata({'title':'3차시 새 유물 문장 확인 활동지 (모둠 6종 + 보너스 2종)','author':'MOAKIT'})
allpages.save(out/'lesson-3.pdf',garbage=4,deflate=True)
print('Generated 8 one-page worksheets and combined lesson-3.pdf')
