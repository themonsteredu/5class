import { chromium } from 'playwright';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { SEED } from './seed.mjs';
const FF = process.env.FFMPEG || '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
const DPR = Number(process.env.DPR || 1.5);
const BASE = 'http://localhost:5175/';
// 녹화 전용: 가상의 모둠 기록(더미 데이터)을 브라우저 저장소에 넣습니다. 앱 코드는 바꾸지 않습니다.
export async function session(fn, { seed = true } = {}) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: DPR });
  if (seed) await ctx.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('moakit-5class-v1', s); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(SEED));
  const page = await ctx.newPage();
  try { await fn(page); } finally { await b.close(); }
}
export async function record(page, name, actions) {
  const dir = `clips/${name}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async f => {
    const i = frames.length; frames.push(f.metadata.timestamp);
    fs.writeFileSync(`${dir}/${String(i).padStart(5,'0')}.jpg`, Buffer.from(f.data, 'base64'));
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  const W = Math.round(1600*DPR), H = Math.round(900*DPR);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
  const start = Date.now() / 1000;
  await actions();
  const end = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  let list = '';
  frames.forEach((t, i) => { const next = i + 1 < frames.length ? frames[i + 1] : end; list += `file '${String(i).padStart(5,'0')}.jpg'\nduration ${Math.max(0.001, next - t).toFixed(4)}\n`; });
  list += `file '${String(frames.length - 1).padStart(5,'0')}.jpg'\n`;
  fs.writeFileSync(`${dir}/list.txt`, list);
  execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${dir}/list.txt`, '-vf', `fps=30,scale=${W}:${H}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', `clips/${name}.mp4`]);
  console.log(name, frames.length, 'frames', (end - start).toFixed(1), 's');
}
// 부드러운 스크롤
export async function scroll(page, to, ms = 1600) {
  await page.evaluate(async ([to, ms]) => { const from = scrollY, t0 = performance.now();
    await new Promise(r => { const f = now => { const k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2; scrollTo(0, from + (to - from) * e); k < 1 ? requestAnimationFrame(f) : r(); }; requestAnimationFrame(f); }); }, [to, ms]);
}
export { BASE };
