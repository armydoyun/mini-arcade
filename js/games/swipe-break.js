import { random, clamp, background, circle, circleBox, text, palette, rounded, distance } from '../core.js';
import { effects } from '../effects.js';

export const aimPath = (origin, angle, blocks, width = 500, floor = 548) => {
    const points = [{ x: origin, y: floor - 6 }]; let x = origin, y = floor - 6, dx = Math.cos(angle), dy = Math.sin(angle);
    for (let bounce = 0; bounce < 3; bounce++) {
        const tx = dx > 1e-8 ? (width - 5 - x) / dx : dx < -1e-8 ? (5 - x) / dx : Infinity, ty = dy < -1e-8 ? (5 - y) / dy : dy > 1e-8 ? (floor - y) / dy : Infinity; let travel = Math.min(tx, ty), hit = false;
        for (const block of blocks) if (block.hp && !block.orb) {
            const xs = Math.abs(dx) < 1e-8 ? (x < block.x - 5 || x > block.x + block.w + 5 ? [Infinity, -Infinity] : [-Infinity, Infinity]) : [(block.x - 5 - x) / dx, (block.x + block.w + 5 - x) / dx].sort((a, b) => a - b), ys = Math.abs(dy) < 1e-8 ? (y < block.y - 5 || y > block.y + block.h + 5 ? [Infinity, -Infinity] : [-Infinity, Infinity]) : [(block.y - 5 - y) / dy, (block.y + block.h + 5 - y) / dy].sort((a, b) => a - b), near = Math.max(xs[0], ys[0]), far = Math.min(xs[1], ys[1]);
            if (near > .01 && near <= far && near < travel) {
                travel = near;
                hit = true;
            }
            }
        x += dx * travel; y += dy * travel; points.push({ x, y }); if (hit || (ty <= tx && dy > 0)) break; if (tx < ty) dx *= -1; else dy *= -1; x += dx * .02; y += dy * .02;
    }
    return points;
};
export default (s) => {
    const width = 500, height = 580, floor = 548, { ctx, canvas, point } = s.canvas(width, height), blocks = [], balls = [], fx = effects(s); let origin = 250, angle = -Math.PI / 2, firing = false, remaining = 0, delay = 0, round = 1, count = 5, score = 0, landing = null, shotTime = 0, aiming = false, fast = false;
    const row = (y) => { const orbColumn = random(0, 6); for (let column = 0; column < 7; column++) if (column === orbColumn || Math.random() < .58) blocks.push({ x: 13 + column * 68, y, w: 62, h: 50, hp: column === orbColumn ? 1 : random(round + 1, round + 4), orb: column === orbColumn, flash: 0 }); };
    row(45); row(103);
    const hud = () => s.hud([['SCORE', score], ['공', count], ['ROUND', round], ['속도', fast ? '3×' : '1×']]);
    const nextRound = () => { firing = false; origin = clamp(landing ?? origin, 9, width - 9); landing = null; round++; blocks.forEach((block) => { block.y += 58; }); if (blocks.some((block) => !block.orb && block.y + block.h >= floor - 6)) { hud(); s.finish({ score, win: false, title: '다음 각도를 찾아봐요!', text: `${round - 1}라운드 · ${score}점 · 공 ${count}개` }); return; } row(45); hud(); s.message('첫 번째로 돌아온 공의 위치에서 다음 턴을 발사해요. 반사 가이드로 조준하세요.'); };
    const shoot = () => { if (firing) { fast = !fast; hud(); return; } firing = true; remaining = count; delay = 0; shotTime = 0; landing = null; hud(); s.message('Space로 1배/3배 속도 전환 · C 공 회수 · NEXT는 다음 발사 위치예요.'); };
    const recall = () => { if (firing) { remaining = 0; balls.length = 0; nextRound(); } };
    s.bindKeys(['ArrowLeft', 'ArrowRight', 'Space', 'KeyC'], (code) => { if (code === 'Space') shoot(); else if (code === 'KeyC') recall(); }); s.controls([{ label: '공 회수 · C', action: recall, disabled: () => !firing }]);
    const aim = (event) => { const p = point(event); if (p.y < floor - 12) angle = clamp(Math.atan2(p.y - floor, p.x - origin), -Math.PI + .16, -.16); };
    s.on(canvas, 'pointerdown', (event) => { if (s.active() && !firing) { aiming = true; canvas.setPointerCapture(event.pointerId); aim(event); } }); s.on(canvas, 'pointermove', (event) => { if (aiming && s.active() && !firing) aim(event); }); s.on(canvas, 'pointerup', (event) => { if (!aiming) return; aiming = false; if (s.active() && point(event).y < floor - 12) { aim(event); shoot(); } }); s.on(canvas, 'pointercancel', () => { aiming = false; }); s.on(s.root, 'gamepause', () => { aiming = false; });
    s.run((dt) => {
        fx.update(dt); blocks.forEach((block) => { block.flash = Math.max(0, block.flash - dt); }); if (!firing) { angle = clamp(angle + ((s.down('ArrowRight') ? 1 : 0) - (s.down('ArrowLeft') ? 1 : 0)) * dt, -Math.PI + .16, -.16); return; }
        const simulated = dt * (fast ? 3 : 1); shotTime += simulated; delay -= simulated;
        while (remaining > 0 && delay <= 0) { balls.push({ x: origin, y: floor - 6, vx: Math.cos(angle) * 450, vy: Math.sin(angle) * 450 }); remaining--; delay += .075; }
        const steps = Math.max(1, Math.ceil(simulated * 180));
        for (let step = 0; step < steps; step++) for (let i = balls.length - 1; i >= 0; i--) {
            const ball = balls[i]; ball.x += ball.vx * simulated / steps; ball.y += ball.vy * simulated / steps;
            if (ball.x < 5 || ball.x > width - 5) { ball.vx *= -1; ball.x = clamp(ball.x, 5, width - 5); } if (ball.y < 5) { ball.vy = Math.abs(ball.vy); ball.y = 5; }
            for (const block of blocks) if (block.hp) {
                if (block.orb) { if (distance(ball, { x: block.x + 31, y: block.y + 25 }) < 18) { block.hp = 0; count++; fx.burst(block.x + 31, block.y + 25, palette.green); s.sound(680, .025); } continue; }
                const hit = circleBox(ball, 5, block); if (!hit) continue; block.hp--; block.flash = .08; score += block.hp ? 1 : 11; const dot = ball.vx * hit.x + ball.vy * hit.y; if (dot < 0) { ball.vx -= 2 * dot * hit.x; ball.vy -= 2 * dot * hit.y; } ball.x += hit.x * (hit.depth + .1); ball.y += hit.y * (hit.depth + .1); if (!block.hp) fx.burst(block.x + 31, block.y + 25, palette.yellow, 8, 70); break;
            }
            if (ball.y >= floor && ball.vy > 0) { landing ??= ball.x; balls.splice(i, 1); }
        }
        for (let i = blocks.length - 1; i >= 0; i--) if (!blocks[i].hp || (blocks[i].orb && blocks[i].y > floor)) blocks.splice(i, 1);
        if (shotTime > 22) { balls.length = 0; remaining = 0; } hud(); if (!balls.length && !remaining) nextRound();
    }, () => {
        background(ctx, width, height); ctx.strokeStyle = '#8d626e'; ctx.setLineDash([4, 7]); ctx.beginPath(); ctx.moveTo(0, floor - 8); ctx.lineTo(width, floor - 8); ctx.stroke(); ctx.setLineDash([]);
        blocks.forEach((block) => { if (block.orb) { circle(ctx, block.x + 31, block.y + 25, 15, '#b9f86b20'); circle(ctx, block.x + 31, block.y + 25, 11, palette.green); text(ctx, '+', block.x + 31, block.y + 24, 20, '#20321a'); } else { rounded(ctx, block.x, block.y, block.w, block.h, block.flash > 0 ? '#f4f1ce' : `hsl(${35 + Math.min(20, block.hp) * 8} 48% 61%)`, 5); text(ctx, block.hp, block.x + 31, block.y + 25, 20, '#18212c'); } });
        balls.forEach((ball) => circle(ctx, ball.x, ball.y, 4.5, palette.ink)); circle(ctx, origin, floor, 7, palette.ink);
        if (landing !== null) { circle(ctx, landing, floor, 9, '#b9f86b44'); text(ctx, 'NEXT', clamp(landing, 25, 475), floor + 18, 10, palette.green); }
        if (!firing) { const points = aimPath(origin, angle, blocks); ctx.strokeStyle = '#edf4ff88'; ctx.setLineDash([3, 7]); ctx.lineWidth = 1.5; ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.setLineDash([]); const end = points.at(-1); circle(ctx, end.x, end.y, 5, '#eef4ff88'); text(ctx, `×${count}`, clamp(origin + 27, 30, 470), floor + 18, 13, palette.muted); } fx.draw(ctx);
    }); hud(); s.message('마우스로 드래그해 조준 · ← → + Space 발사 · 발사 중 Space 3배속 · C 회수.'); s.ready('스와이프 벽돌깨기', '벽 반사를 읽고 + 공을 모으세요. 첫 번째 귀환 위치가 다음 턴의 시작점이 돼요.');
};
