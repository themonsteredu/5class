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
font=fitz.Font(fontfile=str(ROOT/'tmp/pdfs/SCoreBold.otf'))
for id,s in sets.items():
 doc=fitz.open()
 def new_page(title,number):
  global page
  page=doc.new_page(width=595.276,height=841.89)
  for family in ['SCore','SCoreBold']:page.insert_font(fontname=family,fontfile=str(ROOT/f'tmp/pdfs/{family}.otf'))
  text(19,17,'MOAKIT',11,True);text(142,17,f'5학년 · 사회 × AI · 2차시 {number}/2',8.5)
  text(19,30,title,21,True);text(19,40,s['name'],12,True)
  text(19,49,'이름: __________________    모둠: __________    날짜: ______________',10)
 def text(x,y,t,size=10,bold=False,color=ink):
  page.insert_text((x*mm,y*mm),t,fontsize=size,fontname='SCoreBold' if bold else 'SCore',color=color)
 def rule(y,x=19,w=172):page.draw_line((x*mm,y*mm),((x+w)*mm,y*mm),color=line,width=.5)
 def choices(y,final=False):
  text(19,y,'최종 판단' if final else '처음 생각',9,bold=True)
  for x,label in zip([49,79,109],['사실','거짓','판단하기 어려움' if final else '잘 모르겠음']):
   page.draw_rect(fitz.Rect(x*mm,(y-2.7)*mm,(x+2.7)*mm,y*mm),color=muted,width=.5);text(x+4,y,label,9)
 new_page('우리 질문의 답을 찾아요',1)
 text(19,63,'01  우리의 질문',12,True)
 text(65,63,'1차시 활동지 02의 질문을 그대로 옮겨 씁니다.',8.5,color=muted)
 rule(75);rule(85)
 text(19,99,'02  자료에서 찾은 근거',12,True)
 for y in [110,150]:
  text(19,y,'확인한 자료',9,True);rule(y+2,46,145)
  text(19,y+12,'찾은 근거',9,True);rule(y+14,46,145);rule(y+25,46,145)
 text(19,188,'03  우리 질문에 답하기',12,True)
 text(19,197,'찾은 근거로 알 수 있는 내용을 내 말로 써 봅시다. 일부만 알아도 괜찮습니다.',9,color=muted)
 rule(209);rule(220);rule(231)
 text(19,247,'04  더 알아볼 점',12,True)
 text(65,247,'아직 답을 찾지 못한 부분은 다음 시간에 이어 갑니다.',8.5,color=muted)
 rule(260);rule(271)
 text(19,285,'자료에는 교과서 쪽수 또는 기관 이름·자료 제목을 적습니다.',8,color=muted)
 text(19,291,f'자료 찾기: 비상 사회 5-2 {s["page"]}쪽 / {s["site"]}',8,color=muted)
 new_page('추가 문장을 확인해요',2)
 text(19,58,'우리 질문에 이어, 같은 유물의 설명도 자료를 찾아 확인해 봅시다.',10)
 text(19,66,'AI 설명 검증을 위한 학습용 문장입니다. 오류가 포함되어 있습니다.',8.5,color=muted)
 for i,c in enumerate(s['claims']):
  y=75+i*59
  rule(y);text(19,y+8,f'{i+1:02d}',10,True)
  rows=['']
  for word in c['text'].split():
   candidate=(rows[-1]+' '+word).strip()
   if font.text_length(candidate,fontsize=10.5)>157*mm:rows.append(word)
   else:rows[-1]=candidate
  assert len(rows)<=2, f'Claim needs extra space: {id} {i}'
  for j,row in enumerate(rows):text(30,y+8+j*5,row,10.5,True)
  choices(y+20)
  text(19,y+29,'확인한 자료',9);rule(y+30,46,145)
  text(19,y+39,'찾은 근거',9);rule(y+40,46,145)
  choices(y+51,True)
 rule(252)
 text(19,262,'바로잡은 설명',11,True);text(65,262,'문장 (    )번을 사실에 맞게 고쳐 써 봅시다.',9)
 rule(275)
 text(19,285,'자료에는 책의 쪽수 또는 기관·자료 제목을 씁니다. 못 찾은 내용은 거짓으로 단정하지 않습니다.',8)
 text(19,291,'3차시에는 우리 질문의 조사 기록과 문장 검증 기록, 두 쪽을 모두 가져옵니다.',8,color=muted)
 doc.set_metadata({'title':f'2차시 질문 조사와 문장 검증 - {s["name"]}','author':'MOAKIT'})
 doc.subset_fonts();doc.save(out/f'lesson-2-{id}.pdf',garbage=4,deflate=True)
 allpages.insert_pdf(doc)
allpages.set_metadata({'title':'2차시 질문 조사와 문장 검증 활동지 6종 (12쪽)','author':'MOAKIT'})
allpages.save(out/'lesson-2.pdf',garbage=4,deflate=True)
print('Generated 6 two-page worksheets and combined 12-page PDF')
