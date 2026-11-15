import { background, circle, rounded, text, palette, clamp } from '../core.js';
import { golfStep } from '../rules.js';
import { golfCourses } from '../puzzles.js';
import { effects } from '../effects.js';

export default (s) => {
    const { canvas, ctx, point } = s.canvas(600, 400), fx = effects(s), count = s.options.mode === 'duel' ? 2 : 1, colors = [palette.coral, palette.blue];
    let hole = 0, turn = 0, totals = Array(count).fill(0), balls = [], moving = false, delay = 0, angle = 0, power = .75, drag = null, beforeDrag = null, hudKey = '', completed = false;
    const course = () => golfCourses[hole], ball = () => balls[turn];
    const hud = () => {
        const key = `${hole}:${turn}:${totals}:${balls.map((b) => `${b.strokes}:${b.done}`)}:${Math.round(power * 100)}:${moving}`; if (key === hudKey) return; hudKey = key;
        const total = (p) => totals[p] + (completed ? 0 : balls[p].strokes);
        s.hud([['HOLE / PAR', `${hole + 1} / 9 · PAR ${course().par}`], [count === 2 ? `P${turn + 1} 차례` : '이번 홀 / 누적', `${ball().strokes}타 · 총 ${total(turn)}타`, count === 2 ? `p${turn + 1}` : ''], ['힘 · ↑ ↓', `${Math.round(power * 100)}%`], [count === 2 ? 'P1 / P2 누적' : '코스', count === 2 ? `${total(0)} / ${total(1)}` : course().name]]);
    };
    const reset = () => {
        balls = Array.from({ length: count }, () => ({ x: course().start[0], y: course().start[1], vx: 0, vy: 0, strokes: 0, done: false, origin: [...course().start], trail: [], sinking: 0 }));
        turn = hole % count; moving = false; completed = false; delay = 0; angle = Math.atan2(course().hole[1] - ball().y, course().hole[0] - ball().x); power = .75; hudKey = ''; hud();
        s.message(count === 2 ? '각자 독립된 공으로 번갈아 쳐요. 홀을 먼저 마친 사람은 기다려요. 총 타수가 적으면 승리!' : '공을 뒤로 당겨 놓으세요. ← → 각도 · ↑ ↓ 힘 · Space 발사. 물에 빠지면 1벌타예요.');
    };
    const nextTurn = () => {
        const b = ball(); moving = false; delay = 0; b.trail = [];
        if (b.strokes >= 12 && !b.done) { b.done = true; b.x = course().hole[0]; b.y = course().hole[1]; s.message(`P${turn + 1} 이번 홀은 상한인 12타로 마쳤어요.`); }
        if (balls.every((p) => p.done)) {
            completed = true; balls.forEach((p, i) => { totals[i] += p.strokes; }); hud();
            if (hole === golfCourses.length - 1) {
                const winner = count === 2 ? totals[0] === totals[1] ? 0 : totals[0] < totals[1] ? 1 : 2 : undefined;
                s.finish({ score: totals[0], winner, order: 'low', recordText: `${totals[0]}타 · 9홀`, title: count === 1 ? '9홀 라운드 완료!' : winner ? `P${winner} 골프 승리!` : '공동 우승!', text: count === 1 ? `${totals[0]}타 · 기준 PAR ${golfCourses.reduce((sum, item) => sum + item.par, 0)} · 수고했어요!` : `P1 ${totals[0]}타 : P2 ${totals[1]}타 · 낮은 타수가 승리해요.` }); return;
            }
            s.ready(`${hole + 1}번 홀 완료`, `${count === 2 ? `P1 ${balls[0].strokes}타 · P2 ${balls[1].strokes}타` : `${balls[0].strokes}타`} / PAR ${course().par} · 다음은 ${golfCourses[hole + 1].name}`, () => { hole++; reset(); }); return;
        }
        if (count === 2 && !balls[1 - turn].done) turn = 1 - turn;
        angle = Math.atan2(course().hole[1] - ball().y, course().hole[0] - ball().x); s.releaseKeys(); hud(); s.message(`P${turn + 1} 차례 · ${ball().strokes + 1}번째 샷을 준비하세요.`);
    };
    const shoot = (direction = angle, force = power) => {
        if (!s.active() || moving || completed || ball().done || force < .04) return;
        const b = ball(); b.origin = [b.x, b.y]; b.strokes++; b.vx = Math.cos(direction) * force * 620; b.vy = Math.sin(direction) * force * 620; b.trail = []; moving = true; s.changed(); s.sound(260 + force * 180, .045); hud();
    };
    const pickup = () => { if (!moving && !completed && !ball().done) { ball().strokes = 12; ball().done = true; ball().x = course().hole[0]; ball().y = course().hole[1]; s.changed(); nextTurn(); } };
    s.controls([{ label: '이번 홀 12타로 마무리', action: pickup, disabled: () => moving || completed }]);
    s.bindKeys(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'], (code) => { if (code === 'Space') shoot(); });
    const dragPower = (p) => { const dx = ball().x - p.x, dy = ball().y - p.y; angle = Math.atan2(dy, dx); power = clamp(Math.hypot(dx, dy) / 120, 0, 1); hud(); };
    s.on(canvas, 'pointerdown', (event) => {
        if (!s.active() || moving || completed || event.button !== 0) return; const p = point(event);
        if (Math.hypot(p.x - ball().x, p.y - ball().y) > 26) { s.message('공을 잡고 반대 방향으로 당긴 뒤 놓으세요. 키보드로도 조준할 수 있어요.'); return; }
        beforeDrag = [angle, power]; drag = event.pointerId; canvas.setPointerCapture(event.pointerId); dragPower(p);
    });
    s.on(canvas, 'pointermove', (event) => { if (drag === event.pointerId && s.active()) dragPower(point(event)); });
    s.on(canvas, 'pointerup', (event) => { if (drag !== event.pointerId) return; drag = null; if (s.active() && power >= .04) shoot(); else { [angle, power] = beforeDrag; hud(); } });
    const cancelDrag = () => { if (drag !== null) { drag = null; [angle, power] = beforeDrag; hud(); } };
    s.on(canvas, 'pointercancel', cancelDrag); s.on(canvas, 'lostpointercapture', cancelDrag); s.on(s.root, 'gamepause', cancelDrag);
    s.afterFinish((dt) => fx.update(dt)); reset();
    s.run((dt) => {
        fx.update(dt);
        if (delay > 0) { delay = Math.max(0, delay - dt); balls.forEach((b) => { b.sinking = Math.max(0, b.sinking - dt); }); if (delay < 1e-9) nextTurn(); return; }
        if (!moving) {
            if (drag === null) { angle += (Number(s.down('ArrowRight')) - Number(s.down('ArrowLeft'))) * dt * 1.7; power = clamp(power + (Number(s.down('ArrowUp')) - Number(s.down('ArrowDown'))) * dt * .5, .04, 1); hud(); } return;
        }
        const b = ball(), next = golfStep(b, dt, course());
        if (b.vx * next.vx < 0 || b.vy * next.vy < 0) { fx.burst(next.x, next.y, '#d9eac8', 3, 35); s.sound(220, .025); }
        Object.assign(b, next); b.trail.push({ x: b.x, y: b.y }); b.trail = b.trail.slice(-12);
        if (next.status === 'hole') {
            b.done = true; b.x = course().hole[0]; b.y = course().hole[1]; b.sinking = .4; delay = .5; fx.burst(b.x, b.y, palette.green, 22, 105); fx.label(b.x, b.y - 18, b.strokes === 1 ? 'HOLE IN ONE!' : b.strokes < course().par ? 'BIRDIE!' : b.strokes === course().par ? 'PAR' : `${b.strokes} STROKES`, palette.green); s.sound(700, .1);
        } else if (next.status === 'water') {
            fx.burst(b.x, b.y, palette.blue, 15, 75); b.strokes = Math.min(12, b.strokes + 1); [b.x, b.y] = b.origin; b.trail = []; delay = .6; s.sound(150, .08); s.message('물에 빠져 1벌타! 이번 샷의 출발 위치로 돌아왔어요.');
        } else if (next.status === 'rest') { delay = .16; } hud();
    }, () => {
        background(ctx, 600, 400, 24); rounded(ctx, 18, 18, 564, 364, '#20372e', 12);
        ctx.strokeStyle = '#accb9433'; ctx.lineWidth = 1; ctx.strokeRect(25, 25, 550, 350);
        for (const water of course().water) { rounded(ctx, water.x, water.y, water.w, water.h, '#315d78', 7); ctx.strokeStyle = '#82b6ff66'; ctx.lineWidth = 1; for (let y = water.y + 15; y < water.y + water.h; y += 19) { ctx.beginPath(); ctx.moveTo(water.x + 10, y); ctx.lineTo(water.x + water.w - 10, y); ctx.stroke(); } }
        for (const wall of course().walls) { rounded(ctx, wall.x, wall.y + 3, wall.w, wall.h, '#0e201b', 3); rounded(ctx, wall.x, wall.y, wall.w, wall.h, '#6c8477', 3); }
        const [hx, hy] = course().hole; circle(ctx, hx, hy, 13, '#b9f86b30'); circle(ctx, hx, hy, 9, '#0b1713'); ctx.strokeStyle = palette.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx + 1, hy); ctx.lineTo(hx + 1, hy - 40); ctx.stroke(); ctx.fillStyle = palette.green; ctx.beginPath(); ctx.moveTo(hx + 2, hy - 40); ctx.lineTo(hx + 22, hy - 33); ctx.lineTo(hx + 2, hy - 27); ctx.closePath(); ctx.fill();
        text(ctx, `HOLE ${String(hole + 1).padStart(2, '0')} / ${course().name}`, 300, 43, 12, '#abc5b7');
        [...balls.keys()].sort((a, b) => Number(a === turn) - Number(b === turn)).forEach((i) => {
            const b = balls[i];
            if (b.done && !b.sinking) return;
            b.trail.forEach((p, j) => { ctx.globalAlpha = j / b.trail.length * .2; circle(ctx, p.x, p.y, 3, colors[i]); }); ctx.globalAlpha = 1;
            const radius = b.sinking ? Math.max(1, b.sinking / .4 * 7) : 7; circle(ctx, b.x + 1, b.y + 2, radius + 1, '#081c1480'); circle(ctx, b.x, b.y, radius, count === 1 ? palette.ink : colors[i]); circle(ctx, b.x - 2, b.y - 2, radius * .27, '#ffffff88');
            if (count === 2 && !b.done) text(ctx, `P${i + 1}`, b.x, b.y + (i ? 23 : -20), 10, colors[i]);
        });
        if (!moving && !completed) {
            const b = ball(), color = count === 1 ? palette.green : colors[turn], length = 30 + power * 88;
            ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(angle) * length, b.y + Math.sin(angle) * length); ctx.stroke(); ctx.setLineDash([]);
            ctx.beginPath(); ctx.arc(b.x, b.y, 12, -.5, Math.PI * 2 - .5); ctx.stroke();
            if (drag !== null) { ctx.strokeStyle = '#edf0f466'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - Math.cos(angle) * power * 120, b.y - Math.sin(angle) * power * 120); ctx.stroke(); }
            rounded(ctx, 233, 354, 134, 7, '#10291e', 3); rounded(ctx, 235, 356, power * 130, 3, color, 1); text(ctx, '당겨서 놓기 / Space', 300, 335, 11, '#b4c9bc');
        }
        fx.draw(ctx);
    });
    s.ready(count === 2 ? '미니 골프 · 둘이서' : '미니 골프 · 혼자서', `9개의 짧은 코스, 총 타수가 적을수록 좋아요. ${count === 2 ? '샷마다 번갈아 치며 공은 서로 부딪히지 않아요. ' : ''}물은 1벌타, 홀당 최대 12타예요. PAR는 코스의 기준 타수예요.`, () => {});
};
