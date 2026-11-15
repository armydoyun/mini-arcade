import { random, background, palette, intersects, rounded, circle } from '../core.js';
import { effects } from '../effects.js';

export default (s) => {
    const width = 600, height = 360, ground = 294, { ctx, canvas } = s.canvas(width, height), obstacles = [], coins = [], fx = effects(s); let feet = ground, vy = 0, spawn = 1.6, traveled = 0, coinCount = 0, jumps = 0, jumpBuffer = 0, ducking = false;
    const jump = () => { jumpBuffer = .13; }; s.bindKeys(['Space', 'ArrowUp', 'ArrowDown', 'KeyS'], (code) => { if (code === 'Space' || code === 'ArrowUp') jump(); }); s.on(canvas, 'pointerdown', () => { if (s.active()) jump(); });
    const score = () => Math.floor(traveled / 20) + coinCount * 10;
    s.run((dt) => {
        fx.update(dt); jumpBuffer -= dt; ducking = feet >= ground - .1 && (s.down('ArrowDown') || s.down('KeyS'));
        if (jumpBuffer > 0 && jumps < 2) { vy = jumps ? -420 : -490; jumps++; jumpBuffer = 0; ducking = false; fx.burst(110, feet, palette.blue, 7, 60); s.sound(jumps === 2 ? 610 : 420, .035); }
        vy += 1360 * dt; feet += vy * dt; if (feet >= ground) { feet = ground; vy = 0; jumps = 0; }
        const speed = 235 + Math.min(165, s.time * 2.9); traveled += speed * dt; spawn -= dt;
        if (spawn <= 0) { const overhead = s.time > 12 && Math.random() < .3, h = overhead ? 20 : random(28, 58), w = overhead ? 70 : random(25, 43); obstacles.push({ x: width + 30, y: overhead ? ground - 39 : ground - h, w, h, overhead }); coins.push({ x: width + 45, y: overhead ? ground - 10 : ground - h - 43, r: 6, taken: false }); spawn = random(105, 150) / 100; }
        const player = { x: 100, y: feet - (ducking ? 15 : 28), w: 26, h: ducking ? 15 : 28 };
        for (let i = obstacles.length - 1; i >= 0; i--) { const obstacle = obstacles[i]; obstacle.x -= speed * dt; if (intersects({ x: player.x + 3, y: player.y + 2, w: player.w - 6, h: player.h - 3 }, obstacle)) { fx.burst(112, player.y + 12, palette.coral, 20); s.finish({ score: score(), recordText: `${score()}점 · ${Math.floor(traveled / 20)}m`, win: false, title: '다음 장애물도 넘어봐요!', text: `${Math.floor(traveled / 20)}m · 코인 ${coinCount}개 · ${score()}점. 높은 가로 막대는 ↓로 숙여요.` }); return; } if (obstacle.x < -100) obstacles.splice(i, 1); }
        for (let i = coins.length - 1; i >= 0; i--) { const coin = coins[i]; coin.x -= speed * dt; if (coin.x > player.x - 5 && coin.x < player.x + player.w + 5 && coin.y > player.y - 6 && coin.y < player.y + player.h + 6) { coinCount++; fx.burst(coin.x, coin.y, palette.yellow, 6, 50); s.sound(750, .035); coins.splice(i, 1); } else if (coin.x < -15) coins.splice(i, 1); }
        s.hud([['SCORE', score()], ['거리', `${Math.floor(traveled / 20)}m`], ['코인', coinCount], ['공중 점프', jumps < 2 ? '가능' : '사용함']]);
    }, () => {
        background(ctx, width, height); ctx.strokeStyle = '#536b83'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, ground + 1); ctx.lineTo(width, ground + 1); ctx.stroke(); ctx.fillStyle = '#2d3a49'; for (let x = -(traveled % 45); x < width; x += 45) ctx.fillRect(x, ground + 18, 14, 2);
        obstacles.forEach((obstacle) => {
            rounded(ctx, obstacle.x, obstacle.y, obstacle.w, obstacle.h, obstacle.overhead ? palette.purple : palette.coral, 3);
            if (obstacle.overhead) {
                ctx.fillStyle = '#c1a0ff44';
                ctx.fillRect(obstacle.x, 10, 2, obstacle.y - 10);
            }
            ctx.fillStyle = '#ffffff38';
            ctx.fillRect(obstacle.x + 4, obstacle.y + 4, obstacle.w - 8, 2);
        });
        coins.forEach((coin) => {
            circle(ctx, coin.x, coin.y, 7, palette.yellow);
            circle(ctx, coin.x, coin.y, 3, '#9b763b');
        });
        rounded(ctx, 100, feet - (ducking ? 15 : 28), 26, ducking ? 15 : 28, palette.blue, 4);
        ctx.fillStyle = '#1b3046';
        ctx.fillRect(118, feet - (ducking ? 11 : 22), 4, 4);
        fx.draw(ctx);
    }); s.hud([['SCORE', 0], ['거리', '0m'], ['코인', 0], ['공중 점프', '가능']]); s.message('Space / ↑ / 클릭 점프 · 공중에서 한 번 더 점프 · ↓ / S 숙이기 · 코인 +10점.'); s.ready('Endless Runner', '낮은 장애물은 점프, 보라 가로 막대는 숙이세요. 공중 점프 한 번으로 실수를 만회할 수 있어요.');
};
