import { random, clamp, distance, circle, background, palette } from '../core.js';
import { effects } from '../effects.js';

export default (s) => {
    const width = 600, height = 440, { ctx, canvas, point } = s.canvas(width, height), player = { x: 300, y: 220 }, enemies = [], trail = [], fx = effects(s); let timer = .8, score = 0, grazes = 0, cooldown = 0, dash = 0, pointer = null;
    const burst = () => { if (cooldown <= 0) { dash = .23; cooldown = 3; fx.burst(player.x, player.y, palette.green, 10, 120); s.sound(670, .05); } };
    s.bindKeys(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight'], (code) => { if (code.startsWith('Shift')) burst(); });
    s.on(canvas, 'pointerdown', (event) => { if (s.active()) { pointer = point(event); canvas.setPointerCapture(event.pointerId); } }); s.on(canvas, 'pointermove', (event) => { if (pointer && s.active()) pointer = point(event); }); const release = () => { pointer = null; }; s.on(canvas, 'pointerup', release); s.on(canvas, 'pointercancel', release); s.on(s.root, 'gamepause', release);
    s.run((dt) => {
        fx.update(dt); cooldown = Math.max(0, cooldown - dt); dash = Math.max(0, dash - dt); let dx = (s.down('ArrowRight') || s.down('KeyD') ? 1 : 0) - (s.down('ArrowLeft') || s.down('KeyA') ? 1 : 0), dy = (s.down('ArrowDown') || s.down('KeyS') ? 1 : 0) - (s.down('ArrowUp') || s.down('KeyW') ? 1 : 0);
        if (pointer) { dx = pointer.x - player.x; dy = pointer.y - player.y; } const length = Math.hypot(dx, dy); if (length) { const step = Math.min(pointer ? length : Infinity, (dash > 0 ? 610 : 260) * dt); player.x += dx / length * step; player.y += dy / length * step; } player.x = clamp(player.x, 10, width - 10); player.y = clamp(player.y, 10, height - 10);
        timer -= dt; if (timer <= 0) { const side = random(0, 3), x = side === 0 ? 12 : side === 1 ? width - 12 : random(20, width - 20), y = side === 2 ? 12 : side === 3 ? height - 12 : random(20, height - 20), angle = Math.atan2(player.y - y, player.x - x), speed = 90 + Math.min(150, s.time * 1.7), fan = s.time > 18 && Math.random() < .28 ? 3 : 1; for (let n = 0; n < fan; n++) { const a = angle + (n - (fan - 1) / 2) * .23; enemies.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: random(6, 11), arm: .55, grazed: false }); } timer = Math.max(.28, .72 - s.time * .005); }
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            enemy.arm -= dt;
            if (enemy.arm > 0) continue;
            enemy.x += enemy.vx * dt;
            enemy.y += enemy.vy * dt;
            const d = distance(enemy, player);
            if (d < enemy.r + 7 && dash <= 0) {
                fx.burst(player.x, player.y, palette.coral, 26, 150); fx.ring(player.x, player.y, palette.coral, 60); fx.shake(7);
                s.finish({ score, recordText: `${s.time.toFixed(1)}초 · ${score}점`, win: false, title: '아슬아슬한 회피였어요!', text: `${s.time.toFixed(1)}초 생존 · 근접 회피 ${grazes}번 · ${score}점` });
                return;
            } if (!enemy.grazed && d >= enemy.r + 7 && d < enemy.r + 22) {
                enemy.grazed = true;
                grazes++;
                fx.label(player.x, player.y - 15, '+5 GRAZE', palette.yellow);
            }
            if (enemy.x < -35 || enemy.y < -35 || enemy.x > width + 35 || enemy.y > height + 35) enemies.splice(i, 1);
        }
        trail.push({ ...player }); if (trail.length > 8) trail.shift(); score = Math.floor(s.time * 10) + grazes * 5; s.hud([['SCORE', score], ['생존', `${s.time.toFixed(1)}초`], ['SHIFT DASH', cooldown > 0 ? `${cooldown.toFixed(1)}초` : '준비!']]);
    }, () => {
        background(ctx, width, height);
        enemies.forEach((enemy) => {
            if (enemy.arm > 0) {
                ctx.strokeStyle = '#ff8e7a99';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.r + 6 + enemy.arm * 12, 0, Math.PI * 2);
                ctx.stroke();
                circle(ctx, enemy.x, enemy.y, 3, palette.coral);
            } else {
                ctx.strokeStyle = '#ff8e7a35';
                ctx.lineWidth = enemy.r;
                ctx.beginPath();
                ctx.moveTo(enemy.x - enemy.vx * .035, enemy.y - enemy.vy * .035);
                ctx.lineTo(enemy.x, enemy.y);
                ctx.stroke();
                circle(ctx, enemy.x, enemy.y, enemy.r, palette.coral);
            }
            });
        trail.forEach((p, i) => {
            ctx.globalAlpha = i / trail.length * (dash > 0 ? .5 : .12);
            circle(ctx, p.x, p.y, 8, palette.green);
        });
        ctx.globalAlpha = 1;
        circle(ctx, player.x, player.y, dash > 0 ? 13 : 10, '#b9f86b22');
        circle(ctx, player.x, player.y, 7, palette.green);
        circle(ctx, player.x, player.y, 2, '#f3ffe4');
        fx.draw(ctx);
    }); s.hud([['SCORE', 0], ['생존', '0.0초'], ['SHIFT DASH', '준비!']]); s.message('Shift: 짧은 무적 대시, 재충전 3초 · 붉은 원은 출현 전 0.55초 경고해요.'); s.ready('Dodge', '위험 가까이를 지나면 GRAZE 보너스. Shift 대시를 아껴 두었다가 포위망을 빠져나오세요.');
};
