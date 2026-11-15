import { background, circle, text, palette, seededRandom } from '../core.js';
import { captureTerritory, gridNeighbors, sweepCircle } from '../rules.js';
import { effects } from '../effects.js';

export default (s) => {
    const columns = 30, rows = 24, size = 18, width = columns * size, height = rows * size, { ctx } = s.canvas(width, height), fx = effects(s), random = seededRandom(s.options.seed || 12345);
    const calm = s.options.mode === 'calm', target = calm ? 70 : 75, colors = [palette.coral, palette.yellow, palette.purple];
    let board = Array.from({ length: columns * rows }, (_, i) => i % columns === 0 || i % columns === columns - 1 || i < columns || i >= columns * (rows - 1) ? 1 : 0), player = 15, from = 15, lastSafe = 15, trail = [], armed = false, lives = 3, score = 0, timer = 0, blend = 1, grace = 1.5, lastKey = '', hudKey = '';
    const hazards = Array.from({ length: calm ? 2 : 3 }, (_, i) => { const angle = random() * Math.PI * 2; return { x: 120 + i * 130, y: 150 + i * 35, vx: Math.cos(angle) * (calm ? 42 : 55), vy: Math.sin(angle) * (calm ? 42 : 55) }; });
    const center = (i) => ({ x: (i % columns + .5) * size, y: (Math.floor(i / columns) + .5) * size });
    const owned = () => board.reduce((a, b) => a + b, 0), percent = () => Math.floor(owned() / board.length * 1000) / 10;
    const hud = () => {
        const key = `${percent()}:${lives}:${score}:${armed}:${trail.length}`; if (key === hudKey) return; hudKey = key;
        s.hud([['점령 / 목표', `${percent().toFixed(1)}% / ${target}%`], ['그리기 · Space', armed ? 'ON · 영역 밖으로!' : 'OFF · 안전 이동'], ['기회', '♥'.repeat(lives)], ['점수', score]]);
    };
    const toggle = () => { if (trail.length) { s.message('선을 닫아 안전 구역으로 돌아오면 그리기를 끌 수 있어요.'); return; } armed = !armed; hud(); s.sound(armed ? 430 : 250, .04); };
    const lose = (reason) => {
        const p = center(player); fx.burst(p.x, p.y, palette.coral, 24, 100); lives--; fx.shake(6); trail = []; armed = false; from = player = lastSafe; timer = 0; blend = 1; grace = 1.5; s.releaseKeys();
        if (!lives) s.finish({ score, win: false, title: '다음에는 더 넓게!', text: `${percent().toFixed(1)}% 점령 · ${score}점 · ${reason}` });
        else { s.message(`${reason} 기회가 하나 줄었어요. 안전 구역에서 다시 시작하세요.`); s.sound(160, .1); } hud();
    };
    const delta = (code) => ({ ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1, ArrowUp: -columns, KeyW: -columns, ArrowDown: columns, KeyS: columns })[code];
    const step = (code) => {
        const next = player + delta(code); if (!gridNeighbors(player, columns, board.length).includes(next) || (!board[next] && !armed)) return;
        if (trail.includes(next)) { lose('그리던 선과 부딪혔어요.'); return; }
        from = player; player = next; blend = 0; s.changed();
        if (!board[player]) trail.push(player);
        else {
            if (trail.length) {
                const before = owned(), seeds = hazards.flatMap((h) => { const i = Math.floor(h.y / size) * columns + Math.floor(h.x / size); return [i, ...gridNeighbors(i, columns, board.length).filter((at) => { const p = center(at); return Math.hypot(p.x - h.x, p.y - h.y) < size; })]; });
                board = captureTerritory(board, columns, trail, seeds); const gained = owned() - before, bonus = gained * 5 + trail.length * 3; score += bonus; trail = []; armed = false;
                const p = center(player); fx.label(p.x, p.y - 12, `+${bonus}`, palette.green); fx.burst(p.x, p.y, palette.green, 14, 75); s.sound(630, .08); s.message(`영역 +${(gained / board.length * 100).toFixed(1)}%! 선이 길수록 추가 점수를 얻어요.`);
                if (percent() >= target) { hud(); s.finish({ score, title: '영역 점령 성공!', text: `${percent().toFixed(1)}% 점령 · ${lives}개의 기회를 남겼어요.` }); return; }
            }
            lastSafe = player;
        }
        hud();
    };
    s.controls([{ label: '그리기 ON / OFF · Space', action: toggle }]);
    s.bindKeys(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'], (code) => { if (code === 'Space') toggle(); else { lastKey = code; if (timer <= 0) { step(code); timer = .105; } } });
    s.on(s.root, 'gamepause', () => { lastKey = ''; });
    s.afterFinish((dt) => fx.update(dt));
    s.run((dt) => {
        fx.update(dt); grace = Math.max(0, grace - dt); timer = Math.max(0, timer - dt); blend = Math.min(1, blend + dt / .105);
        const held = lastKey && s.down(lastKey) ? lastKey : ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].find((code) => s.down(code));
        if (held && timer <= 1e-9) { step(held); timer = .105; if (!s.active()) return; }
        for (const h of hazards) {
            const old = { x: h.x, y: h.y };
            for (const axis of ['x', 'y']) {
                const velocity = axis === 'x' ? 'vx' : 'vy', previous = h[axis]; h[axis] += h[velocity] * dt;
                const blocked = [-6, 6].some((dx) => [-6, 6].some((dy) => board[Math.floor((h.y + dy) / size) * columns + Math.floor((h.x + dx) / size)]));
                if (blocked) { h[axis] = previous; h[velocity] *= -1; }
            }
            if (!grace && trail.some((at) => { const p = center(at); return sweepCircle({ x: old.x - p.x, y: old.y - p.y }, { x: h.x - p.x, y: h.y - p.y }, 13) !== null; })) { lose('움직이는 빛이 선에 닿았어요.'); break; }
        }
    }, () => {
        background(ctx, width, height, size);
        board.forEach((value, i) => { if (value) { ctx.fillStyle = '#b9f86b17'; ctx.fillRect(i % columns * size, Math.floor(i / columns) * size, size, size); ctx.fillStyle = '#b9f86b36'; ctx.fillRect(i % columns * size + 7, Math.floor(i / columns) * size + 7, 3, 3); } });
        ctx.strokeStyle = '#b9f86b40'; ctx.lineWidth = 1; ctx.strokeRect(.5, .5, width - 1, height - 1);
        if (trail.length) {
            ctx.strokeStyle = palette.yellow; ctx.lineWidth = 3; ctx.setLineDash([4, 3]); ctx.beginPath();
            [lastSafe, ...trail].forEach((i, n) => { const p = center(i); if (n) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }); ctx.stroke(); ctx.setLineDash([]);
            trail.forEach((i) => { const p = center(i); circle(ctx, p.x, p.y, 2, palette.yellow); });
        }
        hazards.forEach((h, i) => { ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(s.time * .8); ctx.fillStyle = colors[i]; ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(7, 0); ctx.lineTo(0, 7); ctx.lineTo(-7, 0); ctx.closePath(); ctx.fill(); ctx.restore(); circle(ctx, h.x, h.y, 2, '#151b23'); });
        const a = center(from), b = center(player), p = { x: a.x + (b.x - a.x) * blend, y: a.y + (b.y - a.y) * blend };
        circle(ctx, p.x, p.y, 9, `${armed ? palette.yellow : palette.green}22`); circle(ctx, p.x, p.y, 5.5, armed ? palette.yellow : palette.green); if (grace > 0) { ctx.strokeStyle = '#edf0f4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2 * grace / 1.5); ctx.stroke(); }
        if (!s.dirty) text(ctx, 'Space로 그리기 → 선을 닫아 영역 점령', width / 2, height / 2 - 35, 13, palette.muted); fx.draw(ctx);
    });
    hud(); s.message('안전 구역에서 Space로 그리기를 켜고 영역 밖으로 나가세요. 돌아오면 빛이 없는 쪽을 점령해요.');
    s.ready('땅따먹기', `Space로 그리기를 켠 뒤 선을 닫으세요. 움직이는 빛과 내 선의 접촉, 선의 교차를 피하며 ${target}%를 점령하면 성공이에요.`, () => {});
};
