import { session, record, scroll, BASE } from './rec.mjs';
const w = ms => new Promise(r => setTimeout(r, ms));
const which = process.argv[2];
await session(async p => {
  const go = async h => { await p.goto(BASE + '#' + h); await w(1400); };
  if (which === 'home') {
    await go('home');
    await record(p, 'home', async () => { await w(1500); await scroll(p, 760, 2600); await w(2500); });
  }
  if (which === 'look') {
    await go('lesson/1');
    await record(p, 'look', async () => {
      await w(1800);
      await p.locator('button', { hasText: '생활의 단서 찾기' }).first().click(); await w(1600);
      for (const n of ['수저와 사발', '집 모양 토기', '신라 토우']) { await p.locator('main button', { hasText: n }).first().click(); await w(1300); }
      await w(800);
    });
  }
  if (which === 'verify') {
    await go('lesson/2');
    await p.locator('button', { hasText: '추가 문장 살피기' }).first().click(); await w(1200);
    await record(p, 'verify', async () => { await w(2200); await p.locator('button', { hasText: '문장 검증' }).first().click(); await w(4200); });
  }
  // 긴 페이지는 스크롤 녹화 대신 전체 화면을 캡처해 편집에서 천천히 내려 봅니다(스크롤 녹화 시 화면 찢김 방지).
  if (which === 'stills') {
    const shot = async name => { await w(600); await p.screenshot({ path: `stills/${name}.jpg`, fullPage: true, type: 'jpeg', quality: 92 }); console.log('still', name); };
    await go('library');
    await p.locator('.filters button', { hasText: /^신라$/ }).first().click(); await w(700);
    await p.getByRole('button', { name: /비교/ }).nth(0).click(); await w(500);
    await p.locator('.filters button', { hasText: /^가야$/ }).first().click(); await w(700);
    await p.getByRole('button', { name: /비교/ }).nth(0).click(); await w(500);
    await p.locator('.filters button', { hasText: /^전체$/ }).first().click(); await w(500);
    await p.evaluate(() => scrollTo(0, 0));
    await shot('library');
    await go('activity/4'); await shot('ai');
    await go('activity/6'); await p.getByRole('button', { name: '낱말 분석하기' }).click(); await shot('words');
    await go('activity/5'); await shot('relations');
    await go('museum'); await shot('museum');
    await go('teacher'); await shot('teacher');
  }
});
