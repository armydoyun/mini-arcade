import { random, background, circle, palette } from '../core.js';
import { torusDistance } from '../rules.js';
import { effects } from '../effects.js';

export default (s) => {
    const width = 600, height = 460, { ctx } = s.canvas(width, height), ship = { x: 300, y: 230, vx: 0, vy: 0, angle: -Math.PI / 2 }, rocks = [], bullets = [], fx = effects(s); let score = 0, lives = 3, wave = 1, cooldown = 0, immunity = 2, shieldCooldown = 0, combo = 0, comboTimer = 0, muzzle = 0;
    const wrap = (object) => { object.x = (object.x + width) % width; object.y = (object.y + height) % height; };
    const rock = (x, y, radius, inherited = null, branch = 0) => { const angle = inherited ? Math.atan2(inherited.vy, inherited.vx) + (branch ? .7 : -.7) : Math.random() * Math.PI * 2, speed = inherited ? Math.hypot(inherited.vx, inherited.vy) * 1.2 : 28 + Math.random() * 35 + wave * 4; return { x, y, radius, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, spin: Math.random() * 2 - 1, rotation: 0, vertices: Array.from({ length: 10 }, () => .8 + Math.random() * .2) }; };
    const makeWave = () => { for (let n = 0; n < Math.min(10, 3 + wave); n++) rocks.push(rock(n % 2 ? random(0, width) : 12, n % 2 ? 12 : random(0, height), 35)); fx.label(300, 90, `WAVE ${wave}`, palette.blue); };
    const hud = () => s.hud([['SCORE', score], ['LIVES', '♥'.repeat(lives)], ['WAVE', wave], ['SHIFT SHIELD', shieldCooldown > 0 ? `${shieldCooldown.toFixed(1)}초` : '준비!']]);
    s.bindKeys(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'ShiftLeft', 'ShiftRight'], (code) => { if (code.startsWith('Shift') && shieldCooldown <= 0) { immunity = Math.max(immunity, 1); shieldCooldown = 6; s.sound(600, .08); } }); makeWave(); hud();
    s.run((dt) => {
        fx.update(dt); immunity -= dt; shieldCooldown = Math.max(0, shieldCooldown - dt); cooldown -= dt; muzzle = Math.max(0, muzzle - dt); comboTimer -= dt; if (comboTimer <= 0) combo = 0;
        ship.angle += ((s.down('ArrowRight') ? 1 : 0) - (s.down('ArrowLeft') ? 1 : 0)) * 3.8 * dt; if (s.down('ArrowUp')) { ship.vx += Math.cos(ship.angle) * 185 * dt; ship.vy += Math.sin(ship.angle) * 185 * dt; } const speed = Math.hypot(ship.vx, ship.vy); if (speed > 270) { ship.vx *= 270 / speed; ship.vy *= 270 / speed; } ship.vx *= Math.exp(-.24 * dt); ship.vy *= Math.exp(-.24 * dt); ship.x += ship.vx * dt; ship.y += ship.vy * dt; wrap(ship);
        if (s.down('Space') && cooldown <= 0) { bullets.push({ x: ship.x + Math.cos(ship.angle) * 17, y: ship.y + Math.sin(ship.angle) * 17, vx: Math.cos(ship.angle) * 430 + ship.vx, vy: Math.sin(ship.angle) * 430 + ship.vy, life: 1.2 }); cooldown = .15; muzzle = .05; s.sound(720, .018); }
        rocks.forEach((object) => { object.x += object.vx * dt; object.y += object.vy * dt; object.rotation += object.spin * dt; wrap(object); });
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i]; bullet.life -= dt; if (bullet.life <= 0) {
                bullets.splice(i, 1); continue; } const steps = Math.max(1, Math.ceil(Math.hypot(bullet.vx, bullet.vy) * dt / 6)); let hit = -1;
            for (let n = 0; n < steps && hit < 0; n++) { bullet.x += bullet.vx * dt / steps; bullet.y += bullet.vy * dt / steps; wrap(bullet); hit = rocks.findIndex((object) => torusDistance(bullet, object, width, height) < object.radius * .88 + 2); }
            if (hit < 0) continue; const object = rocks.splice(hit, 1)[0]; bullets.splice(i, 1); combo++; comboTimer = 2.3; const multiplier = Math.min(4, 1 + Math.floor(combo / 4)), gain = (object.radius > 25 ? 20 : object.radius > 15 ? 50 : 100) * multiplier; score += gain; fx.burst(object.x, object.y, palette.blue, 16, 110); if (multiplier > 1) fx.label(object.x, object.y, `+${gain} ×${multiplier}`, palette.yellow); if (object.radius > 15) for (let n = 0; n < 2; n++) rocks.push(rock(object.x, object.y, object.radius * .6, object, n)); s.sound(160, .035);
        }
        if (immunity <= 0 && rocks.some((object) => torusDistance(ship, object, width, height) < object.radius * .83 + 7)) { fx.burst(ship.x, ship.y, palette.coral, 25, 150); lives--; fx.shake(6); if (!lives) { hud(); s.finish({ score, win: false, title: '우주에 흔적을 남겼어요!', text: `${score}점 · ${wave}번째 웨이브` }); return; } ship.x = 300; ship.y = 230; ship.vx = ship.vy = 0; immunity = 2.5; combo = 0; s.sound(140, .13); }
        if (!rocks.length) { wave++; makeWave(); immunity = Math.max(immunity, 1.5); } hud();
    }, () => {
        background(ctx, width, height); ctx.lineWidth = 1.8;
        const copies = (object, radius, draw) => { for (const dx of [-width, 0, width]) for (const dy of [-height, 0, height]) if (object.x + dx > -radius && object.x + dx < width + radius && object.y + dy > -radius && object.y + dy < height + radius) { ctx.save(); ctx.translate(object.x + dx, object.y + dy); draw(); ctx.restore(); } };
        rocks.forEach((object) => copies(object, object.radius, () => { ctx.rotate(object.rotation); ctx.beginPath(); object.vertices.forEach((value, i) => { const a = i / 10 * Math.PI * 2, x = Math.cos(a) * object.radius * value, y = Math.sin(a) * object.radius * value; if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.closePath(); ctx.fillStyle = '#263342'; ctx.strokeStyle = '#a1b4cd'; ctx.fill(); ctx.stroke(); })); bullets.forEach((bullet) => circle(ctx, bullet.x, bullet.y, 2.5, palette.yellow));
        copies(ship, 25, () => {
            if (immunity > 0) {
                ctx.strokeStyle = '#82b6ff99';
                ctx.beginPath();
                ctx.arc(0, 0, 23, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.rotate(ship.angle);
            ctx.strokeStyle = palette.green;
            ctx.fillStyle = '#273c2b';
            ctx.beginPath();
            ctx.moveTo(17, 0);
            ctx.lineTo(-11, -10);
            ctx.lineTo(-6, 0);
            ctx.lineTo(-11, 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            if (s.down('ArrowUp')) {
                ctx.fillStyle = palette.coral;
                ctx.beginPath();
                ctx.moveTo(-8, -4);
                ctx.lineTo(-18 - Math.sin(s.time * 39) * 5, 0);
                ctx.lineTo(-8, 4);
                ctx.fill();
            }
            if (muzzle > 0) circle(ctx, 22, 0, 4, '#fff6bd');
        });
        fx.draw(ctx);
    }); s.message('↑ 추진 · ← → 회전 · Space 연속 발사 · Shift 1초 방어막, 재충전 6초.'); s.ready('Asteroids', '관성을 타고 운석을 부수세요. 가장자리의 화면과 충돌 판정은 반대편으로 이어져요. 연속 격추는 최대 4배!');
};
