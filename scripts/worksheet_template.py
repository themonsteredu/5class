"""Apply the fixed AI-L.E.A.P. masthead to existing worksheet content."""
from pathlib import Path
import fitz
ROOT=Path(__file__).resolve().parents[1]
MM=72/25.4

def apply_template(source,lesson,subject,goal,body_start):
    result=fitz.open()
    for i,old in enumerate(source):
        page=result.new_page(width=595.276,height=841.89)
        for family in ['SCore','SCoreBold']:
            page.insert_font(fontname=family,fontfile=str(ROOT/f'tmp/pdfs/{family}.otf'))
        def text(x,y,value,size=10,bold=False):
            page.insert_text((x*MM,y*MM),value,fontsize=size,fontname='SCoreBold' if bold else 'SCore',color=(.08,.08,.08))
        if i==0:
            text(19,15,'2026. AI연구학교',9,True);text(148,15,'보성초등학교 (5학년)',9,True)
            page.insert_image(fitz.Rect(56*MM,19*MM,154*MM,38.3*MM),filename=str(ROOT/'assets/worksheets/leap-original-logo.png'))
            page.draw_line((19*MM,41*MM),(191*MM,41*MM),color=(.1,.1,.1),width=2)
            for y in [45,53,61]:page.draw_line((19*MM,y*MM),(191*MM,y*MM),color=(0,0,0),width=.6)
            for x in [48,155]:page.draw_line((x*MM,45*MM),(x*MM,61*MM),color=(0,0,0),width=.6)
            text(24,50.5,'단 원');text(51,50.5,'AI와 함께하는 역사 탐구');text(165,50.5,f'{lesson} 차시')
            text(24,58.5,'주 제');text(51,58.5,subject,9);text(159,58.5,'이름:')
            text(19,69,'◎ 학습목표',10,True);text(19,75,goal,9)
        top=80 if i==0 else 18
        # Retain vector text, writing areas, images and all original activity content.
        clip=fitz.Rect(19*MM,body_start*MM,191*MM,294*MM)
        page.show_pdf_page(fitz.Rect(19*MM,top*MM,191*MM,287*MM),source,i,clip=clip,keep_proportion=False)
        text(165,293,f'{lesson}차시 · {i+1}쪽',8)
    result.set_metadata(source.metadata)
    return result
