# 배경음악을 numpy로 직접 합성합니다(외부 음원·저작권 문제 없음). 결과: music.wav
import numpy as np, wave
SR=44100; DUR=57.8; N=int(SR*DUR); t=np.arange(N)/SR
BPM=88; beat=60/BPM; bar=beat*4
def mid(m): return 440*2**((m-69)/12)
# 따뜻한 장조 진행: C G Am F (각 2마디)
prog=[[48,55,64],[43,50,59],[45,52,60],[41,48,57]]
out=np.zeros(N); rng=np.random.default_rng(5)
def env(n,a,r):
    e=np.ones(n); ai=int(a*SR); ri=int(r*SR); e[:ai]=np.linspace(0,1,ai); e[-ri:]*=np.linspace(1,0,ri); return e
chord_len=bar*2
# 패드
k=0; start=0.0
while start<DUR:
    ch=prog[k%4]; n=int(min(chord_len+1.2,DUR-start)*SR); s0=int(start*SR); tt=np.arange(n)/SR; sig=np.zeros(n)
    for m in ch+[ch[0]+12]:
        f=mid(m)
        for d in (-0.1,0.1):
            ff=f*2**(d/12); sig+=np.sin(2*np.pi*ff*tt)+0.2*np.sin(2*np.pi*2*ff*tt)
    sig*=env(n,1.4,1.4)*0.03*(1+0.15*np.sin(2*np.pi*0.25*tt))
    out[s0:s0+n]+=sig[:N-s0]; start+=chord_len; k+=1
# 현을 뜯는 듯한 5음계 아르페지오(가야금 느낌의 짧은 감쇠)
def pluck(f,n):
    tt=np.arange(n)/SR
    return (np.sin(2*np.pi*f*tt)+0.45*np.sin(2*np.pi*2*f*tt)*np.exp(-tt*6)+0.2*np.sin(2*np.pi*3*f*tt)*np.exp(-tt*9))*np.exp(-tt*4.5)*np.minimum(1,tt*400)
scale=[0,2,4,7,9]  # 도 레 미 솔 라
pat=[0,2,4,2,3,1,4,2]
step=beat/2; i=0; tcur=4.8
while tcur<DUR-3.0:
    bi=int(tcur/chord_len)%4; root=prog[bi][0]+24
    m=72+scale[pat[i%8]] if bi in (0,3) else 74+scale[pat[(i+3)%8]]-2
    n=int(0.9*SR); s0=int(tcur*SR); sig=pluck(mid(m),n)*0.05*(0.8 if i%2 else 1)
    e=min(n,N-s0); out[s0:s0+e]+=sig[:e]; tcur+=step; i+=1
# 부드러운 북과 쉐이커 (10.2s ~ 51.6s)
tcur=10.2
while tcur<51.6:
    n=int(0.4*SR); s0=int(tcur*SR); tt=np.arange(n)/SR
    f=48+70*np.exp(-tt*25); ph=2*np.pi*np.cumsum(f)/SR
    out[s0:s0+n]+=np.sin(ph)*np.exp(-tt*8)*0.18
    for off in (beat/2,):
        h0=int((tcur+off)*SR); hn=int(0.06*SR)
        if h0+hn<N: out[h0:h0+hn]+=rng.standard_normal(hn)*np.exp(-np.arange(hn)/SR*70)*0.014
    tcur+=beat
# 베이스
for bi in range(int(DUR/beat)):
    tb=bi*beat
    if tb<10.2 or tb>51.6: continue
    ch=prog[int(tb/chord_len)%4]; f=mid(ch[0]-12)
    n=int(beat*SR*0.95); s0=int(tb*SR); tt=np.arange(n)/SR
    out[s0:s0+n]+=(np.sin(2*np.pi*f*tt)*np.minimum(1,tt*60)*np.exp(-tt*2.0)*0.11)[:N-s0]
fade=np.ones(N); fi=int(1.0*SR); fade[:fi]=np.linspace(0,1,fi); fo=int(4.0*SR); fade[-fo:]=np.linspace(1,0,fo)**1.5
out*=fade
for d,g in ((0.27,0.25),(0.47,0.14),(0.71,0.07)):
    di=int(d*SR); out[di:]+=out[:-di]*g
out/=np.max(np.abs(out))*1.15
st=np.stack([out,np.roll(out,int(0.011*SR))],1)
w=wave.open('music.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((st*32767).astype('<i2').tobytes()); w.close()
print('ok')
