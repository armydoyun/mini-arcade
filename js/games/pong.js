import { clamp, circle, circleBox, background, text, palette, duelFinish, rounded } from '../core.js';
import { effects } from '../effects.js';

export default (s) => {
    const width = 640, height = 420, { ctx } = s.canvas(width, height), paddles = [165, 165], velocities = [0, 0], scores = [0, 0], trail = [], fx = effects(s), target = s.options.mode === 'long' ? 11 : 7; let ball, countdown = 1, rallies = 0, bestRally = 0, serves = 0;
    const serve = () => { const angle = (Math.random() < .5 ? -1 : 1) * (.18 + Math.random() * .3), direction = serves++ % 2 ? -1 : 1; ball = { x: width / 2, y: height / 2, vx: direction * Math.cos(angle) * 315, vy: Math.sin(angle) * 315 }; countdown = 1.05; rallies = 0; trail.length = 0; };
    const hud = () => s.hud([['P1 · W / S', scores[0], 'p1'], [`먼저 ${target}점`, `RALLY ${rallies}`], ['P2 · ↑ / ↓', scores[1], 'p2']]);
    s.bindKeys(['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown']); serve(); hud();
    s.run((dt) => {
        fx.update(dt); velocities[0] = ((s.down('KeyS') ? 1 : 0) - (s.down('KeyW') ? 1 : 0)) * 365; velocities[1] = ((s.down('ArrowDown') ? 1 : 0) - (s.down('ArrowUp') ? 1 : 0)) * 365; for (let side = 0; side < 2; side++) { const before = paddles[side]; paddles[side] = clamp(before + velocities[side] * dt, 6, height - 94); velocities[side] = dt > 0 ? (paddles[side] - before) / dt : 0; }
        if (countdown > 0) { countdown -= dt; return; } trail.push({ x: ball.x, y: ball.y }); if (trail.length > 12) trail.shift();
        const steps = Math.max(1, Math.ceil(Math.hypot(ball.vx, ball.vy) * dt / 4));
        for (let n = 0; n < steps; n++) {
            ball.x += ball.vx * dt / steps; ball.y += ball.vy * dt / steps; if (ball.y < 7 || ball.y > height - 7) { ball.y = clamp(ball.y, 7, height - 7); ball.vy *= -1; }
            for (let side = 0; side < 2; side++) {
                const x = side === 0 ? 26 : width - 37, box = { x, y: paddles[side], w: 11, h: 88 };
                if ((side === 0 ? ball.vx < 0 : ball.vx > 0) && circleBox(ball, 7, box)) {
                    const angle = clamp((ball.y - paddles[side] - 44) / 48, -1, 1) * 1.05, speed = Math.min(660, Math.hypot(ball.vx, ball.vy) * 1.04 + 5);
                    ball.vy = clamp(Math.sin(angle) * speed + velocities[side] * .18, -speed * .9, speed * .9);
                    if (Math.abs(ball.vy) < 40) ball.vy = ball.vy < 0 ? -40 : 40;
                    ball.vx = Math.sqrt(speed * speed - ball.vy * ball.vy) * (side === 0 ? 1 : -1);
                    ball.x = side === 0 ? x + 19 : x - 8;
                    rallies++;
                    bestRally = Math.max(bestRally, rallies);
                    fx.burst(ball.x, ball.y, side === 0 ? palette.coral : palette.blue, 7, 60);
                    s.sound(side === 0 ? 400 : 530, .035);
                    hud();
                }
                }
            if (ball.x < -12 || ball.x > width + 12) { const winner = ball.x < 0 ? 1 : 0; scores[winner]++; fx.label(width / 2, 100, `P${winner + 1} +1`, winner === 0 ? palette.coral : palette.blue); hud(); if (scores[winner] === target) { duelFinish(s, winner + 1, `P1 ${scores[0]} : ${scores[1]} P2 · 최장 랠리 ${bestRally}회`); return; } serve(); hud(); s.message(`P${winner + 1} 득점! 패들을 움직이며 맞히면 공에 회전이 실려요.`); break; }
        }
    }, () => {
        background(ctx, width, height);
        ctx.strokeStyle = '#435064';
        ctx.setLineDash([5, 10]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 45, 0, Math.PI * 2);
        ctx.stroke();
        rounded(ctx, 26, paddles[0], 11, 88, palette.coral, 5);
        rounded(ctx, width - 37, paddles[1], 11, 88, palette.blue, 5);
        trail.forEach((p, i) => {
            ctx.globalAlpha = i / trail.length * .22;
            circle(ctx, p.x, p.y, 6 * i / trail.length, palette.ink);
        });
        ctx.globalAlpha = 1;
        circle(ctx, ball.x, ball.y, 7, palette.ink);
        if (countdown > 0) {
            text(ctx, 'SERVE', width / 2, height / 2 - 65, 16, palette.muted);
            rounded(ctx, width / 2 - 35, height / 2 - 44, 70 * Math.max(0, 1 - countdown / 1.05), 3, palette.blue, 1);
        }
        fx.draw(ctx);
    }); s.message('P1 W/S · P2 ↑/↓ · 패들을 움직이며 공을 치면 진행 각도에 스핀이 더해져요.'); s.ready('Pong', `두 사람 모두 준비됐나요? 먼저 ${target}점을 얻으면 승리해요. 패들 끝과 이동 방향을 활용하세요.`);
};
