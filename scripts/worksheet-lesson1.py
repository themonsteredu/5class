from pathlib import Path
import fitz
from fontTools.ttLib import TTFont as Font
ROOT=Path(__file__).resolve().parents[1]
for suffix,name in [('5Medium','SCore'),('7ExtraBold','SCoreBold')]:
    font=Font(ROOT/f'assets/fonts/S-CoreDream-{suffix}.woff');font.flavor=None
    target=ROOT/f'tmp/pdfs/{name}.otf';target.parent.mkdir(parents=True,exist_ok=True);font.save(target)
out=ROOT/'assets/worksheets/lesson-1.pdf';out.parent.mkdir(parents=True,exist_ok=True)
doc=fitz.open();page=doc.new_page(width=595.276,height=841.89)
doc.set_metadata({'title':'1차시 활동지 - 삼국과 가야의 궁금증 찾기','author':'MOAKIT'})
for name in ['SCore','SCoreBold']:page.insert_font(fontname=name,fontfile=str(ROOT/f'tmp/pdfs/{name}.otf'))
mm=72/25.4
def rgb(h):return tuple(int(h[i:i+2],16)/255 for i in (0,2,4))
ink=rgb('263f3b');muted=rgb('66716c');line=rgb('bfc6bf')
def text(x,y,t,size=11,bold=False,color=ink):
    page.insert_text((x*mm,y*mm),t,fontsize=size,fontname='SCoreBold' if bold else 'SCore',color=color)
def rule(x,y,w=172,color=line):
    page.draw_line((x*mm,y*mm),((x+w)*mm,y*mm),color=color,width=.5)
def check(x,y,label):
    page.draw_rect(fitz.Rect(x*mm,(y-2.7)*mm,(x+2.7)*mm,y*mm),color=muted,width=.6);text(x+4.6,y,label,10)
def heading(y,num,title,hint=''):
    text(19,y,num,10,True,muted);text(30,y,title,14,True)
    if hint:text(30,y+7,hint,9,color=muted)
text(19,18,'MOAKIT',11,True);text(141,18,'5학년 · 사회 × AI · 1차시',9,color=muted)
text(19,32,'삼국과 가야의 궁금증 찾기',22,True)
text(19,42,'사진은 함께 보고, 내 생각은 이 종이에 짧게 남겨요.',10,color=muted)
text(19,54,'이름',10);rule(31,55,44);text(88,54,'모둠',10);rule(100,55,34);text(147,54,'날짜',10);rule(159,55,32)
rule(19,62)
heading(73,'01','자세히 볼 자료를 골라요.','하나를 골라 네모에 표시해요.')
for x,y,label in [(22,93,'수산리 고분 벽화'),(112,93,'백제 청동 수저와 사발'),(22,105,'가야 집 모양 토기'),(112,105,'신라 토우'),(22,117,'가야 철 갑옷과 투구'),(112,117,'미륵사지 석탑 복원 모습')]:check(x,y,label)
heading(136,'02','눈으로 찾은 것','모양·크기·색·자세에서 두 가지를 찾아요.')
text(22,157,'①',11);rule(31,159,160)
text(22,173,'②',11);rule(31,175,160)
heading(194,'03','무엇이 궁금한가요?')
text(22,207,'내 질문',9,color=muted);rule(47,210,144)
text(22,226,'우리 모둠 질문',9,color=muted);rule(57,229,134)
heading(249,'04','AI에게 부탁하고 싶은 일')
check(22,262,'메모 정리');check(74,262,'낱말 뜻 설명');check(133,262,'질문 떠올리기')
text(22,276,'다른 부탁',9,color=muted);rule(48,279,143)
text(19,289,'AI의 답은 교과서나 박물관 자료와 함께 확인해요.',8,color=muted)
doc.subset_fonts();doc.save(out,garbage=4,deflate=True);print(out)
