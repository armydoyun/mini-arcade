import { background, circle, circleBox, clamp, rounded, palette } from '../core.js';
import { effects } from '../effects.js';

export default (s) => {
    const width = 540, height = 430, { ctx, canvas } = s.canvas(width, height), pipes = [], trail = [], fx = effects(s), calm = s.options.mode === 'calm'; let y = 205, vy = 0, timer = 1.2, score = 0, previousGap = 215, scroll = 0;
    // 원경: 느리게 흐르는 구름과 언덕(시차 스크롤)으로 속도감을 준다. 판정과는 무관하다.
    const clouds = Array.from({ length: 6 }, (_, i) => ({ x: i * 110 + Math.random() * 60, y: 30 + Math.random() * 150, r: 14 + Math.random() * 12 }));
    const hills = (offset, base, amp, color, period) => { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, height); for (let x = 0; x <= width; x += 10) ctx.lineTo(x, base - Math.sin((x + offset) / period) * amp - Math.sin((x + offset) / (period * .43)) * amp * .35); ctx.lineTo(width, height); ctx.fill(); };
    const flap = () => { vy = calm ? -270 : -285; s.sound(490, .035); fx.burst(113, y + 7, palette.yellow, 3, 35); };
    s.bindKeys(['Space', 'ArrowUp'], flap); s.on(canvas, 'pointerdown', () => { if (s.active()) flap(); });
    const lose = () => { fx.shake(8); fx.flash(palette.coral); s.sound(150, .2); } , end = () => s.finish({ score, recordText: `${score}개 통과`, win: false, title: '다음 틈은 통과할 수 있어요!', text: `${score}개 통과 · ${Math.round(s.elapsed())}초 비행` });
    s.run((dt) => {
        fx.update(dt); vy += (calm ? 730 : 820) * dt; y += vy * dt; timer -= dt; scroll += ((calm ? 125 : 145) + Math.min(score, 30) * 1.1) * dt; const speed = (calm ? 125 : 145) + Math.min(score, 30) * 1.1, halfGap = calm ? 97 : Math.max(72, 86 - score * .25);
        if (timer <= 0) { previousGap = clamp(previousGap + (Math.random() * 2 - 1) * 82, halfGap + 35, height - halfGap - 35); pipes.push({ x: width + 20, gap: previousGap, half: halfGap, scored: false }); timer = 255 / speed; }
        for (const pipe of pipes) {
            pipe.x -= speed * dt; if (!pipe.scored && pipe.x + 52 < 113) {
                pipe.scored = true; score++; fx.label(125, y - 20, '+1', palette.green); fx.ring(pipe.x + 26, pipe.gap, '#b9f86b', 40, .35); if (score % 10 === 0) { fx.label(width / 2, 70, `${score}개 통과!`, palette.yellow); fx.burst(width / 2, 70, palette.yellow, 18, 120); } s.hud([['통과', score], ['속도', `${Math.round(speed)} px/s`]]); s.sound(690, .055); }
            if (circleBox({ x: 125, y }, 10, { x: pipe.x - 3, y: 0, w: 58, h: pipe.gap - pipe.half }) || circleBox({ x: 125, y }, 10, { x: pipe.x - 3, y: pipe.gap + pipe.half, w: 58, h: height })) { fx.burst(125, y, palette.coral, 24, 140); lose(); end(); return; }
        }
        if (pipes[0]?.x < -65) pipes.shift(); trail.push({ x: 125, y }); trail.forEach((p) => { p.x -= speed * dt; }); if (trail.length > 14) trail.shift(); if (y < 10 || y > height - 10) { fx.burst(125, y, palette.coral, 24, 140); lose(); end(); }
    }, () => {
        background(ctx, width, height); for (const c of clouds) { const x = ((c.x - scroll * .15) % (width + 120) + width + 120) % (width + 120) - 60; ctx.globalAlpha = .1; circle(ctx, x, c.y, c.r, '#dfe9f5'); circle(ctx, x + c.r * .9, c.y + 4, c.r * .75, '#dfe9f5'); circle(ctx, x - c.r * .9, c.y + 5, c.r * .65, '#dfe9f5'); } ctx.globalAlpha = 1; hills(scroll * .25, height - 70, 26, '#1d2a2f', 90); hills(scroll * .5, height - 40, 18, '#22343a', 60); ctx.fillStyle = '#263b3a'; ctx.fillRect(0, height - 7, width, 7); for (let x = -(s.time * 50) % 40; x < width; x += 40) { ctx.fillStyle = '#4f6854'; ctx.fillRect(x, height - 6, 20, 2); }
        pipes.forEach((pipe) => { rounded(ctx, pipe.x, -12, 52, pipe.gap - pipe.half + 12, '#456c4c', 4); rounded(ctx, pipe.x, pipe.gap + pipe.half, 52, height, '#456c4c', 4); ctx.fillStyle = '#719a60'; ctx.fillRect(pipe.x + 6, 0, 5, pipe.gap - pipe.half); ctx.fillRect(pipe.x + 6, pipe.gap + pipe.half, 5, height); rounded(ctx, pipe.x - 3, pipe.gap - pipe.half - 9, 58, 9, palette.green, 3); rounded(ctx, pipe.x - 3, pipe.gap + pipe.half, 58, 9, palette.green, 3); });
        trail.forEach((p, i) => { ctx.globalAlpha = i / trail.length * .12; circle(ctx, p.x, p.y, 9, palette.yellow); }); ctx.globalAlpha = 1; ctx.save(); ctx.translate(125, y); ctx.rotate(clamp(vy / 650, -.45, .9)); circle(ctx, 0, 0, 13, palette.yellow); circle(ctx, -5, 4 + Math.sin(s.time * 22) * 2, 6, '#d19c57'); circle(ctx, 5, -4, 3.5, '#f8f6e8'); circle(ctx, 6, -4, 1.7, '#17212b'); ctx.fillStyle = palette.coral; ctx.beginPath(); ctx.moveTo(11, -1); ctx.lineTo(21, 3); ctx.lineTo(11, 6); ctx.fill(); ctx.restore(); fx.draw(ctx);
    }); s.hud([['통과', 0], ['모드', calm ? '넓은 틈' : '클래식']]); s.message('Space / ↑ / 클릭으로 날갯짓 · 기둥 사이 높이는 급격하게 바뀌지 않아요.'); s.ready('플래피', '기둥 사이를 통과하세요. 몸통보다 조금 작은 판정으로 아슬아슬한 비행을 받아줘요.', flap);
};
