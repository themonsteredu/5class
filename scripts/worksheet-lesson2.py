from pathlib import Path
import json,fitz
from fontTools.ttLib import TTFont
ROOT=Path(__file__).resolve().parents[1]
for suffix,name in [('5Medium','SCore'),('7ExtraBold','SCoreBold')]:
 f=TTFont(ROOT/f'assets/fonts/S-CoreDream-{suffix}.woff');f.flavor=None
 p=ROOT/f'tmp/pdfs/{name}.otf';p.parent.mkdir(parents=True,exist_ok=True);f.save(p)
sets=json.loads((ROOT/'assets/lesson-2-claims.json').read_text())
mm=72/25.4
ink=(.12,.23,.21);muted=(.35,.4,.38);line=(.7,.75,.72)
out=ROOT/'assets/worksheets';out.mkdir(exist_ok=True)
allpages=fitz.open()
for id,s in sets.items():
 doc=fitz.open();page=doc.new_page(width=595.276,height=841.89)
 for font in ['SCore','SCoreBold']:page.insert_font(fontname=font,fontfile=str(ROOT/f'tmp/pdfs/{font}.otf'))
 def text(x,y,t,size=10,bold=False,color=ink):
  page.insert_text((x*mm,y*mm),t,fontsize=size,fontname='SCoreBold' if bold else 'SCore',color=color)
 def rule(y,x=19,w=172):page.draw_line((x*mm,y*mm),((x+w)*mm,y*mm),color=line,width=.5)
 def choices(y,final=False):
  text(19,y,'최종 판단' if final else '처음 생각',9,bold=True)
  for x,label in zip([49,79,109],['사실','거짓','판단하기 어려움' if final else '잘 모르겠음']):
   page.draw_rect(fitz.Rect(x*mm,(y-2.7)*mm,(x+2.7)*mm,y*mm),color=muted,width=.5);text(x+4,y,label,9)
 text(19,17,'MOAKIT',11,True);text(142,17,'5학년 · 사회 × AI · 2차시',9)
 text(19,30,'AI의 유물 설명, 사실일까?',21,True)
 text(19,40,s['name'],12,True)
 text(19,49,'이름: __________________    모둠: __________    날짜: ______________',10)
 text(19,58,'설명을 읽고 예상한 뒤, 자료에서 찾은 근거로 판단해 봅시다.',10)
 text(19,66,'AI 설명 검증을 위한 학습용 문장입니다. 오류가 포함되어 있습니다.',8.5,color=muted)
 for i,c in enumerate(s['claims']):
  y=75+i*59
  rule(y)
  text(19,y+8,f'{i+1:02d}',10,True)
  # Wrap claim text within the available width using font metrics.
  font=fitz.Font(fontfile=str(ROOT/'tmp/pdfs/SCore.otf'))
  words=c['text'].split();rows=['']
  for word in words:
   candidate=(rows[-1]+' '+word).strip()
   if font.text_length(candidate,fontsize=10.5)>157*mm:rows.append(word)
   else:rows[-1]=candidate
  for j,row in enumerate(rows):text(30,y+8+j*5,row,10.5,True)
  choices(y+20)
  text(19,y+29,'확인한 자료',9);rule(y+30,46,145)
  text(19,y+39,'찾은 근거',9);rule(y+40,46,145)
  choices(y+51,True)
 rule(252)
 text(19,262,'바로잡은 설명',11,True);text(65,262,'문장 (    )번을 사실에 맞게 고쳐 써 봅시다.',9)
 rule(275)
 text(19,285,'자료에는 책의 쪽수 또는 기관·자료 제목을 씁니다. 못 찾은 내용은 거짓으로 단정하지 않습니다.',8)
 text(19,291,f'자료 찾기: 비상 사회 5-2 {s["page"]}쪽 / {s["site"]}',8,color=muted)
 doc.set_metadata({'title':f'2차시 검증 활동지 - {s["name"]}','author':'MOAKIT'})
 doc.subset_fonts();doc.save(out/f'lesson-2-{id}.pdf',garbage=4,deflate=True)
 allpages.insert_pdf(doc)
allpages.set_metadata({'title':'2차시 유물별 검증 활동지 6종','author':'MOAKIT'})
allpages.save(out/'lesson-2.pdf',garbage=4,deflate=True)
print('Generated 6 single-page worksheets and combined PDF')
