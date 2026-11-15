// v0.8 재미·연출 개선 검사: 추측 없는 지뢰찾기 생성, 스네이크 HUD·벽, 효과 모듈의 안전성.
import { minesNoGuess, minesSolvable, mineNeighbors } from '../js/rules.js';
import { effects } from '../js/effects.js';
import { advance, mount, check, counts, key } from './harness.mjs';

let seed = 7;
const rng = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 4294967296; };

// 지뢰찾기: 세 난이도 모두, 첫 클릭 주변은 비어 있고 지뢰 수가 정확하며 논리만으로 끝까지 풀린다.
for (const [columns, rows, total, boards] of [[9, 9, 10, 60], [16, 16, 40, 40], [24, 16, 99, 25]]) {
    let solved = 0;
    for (let n = 0; n < boards; n++) {
        const start = Math.floor(rng() * columns * rows), { mines, solved: ok } = minesNoGuess(columns, rows, total, start, rng, 3000);
        check(mines.size === total, `${columns}×${rows}: 지뢰 수 ${total}`);
        check(!mines.has(start) && mineNeighbors(start, columns, rows).every((i) => !mines.has(i)), `${columns}×${rows}: 첫 칸 주변 3×3은 안전`);
        check([...mines].every((i) => Number.isInteger(i) && i >= 0 && i < columns * rows), `${columns}×${rows}: 지뢰 위치가 판 안`);
        if (ok && minesSolvable(mines, columns, rows, start)) solved++;
    }
    check(solved === boards, `${columns}×${rows}: 생성한 판 ${solved}/${boards}개가 추측 없이 풀림`);
}
// 풀이기 자체 확인: 50:50 상황(두 칸 중 하나가 지뢰, 단서가 같음)은 풀리지 않는다고 답해야 한다.
{
    const columns = 4, rows = 2, mines = new Set([3]);
    // 0 1 2 3 / 4 5 6 7 : 3 또는 7이 지뢰인지 2·6의 숫자로 구별할 수 없다
    check(!minesSolvable(mines, columns, rows, 0), 'Solver reports a true 50:50 as not solvable');
}

// 실제 모듈: 첫 클릭이 넓게 열리고, 물결 연출 클래스가 붙는다.
for (const mode of ['easy', 'medium', 'hard']) {
    const t = mount('mines', { mode }); t.click(t.cells().length >> 1);
    const opened = t.cells().filter((cell) => cell.classList.contains('open')).length;
    check(opened >= 9 && !t.s.over, `mines ${mode}: 첫 클릭으로 최소 3×3이 열림 (${opened}칸)`);
    t.destroy();
}

// 스네이크: 황금 별 안내가 HUD에 있고, 벽(클래식)에 부딪히면 한 번만 끝난다.
{
    const t = mount('snake'); check(t.state.hud.some(([label]) => label === '황금 별'), 'Snake HUD shows the golden-star countdown');
    advance(4); check(t.state.results.length === 1 && t.state.results[0].win === false, 'Snake ends once when it reaches the wall'); t.destroy();
}
{
    const t = mount('snake', { mode: 'wrap' }); advance(4); check(!t.state.results.length, 'Wrap snake passes through the border'); key('ArrowUp'); advance(.5); check(!t.s.over, 'Wrap snake keeps moving after a turn'); t.destroy();
}

// 효과 모듈: 캔버스가 없어도(테스트 DOM) 흔들림·번쩍임·고리가 안전하게 무시되거나 그려진다.
{
    const calls = []; const ctx = new Proxy({}, { get: (_, name) => (name === 'canvas' ? undefined : (...a) => calls.push([name, a])), set: () => true });
    const fx = effects(null); fx.shake(); fx.flash(); fx.ring(10, 10); fx.burst(5, 5, '#fff', 4, 50, 300); fx.label(5, 5, '+1');
    for (let n = 0; n < 30; n++) fx.update(1 / 60); fx.draw(ctx);
    check(calls.every(([, args]) => args.every((v) => typeof v !== 'number' || Number.isFinite(v))), 'Effects draw only finite coordinates');
    for (let n = 0; n < 120; n++) fx.update(1 / 60); calls.length = 0; fx.draw(ctx); check(!calls.some(([name]) => name === 'arc'), 'Effects expire after their lifetime');
}
console.log(`PASS: ${counts().assertions} fun / feedback conditions`);
