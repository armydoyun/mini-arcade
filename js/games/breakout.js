import { clamp, circle, circleBox, background, palette, text, rounded, wobble } from '../core.js';
import { effects } from '../effects.js';

export default (s) => {
    const width = 600, height = 440, { ctx, canvas, point } = s.canvas(width, height), fx = effects(s), drops = [], trail = [];
    const precise = s.options.mode === 'precision'; let paddle = 250, paddleWidth = precise ? 76 : 100, lives = precise ? 1 : 3, score = 0, level = 1, attached = true, bricks = [], ball, wideTime = 0, fireTime = 0, combo = 0; const debris = []; let paddleAge = 9, ballAge = 9;
    const hud = () => s.hud([['SCORE', score], ['LIVES', '♥'.repeat(lives)], ['LEVEL', level]]);
    const makeLevel = () => { bricks = []; for (let y = 0; y < 5; y++) for (let x = 0; x < 8; x++) if (level % 3 === 1 || (level % 3 === 2 ? (x + y) % 3 !== 0 : Math.abs(x - 3.5) + Math.abs(y - 2) < 5)) bricks.push({ x: 26 + x * 69, y: 38 + y * 26, w: 62, h: 18, hp: Math.min(3, 1 + (y === 0 ? 1 : 0) + Math.floor((level - 1) / 5)), row: y }); };
    const reset = () => { attached = true; combo = 0; trail.length = 0; ball = { x: paddle + paddleWidth / 2, y: 384, vx: 145, vy: -270 }; };
    const launch = () => { if (attached) { attached = false; s.sound(420, .04); } };
    s.bindKeys(['ArrowLeft', 'ArrowRight', 'Space'], (code) => { if (code === 'Space') launch(); });
    s.on(canvas, 'pointermove', (event) => { if (s.active()) paddle = clamp(point(event).x - paddleWidth / 2, 0, width - paddleWidth); }); s.on(canvas, 'pointerdown', (event) => { if (s.active()) { canvas.setPointerCapture(event.pointerId); paddle = clamp(point(event).x - paddleWidth / 2, 0, width - paddleWidth); launch(); } }); makeLevel(); reset(); hud();
    s.run((dt) => {
        fx.update(dt); paddleAge += dt; ballAge += dt; for (const brick of bricks) if (brick.age !== undefined) brick.age += dt; wideTime = Math.max(0, wideTime - dt); fireTime = Math.max(0, fireTime - dt); for (let i = debris.length - 1; i >= 0; i--) if ((debris[i].age += dt) > .22) debris.splice(i, 1); paddleWidth = wideTime > 0 ? 145 : precise ? 76 : 100;
        paddle = clamp(paddle + ((s.down('ArrowRight') ? 1 : 0) - (s.down('ArrowLeft') ? 1 : 0)) * 450 * dt, 0, width - paddleWidth);
        for (let i = drops.length - 1; i >= 0; i--) { const drop = drops[i]; drop.y += 100 * dt; if (drop.y >= 386 && drop.y < 414 && drop.x >= paddle && drop.x <= paddle + paddleWidth) { if (drop.type === 'wide') wideTime = 14; else if (drop.type === 'fire') fireTime = 6; else lives = Math.min(4, lives + 1); fx.label(drop.x, 372, drop.type === 'wide' ? 'WIDE 14s' : drop.type === 'fire' ? '관통 6s' : '+1 LIFE', drop.type === 'fire' ? palette.coral : palette.green);  s.sound(760, .07); drops.splice(i, 1); hud(); } else if (drop.y > height + 20) drops.splice(i, 1); }
        if (attached) { ball.x = paddle + paddleWidth / 2; ball.y = 384; return; }
        trail.push({ x: ball.x, y: ball.y }); if (trail.length > 10) trail.shift();
        const steps = Math.max(1, Math.ceil(Math.hypot(ball.vx, ball.vy) * dt / 4));
        for (let n = 0; n < steps; n++) {
            ball.x += ball.vx * dt / steps; ball.y += ball.vy * dt / steps;
            if (ball.x < 7 || ball.x > width - 7) { ball.vx *= -1; ballAge = 0; ball.x = clamp(ball.x, 7, width - 7); } if (ball.y < 7) { ball.vy = Math.abs(ball.vy); ball.y = 7; ballAge = 0; }
            if (ball.vy > 0 && circleBox(ball, 7, { x: paddle, y: 395, w: paddleWidth, h: 10 })) { const angle = clamp((ball.x - paddle - paddleWidth / 2) / (paddleWidth / 2 + 5), -1, 1) * 1.1, speed = Math.min(510, 315 + level * 17); ball.vx = Math.sin(angle) * speed; ball.vy = -Math.cos(angle) * speed; ball.y = 387; combo = 0; paddleAge = 0; ballAge = 0; s.sound(340, .035); fx.burst(ball.x, 395, palette.blue, 5, 45); }
            for (const brick of bricks) if (brick.hp) {
                const hit = circleBox(ball, 7, brick);
                if (!hit) continue;
                // 관통 공은 벽돌을 한 번에 부수고 튕기지 않고 뚫고 지나간다.
                if (fireTime > 0) brick.hp = 0; else brick.hp--; brick.age = 0; ballAge = 0;
                const dot = ball.vx * hit.x + ball.vy * hit.y;
                if (dot < 0 && !fireTime) {
                    ball.vx -= 2 * dot * hit.x;
                    ball.vy -= 2 * dot * hit.y;
                }
                if (!fireTime) { ball.x += hit.x * (hit.depth + .1); ball.y += hit.y * (hit.depth + .1); }
                const gain = brick.hp ? 5 : 10 * Math.min(5, ++combo);
                score += gain;
                fx.burst(ball.x, ball.y, [palette.purple, palette.blue, palette.green, palette.yellow, palette.coral][brick.row], brick.hp ? 5 : 13);
                // 깨진 벽돌은 제자리에서 0.22초 동안 작아지며 사라진다.
                if (!brick.hp) debris.push({ x: brick.x, y: brick.y, w: brick.w, h: brick.h, age: 0, color: [palette.purple, palette.blue, palette.green, palette.yellow, palette.coral][brick.row] });
                if (!brick.hp && Math.random() < .16) { const roll = Math.random(); drops.push({ x: brick.x + 31, y: brick.y + 9, type: !precise && lives < 3 && roll < .22 ? 'life' : roll > .7 ? 'fire' : 'wide' }); }
                if (!brick.hp && combo >= 3) fx.label(brick.x + 31, brick.y, `×${Math.min(5, combo)}`);
                s.sound(440 + combo * 35, .025);
                hud();
                if (!fireTime) break;
            }
            if (ball.y > height + 12) { lives--; fx.shake(6); hud(); if (!lives) { s.finish({ score, win: false, title: '좋은 반사였어요!', text: `${score}점 · ${level}스테이지 · 패들 끝으로 각도를 바꿔 보세요.` }); return; } reset(); s.message('공을 다시 발사하세요. Space 또는 클릭!'); break; }
        }
        if (bricks.every((brick) => !brick.hp)) { score += 250; level++; if (level % 3 === 1 && !precise) lives = Math.min(4, lives + 1); drops.length = 0; fireTime = 0; makeLevel(); reset(); hud(); s.message(`LEVEL ${level} · 다른 벽돌 배치가 기다려요. Space로 시작하세요.`); }
    }, () => {
        background(ctx, width, height); bricks.forEach((brick) => { if (!brick.hp) return; const color = [palette.purple, palette.blue, palette.green, palette.yellow, palette.coral][brick.row]; const w = brick.age === undefined ? 0 : wobble(brick.age, .12, 30, 10); rounded(ctx, brick.x - brick.w * w / 2, brick.y + brick.h * w / 2, brick.w * (1 + w), brick.h * (1 - w), color, 3); ctx.fillStyle = '#ffffff30'; ctx.fillRect(brick.x + 4, brick.y + 3, brick.w - 8, 2); if (brick.hp > 1) text(ctx, brick.hp, brick.x + 31, brick.y + 9, 11, '#172333'); }); debris.forEach((d) => { const t = d.age / .22, k = 1 - t * t; ctx.globalAlpha = 1 - t; rounded(ctx, d.x + d.w * (1 - k) / 2, d.y + d.h * (1 - k) / 2, d.w * k, d.h * k, d.color, 3); }); ctx.globalAlpha = 1;
        drops.forEach((drop) => { const fire = drop.type === 'fire'; rounded(ctx, drop.x - 12, drop.y - 9, 24, 18, fire ? palette.coral : palette.green, 5); text(ctx, drop.type === 'wide' ? '↔' : fire ? '»' : '♥', drop.x, drop.y, 14, '#20331b'); });
        trail.forEach((p, i) => { ctx.globalAlpha = i / trail.length * .3; circle(ctx, p.x, p.y, 6 * i / trail.length, fireTime > 0 ? palette.coral : palette.blue); }); ctx.globalAlpha = 1; { const w = wobble(paddleAge, 1, 22, 8); rounded(ctx, paddle - w * 4, 395 + w * 3, paddleWidth + w * 8, 10 - w * 3, wideTime > 0 ? palette.green : palette.blue, 5); } { const w = wobble(ballAge, .32, 30, 10), color = fireTime > 0 ? palette.coral : palette.ink; if (Math.abs(w) < 1e-3) circle(ctx, ball.x, ball.y, 7, color); else { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(ball.x, ball.y, 7 * (1 - w), 7 * (1 + w * .8), Math.atan2(ball.vy, ball.vx), 0, Math.PI * 2); ctx.fill(); } } fx.draw(ctx); if (attached) { text(ctx, `LEVEL ${level}`, 300, 259, 27, palette.ink); text(ctx, 'SPACE / CLICK TO SERVE', 300, 293, 13, palette.muted); }
    }); s.message('패들 끝 = 큰 반사각 · 벽돌 연속 파괴 보너스 · ↔ 패들 확장 · » 관통 공은 6초간 벽돌을 뚫어요.'); s.ready('벽돌깨기', precise ? '패들이 작고 기회는 한 번! 정확한 반사각과 연속 파괴에 도전하세요.' : '패들로 공을 받고 벽돌을 깨세요. 연속 파괴와 아이템으로 흐름을 이어가요.', launch);
};
