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
text(19,72,'우리 모둠이 자세히 본 자료',10,True)
for x,y,label in [(22,84,'수산리 고분 벽화'),(112,84,'백제 청동 수저와 사발'),(22,95,'가야 집 모양 토기'),(112,95,'신라 토우'),(22,106,'가야 철 갑옷과 투구'),(112,106,'미륵사지 석탑 복원 모습')]:check(x,y,label)
heading(125,'01','사진에서 본 것 두 가지','모양·크기·색·자세처럼 눈으로 찾은 것을 짧게 적어요.')
text(22,146,'①',11);rule(31,148,160)
text(22,163,'②',11);rule(31,165,160)
heading(187,'02','우리 모둠의 질문 하나','사진만으로 모르는 것 중에서, 함께 알아보고 싶은 것을 적어요.')
rule(22,212,169)
heading(235,'03','알아볼 방법 하나','먼저 해 볼 방법에 표시하고, 무엇을 찾거나 부탁할지 적어요.')
check(22,255,'교과서');check(78,255,'박물관 설명');check(142,255,'AI의 도움')
text(22,268,'찾거나 부탁할 것',9,color=muted);rule(22,279,169)
text(19,290,'오늘의 질문을 다음 시간에도 이어 가요. 활동지를 잘 보관하세요.',8,color=muted)
doc.subset_fonts();doc.save(out,garbage=4,deflate=True);print(out)
