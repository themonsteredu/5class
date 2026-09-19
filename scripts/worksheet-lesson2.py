from pathlib import Path
import fitz
from fontTools.ttLib import TTFont as Font
ROOT=Path(__file__).resolve().parents[1]
for suffix,name in [('5Medium','SCore'),('7ExtraBold','SCoreBold')]:
    font=Font(ROOT/f'assets/fonts/S-CoreDream-{suffix}.woff');font.flavor=None
    target=ROOT/f'tmp/pdfs/{name}.otf';target.parent.mkdir(parents=True,exist_ok=True);font.save(target)
out=ROOT/'assets/worksheets/lesson-2.pdf';out.parent.mkdir(parents=True,exist_ok=True)
doc=fitz.open();page=doc.new_page(width=595.276,height=841.89)
doc.set_metadata({'title':'2차시 활동지 - 역사 자료로 질문 다듬기','author':'MOAKIT'})
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
text(19,18,'MOAKIT',11,True);text(141,18,'5학년 · 사회 × AI · 2차시',9,color=muted)
text(19,32,'역사 자료로 질문 다듬기',22,True)
text(19,42,'AI의 설명을 자료와 비교하고, 우리 모둠의 탐구 질문을 정해요.',10,color=muted)
text(19,54,'이름',10);rule(31,55,44);text(88,54,'모둠',10);rule(100,55,34);text(147,54,'날짜',10);rule(159,55,32)
rule(19,62)
heading(74,'01','지난 시간의 모둠 질문')
rule(22,92,169)
heading(110,'02','AI의 답변에서 확인하고 싶은 문장','두 답변이 같아도, 자료로 확인할 문장 하나를 골라요.')
rule(22,137,169)
heading(155,'03','자료로 확인했어요.')
text(22,168,'자료 이름 · 쪽수',9,color=muted);rule(57,171,134)
check(22,184,'자료에 나와요');check(79,184,'다르게 나와요');check(140,184,'더 확인해요')
text(22,197,'확인한 내용',9,color=muted);rule(22,209,169)
heading(229,'04','우리 모둠이 조사할 질문','어느 자료에서 무엇을 알아보고 싶은지 적어요.')
rule(22,253,169)
text(22,267,'다음 시간에 찾아볼 자료나 낱말',9,color=muted);rule(22,278,169)
text(19,290,'AI의 설명은 자료와 비교해요. 오늘 정한 질문으로 다음 시간에 자료를 모아요.',8,color=muted)
doc.subset_fonts();doc.save(out,garbage=4,deflate=True);print(out)
