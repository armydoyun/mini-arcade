import { background, circle, text, palette, clamp, seededRandom, reducedMotion } from '../core.js';
import { bubblePosition, bubbleTrace, bubbleResolve } from '../rules.js';
import { effects } from '../effects.js';

const colors = ['#ff8e7a', '#82b6ff', '#b9f86b', '#f5d47d', '#c1a0ff'], symbols = ['●', '＋', '◆', '−', '×'];
export const bubbleDescend = (board, phase, row) => ({ board: [...row, ...board.slice(0, -12)], phase: 1 - phase, overflow: board.slice(-12).some(Boolean) });
export default (s) => {
    const { canvas, ctx, point } = s.canvas(520, 600), fx = effects(s), random = seededRandom(s.options.seed || 12345), easy = s.options.mode === 'easy', hard = s.options.mode === 'hard', count = easy ? 3 : hard ? 5 : 4;
    let board = Array.from({ length: 168 }, (_, i) => i < (easy ? 4 : hard ? 6 : 5) * 12 ? Math.floor(random() * count) + 1 : 0), phase = 0, score = 0, shots = 0, misses = 0, angle = -Math.PI / 2, aim = angle, current = 1, next = 1, ball = null, busy = 0, swapped = false, falling = [], descent = 0, hudKey = '';
    const available = () => [...new Set(board.filter(Boolean))], pick = () => { const pool = available(); return pool[Math.floor(random() * pool.length)] || 1; };
    current = pick(); next = pick();
    const hud = () => {
        const key = `${score}:${shots}:${misses}:${board.filter(Boolean).length}`; if (key === hudKey) return; hudKey = key;
        s.hud([['점수', score], ['남은 버블', board.filter(Boolean).length], ['발사', shots], ['천장 하강까지', `${5 - misses}번 빗맞힘`]]);
    };
    const end = (win) => { hud(); s.finish({ score, win, title: win ? '하늘까지 깨끗하게!' : '천장이 가까워졌어요', text: `${shots}회 발사 · ${score}점 · ${win ? '모든 버블을 지웠어요.' : '조준선을 보고 큰 연결을 만들어 보세요.'}` }); };
    const finishTurn = () => {
        if (!board.some(Boolean)) { end(true); return; }
        if (board.some((value, i) => value && bubblePosition(i, phase).y + 18 >= 465)) { end(false); return; }
        const pool = available(); current = pool.includes(next) ? next : pick(); next = pick(); swapped = false; ball = null; hud();
    };
    const land = (slot) => {
        const result = bubbleResolve(board, slot, current, phase); if (!result) { end(false); return; }
        const old = board; board = result.board; ball = null; busy = reducedMotion() ? .01 : .36;
        result.popped.forEach((i) => { const p = bubblePosition(i, phase); fx.burst(p.x, p.y, colors[current - 1], 7, 90); });
        falling = result.dropped.map((i) => ({ ...bubblePosition(i, phase), color: old[i], vx: (random() - .5) * 55, vy: 30 + random() * 40 })); if (reducedMotion()) falling = [];
        if (result.popped.length) {
            misses = 0; const points = result.popped.length * 10 + result.dropped.length * 25; score += points; s.sound(510 + Math.min(result.dropped.length, 6) * 45, .07);
            const p = bubblePosition(slot, phase); fx.label(p.x, p.y, `+${points}`, palette.green); s.message(`${result.popped.length}개 연결!${result.dropped.length ? ` 떠 있던 ${result.dropped.length}개도 떨어졌어요.` : ''}`);
        } else {
            misses++; s.sound(245, .04); s.message(`3개 이상 같은 색을 이으세요. ${5 - misses}번 더 빗맞히면 천장이 내려와요.`);
            if (misses === 5) {
                const pool = available(), row = Array.from({ length: 12 }, () => pool[Math.floor(random() * pool.length)]), descended = bubbleDescend(board, phase, row);
                board = descended.board; phase = descended.phase; misses = 0; descent = reducedMotion() ? 0 : Math.sqrt(3) * 18; s.message('천장이 한 줄 내려왔어요! 큰 묶음과 연결 고리를 노리세요.');
                if (descended.overflow) { end(false); return; }
            }
        }
        hud(); s.syncTools();
    };
    const shoot = () => {
        if (!s.active() || ball || busy > 0) return;
        ball = { x: 260, y: 548, vx: Math.cos(angle), vy: Math.sin(angle) }; shots++; s.changed(); s.sound(330, .035); s.syncTools(); hud();
    };
    const swap = () => { if (ball || busy > 0 || swapped) return; [current, next] = [next, current]; swapped = true; s.sound(400, .03); s.syncTools(); s.message('현재 색과 다음 색을 바꿨어요. 다음 발사 전까지 한 번만 교환할 수 있어요.'); };
    s.controls([{ label: '다음 색과 교환 · X', action: swap, disabled: () => !!ball || busy > 0 || swapped }]);
    s.bindKeys(['ArrowLeft', 'ArrowRight', 'Space', 'KeyX'], (code) => { if (code === 'Space') shoot(); if (code === 'KeyX') swap(); });
    const pointerAim = (event) => { const p = point(event); if (p.y < 515) aim = clamp(Math.atan2(p.y - 548, p.x - 260), -Math.PI + .22, -.22); };
    s.on(canvas, 'pointermove', (event) => { if (s.active() && !ball) pointerAim(event); });
    s.on(canvas, 'pointerdown', (event) => { if (!s.active() || event.button !== 0 || point(event).y >= 515) return; pointerAim(event); angle = aim; shoot(); });
    s.afterFinish((dt) => fx.update(dt));
    s.run((dt) => {
        fx.update(dt); descent = Math.max(0, descent - dt * 140); falling.forEach((p) => { p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }); falling = falling.filter((p) => p.y < 625);
        if (busy > 0) { busy = Math.max(0, busy - dt); if (busy < 1e-9) { busy = 0; finishTurn(); s.syncTools(); } return; }
        if (ball) { const trace = bubbleTrace(ball, dt * 850, board, phase); ball = trace; if (trace.contact) land(trace.slot); return; }
        const direction = Number(s.down('ArrowRight')) - Number(s.down('ArrowLeft'));
        if (direction) aim = clamp(aim + direction * dt * 1.65, -Math.PI + .22, -.22);
        angle += (aim - angle) * (1 - Math.exp(-dt * 22));
    }, () => {
        background(ctx, 520, 600, 26); ctx.strokeStyle = '#40556b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(35, 25); ctx.lineTo(35, 480); ctx.moveTo(485, 25); ctx.lineTo(485, 480); ctx.stroke();
        ctx.strokeStyle = '#ff8e7a66'; ctx.lineWidth = 1; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(36, 465); ctx.lineTo(484, 465); ctx.stroke(); ctx.setLineDash([]);
        const orb = (x, y, color, radius = 17) => { circle(ctx, x, y + 2, radius, '#09131a'); circle(ctx, x, y, radius, colors[color - 1]); circle(ctx, x - radius * .3, y - radius * .35, radius * .18, '#ffffff55'); text(ctx, symbols[color - 1], x, y + 1, radius * .85, '#17212b'); };
        ctx.save(); ctx.beginPath(); ctx.rect(35, 24, 450, 460); ctx.clip(); board.forEach((value, i) => { if (value) { const p = bubblePosition(i, phase); orb(p.x, p.y - descent, value); } }); ctx.restore();
        falling.forEach((p) => { ctx.globalAlpha = Math.min(1, (625 - p.y) / 100); orb(p.x, p.y, p.color); }); ctx.globalAlpha = 1;
        if (!ball && !busy && board.some(Boolean)) {
            const preview = bubbleTrace({ x: 260, y: 548, vx: Math.cos(angle), vy: Math.sin(angle) }, 3000, board, phase);
            ctx.strokeStyle = `${colors[current - 1]}66`; ctx.lineWidth = 1.5; ctx.setLineDash([3, 7]); ctx.beginPath(); preview.segments.forEach((part) => { ctx.moveTo(part.x1, part.y1); ctx.lineTo(part.x2, part.y2); }); ctx.stroke(); ctx.setLineDash([]);
            if (preview.slot >= 0) { const p = bubblePosition(preview.slot, phase); ctx.strokeStyle = colors[current - 1]; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 16, 0, Math.PI * 2); ctx.stroke(); }
        }
        circle(ctx, 260, 548, 27, '#243240'); if (ball) orb(ball.x, ball.y, current); else if (!busy) orb(260, 548, current);
        orb(365, 550, next, 12); text(ctx, 'NEXT · X', 365, 578, 10, palette.muted); text(ctx, `${swapped ? '교환 사용' : '색 교환 가능'}`, 145, 551, 11, palette.muted); fx.draw(ctx);
    });
    hud(); s.message('같은 색 3개를 이으면 터져요. 천장과 연결이 끊긴 묶음도 떨어져요. X로 다음 색과 교환하세요.');
    s.ready('버블 슈터', '마우스 또는 ← →로 조준하고 클릭 / Space로 발사하세요. 5번 연속 연결에 실패하면 천장이 내려와요. 점선 끝의 빈 원이 붙을 위치예요.', () => {});
};
