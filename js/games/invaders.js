import { clamp, random, background, palette, intersects, rounded, text } from '../core.js';
import { effects } from '../effects.js';

export default (s) => {
    const width = 600, height = 450, { ctx, canvas, point } = s.canvas(width, height), player = { x: 282, y: 404, w: 36, h: 18 }, shots = [], enemyShots = [], shields = [], fx = effects(s); let enemies = [], offset = 0, descent = 0, direction = 1, cooldown = 0, enemyTimer = .8, lives = 3, wave = 1, score = 0, immunity = 0, pointer = null, transition = 0, ufo = null, ufoTimer = 12;
    for (let bunker = 0; bunker < 3; bunker++) for (let y = 0; y < 5; y++) for (let x = 0; x < 9; x++) if (!((y === 0 && (x < 2 || x > 6)) || (y >= 3 && x >= 3 && x <= 5))) shields.push({ x: 105 + bunker * 165 + x * 6, y: 345 + y * 6, w: 6, h: 6, alive: true });
    const makeWave = () => { enemies = Array.from({ length: 36 }, (_, i) => ({ x: 50 + i % 9 * 51, y: 47 + Math.floor(i / 9) * 33, w: 28, h: 20, row: Math.floor(i / 9), column: i % 9 })); offset = descent = 0; direction = 1; shots.length = enemyShots.length = 0; enemyTimer = 1.1; immunity = Math.max(immunity, 1.2); };
    const hud = () => s.hud([['SCORE', score], ['LIVES', '♥'.repeat(Math.max(0, lives))], ['WAVE', wave]]);
    const shieldHit = (shot, down = false) => { let cell = null; for (const candidate of shields) if (candidate.alive && intersects(shot, candidate) && (!cell || (down ? candidate.y < cell.y : candidate.y > cell.y))) cell = candidate; if (!cell) return false; shields.forEach((other) => { if (Math.hypot(other.x - cell.x, other.y - cell.y) < 9) other.alive = false; }); fx.burst(cell.x, cell.y, '#91b8a2', 5, 40); return true; };
    s.bindKeys(['ArrowLeft', 'ArrowRight', 'Space']); s.on(canvas, 'pointerdown', (event) => { if (s.active()) { pointer = event.pointerId; player.x = clamp(point(event).x - 18, 4, width - 40); canvas.setPointerCapture(event.pointerId); } }); s.on(canvas, 'pointermove', (event) => { if (pointer === event.pointerId && s.active()) player.x = clamp(point(event).x - 18, 4, width - 40); }); const release = () => { pointer = null; }; s.on(canvas, 'pointerup', release); s.on(canvas, 'pointercancel', release); s.on(s.root, 'gamepause', release); makeWave(); hud();
    s.run((dt) => {
        fx.update(dt); immunity -= dt; cooldown -= dt; player.x = clamp(player.x + ((s.down('ArrowRight') ? 1 : 0) - (s.down('ArrowLeft') ? 1 : 0)) * 340 * dt, 4, width - 40);
        if ((s.down('Space') || pointer !== null) && cooldown <= 0) { shots.push({ x: player.x + 16, y: player.y - 8, w: 4, h: 12 }); cooldown = .18; s.sound(630, .016); }
        if (transition > 0) { transition -= dt; if (transition <= 0) { wave++; makeWave(); hud(); } }
        else { enemyTimer -= dt; offset += direction * (25 + wave * 5 + (36 - enemies.length) * 1.35) * dt;
            if (enemies.some((enemy) => enemy.x + offset < 10 || enemy.x + enemy.w + offset > width - 10)) { direction *= -1; offset = clamp(offset, 10 - Math.min(...enemies.map((enemy) => enemy.x)), width - 10 - Math.max(...enemies.map((enemy) => enemy.x + enemy.w))); descent += 15; }
            if (enemyTimer <= 0 && enemies.length) { const front = enemies.filter((enemy) => !enemies.some((other) => other.column === enemy.column && other.y > enemy.y)), enemy = front[random(0, front.length - 1)]; enemyShots.push({ x: enemy.x + offset + 12, y: enemy.y + descent + 22, w: 5, h: 11 }); enemyTimer = Math.max(.28, .82 - wave * .045); }
        }
        ufoTimer -= dt; if (!ufo && ufoTimer <= 0) { ufo = { x: width + 20, y: 13, w: 37, h: 15 }; ufoTimer = 16 + random(0, 6); } if (ufo) { ufo.x -= 110 * dt; if (ufo.x < -50) ufo = null; }
        for (let i = shots.length - 1; i >= 0; i--) {
            const shot = shots[i], oldY = shot.y;
            shot.y -= 450 * dt;
            const swept = { ...shot, h: shot.h + oldY - shot.y };
            if (shieldHit(swept)) {
                shots.splice(i, 1);
                continue;
            } if (ufo && intersects(swept, ufo)) {
                score += 150;
                fx.label(ufo.x, ufo.y + 20, '+150 UFO', palette.yellow);
                fx.burst(ufo.x + 18, ufo.y, palette.coral);
                ufo = null;
                shots.splice(i, 1);
                hud();
                continue;
            }
            const at = enemies.findIndex((enemy) => intersects(swept, { ...enemy, x: enemy.x + offset, y: enemy.y + descent }));
            if (at >= 0) {
                const enemy = enemies[at];
                score += (4 - enemy.row) * 10;
                fx.burst(enemy.x + offset + 14, enemy.y + descent + 10, palette.green, 10, 80);
                enemies.splice(at, 1);
                shots.splice(i, 1);
                hud();
            } else if (shot.y < -20) shots.splice(i, 1);
        }
        for (let i = enemyShots.length - 1; i >= 0; i--) { const shot = enemyShots[i], oldY = shot.y; shot.y += (155 + wave * 12) * dt; const swept = { ...shot, y: oldY, h: shot.h + shot.y - oldY }; if (shieldHit(swept, true)) { enemyShots.splice(i, 1); continue; } if (immunity <= 0 && intersects(swept, player)) { enemyShots.splice(i, 1); lives--; fx.shake(6); immunity = 1.4; fx.burst(player.x + 18, player.y, palette.coral, 18); hud(); s.sound(130, .1); } else if (shot.y > height) enemyShots.splice(i, 1); }
        shields.forEach((cell) => { if (cell.alive && enemies.some((enemy) => intersects(cell, { ...enemy, x: enemy.x + offset, y: enemy.y + descent }))) cell.alive = false; });
        if (lives <= 0 || enemies.some((enemy) => enemy.y + descent + enemy.h >= player.y)) { s.finish({ score, win: false, title: '끝까지 지켜냈어요!', text: `${score}점 · ${wave}번째 웨이브. 방벽도 내 탄환에 부서지니 발사 위치를 골라요.` }); return; }
        if (!enemies.length && transition <= 0) { transition = 1.2; enemyShots.length = 0; score += 150; hud(); fx.label(300, 180, 'WAVE CLEAR +150', palette.green); }
    }, () => {
        background(ctx, width, height); ctx.fillStyle = '#3a5147'; ctx.fillRect(0, 434, width, 2); shields.forEach((cell) => { if (cell.alive) { ctx.fillStyle = '#83aa91'; ctx.fillRect(cell.x, cell.y, 5.5, 5.5); } });
        enemies.forEach((enemy) => { const x = enemy.x + offset, y = enemy.y + descent, pose = Math.floor(s.time * 3) % 2; ctx.fillStyle = [palette.coral, palette.yellow, palette.green, palette.blue][enemy.row]; ctx.fillRect(x + 4, y, 20, 15); ctx.fillRect(x, y + 5, 28, 7); ctx.fillRect(x + (pose ? 0 : 4), y + 16, 6, 4); ctx.fillRect(x + (pose ? 22 : 18), y + 16, 6, 4); ctx.fillStyle = palette.bg; ctx.fillRect(x + 8, y + 5, 4, 4); ctx.fillRect(x + 17, y + 5, 4, 4); });
        if (ufo) { rounded(ctx, ufo.x, ufo.y + 5, 37, 10, palette.coral, 5); rounded(ctx, ufo.x + 9, ufo.y, 19, 9, palette.coral, 5); } ctx.fillStyle = palette.green; shots.forEach((shot) => ctx.fillRect(shot.x, shot.y, shot.w, shot.h)); ctx.fillStyle = palette.coral; enemyShots.forEach((shot) => ctx.fillRect(shot.x, shot.y, shot.w, shot.h));
        if (immunity <= 0 || Math.floor(immunity * 10) % 2 === 0) { rounded(ctx, player.x, player.y + 7, player.w, 11, palette.blue, 3); ctx.fillStyle = '#c1ddff'; ctx.fillRect(player.x + 13, player.y, 10, 15); } if (transition > 0) text(ctx, `NEXT WAVE ${wave + 1}`, 300, 225, 22, palette.green); fx.draw(ctx);
    }); s.message('← → 이동 · Space 연사 · 방벽은 양쪽 탄환에 부서져요 · UFO는 +150점.'); s.ready('Space Invaders', '방벽의 구멍을 활용해 전방 사수를 격추하세요. 상단 UFO와 웨이브 클리어 보너스를 노려요.');
};
