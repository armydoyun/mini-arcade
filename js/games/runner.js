import { random, background, palette, intersects, rounded, circle, wobble } from '../core.js';
import { effects } from '../effects.js';

export default (s) => {
    const width = 600, height = 360, ground = 294, { ctx, canvas } = s.canvas(width, height), obstacles = [], coins = [], fx = effects(s); let feet = ground, vy = 0, spawn = 1.6, traveled = 0, coinCount = 0, coinPoints = 0, chain = 0, jumps = 0, jumpBuffer = 0, ducking = false, airborne = false;
    let landAge = 9, jumpAge = 9; // 착지·도약 뒤 지난 시간: 몸이 찌그러졌다 탄성 있게 돌아온다
    const jump = () => { jumpBuffer = .13; }; s.bindKeys(['Space', 'ArrowUp', 'ArrowDown', 'KeyS'], (code) => { if (code === 'Space' || code === 'ArrowUp') jump(); }); s.on(canvas, 'pointerdown', () => { if (s.active()) jump(); });
    const score = () => Math.floor(traveled / 20) + coinPoints;
    s.run((dt) => {
        fx.update(dt); jumpBuffer -= dt; ducking = feet >= ground - .1 && (s.down('ArrowDown') || s.down('KeyS'));
        if (jumpBuffer > 0 && jumps < 2) { vy = jumps ? -420 : -490; jumps++; jumpAge = 0; jumpBuffer = 0; ducking = false; fx.burst(110, feet, palette.blue, 7, 60); s.sound(jumps === 2 ? 610 : 420, .035); }
        vy += 1360 * dt; feet += vy * dt; if (feet >= ground) { if (airborne && vy > 300) landAge = 0; feet = ground; vy = 0; jumps = 0; airborne = false; } else airborne = true;
        const speed = 235 + Math.min(165, s.time * 2.9); traveled += speed * dt; spawn -= dt; landAge += dt; jumpAge += dt;
        if (spawn <= 0) { const overhead = s.time > 12 && Math.random() < .3, h = overhead ? 20 : random(28, 58), w = overhead ? 70 : random(25, 43); obstacles.push({ x: width + 30, y: overhead ? ground - 39 : ground - h, w, h, overhead }); coins.push({ x: width + 45, y: overhead ? ground - 10 : ground - h - 43, r: 6, taken: false }); spawn = random(105, 150) / 100; }
        const player = { x: 100, y: feet - (ducking ? 15 : 28), w: 26, h: ducking ? 15 : 28 };
        for (let i = obstacles.length - 1; i >= 0; i--) { const obstacle = obstacles[i]; obstacle.x -= speed * dt; if (intersects({ x: player.x + 3, y: player.y + 2, w: player.w - 6, h: player.h - 3 }, obstacle)) { fx.burst(112, player.y + 12, palette.coral, 26, 150); fx.shake(8); s.sound(150, .2); s.finish({ score: score(), recordText: `${score()}점 · ${Math.floor(traveled / 20)}m`, win: false, title: '다음 장애물도 넘어봐요!', text: `${Math.floor(traveled / 20)}m · 코인 ${coinCount}개 · ${score()}점. 높은 가로 막대는 ↓로 숙여요.` }); return; } if (obstacle.x < -100) obstacles.splice(i, 1); }
        for (let i = coins.length - 1; i >= 0; i--) { const coin = coins[i]; coin.x -= speed * dt; if (coin.x > player.x - 5 && coin.x < player.x + player.w + 5 && coin.y > player.y - 6 && coin.y < player.y + player.h + 6) { coinCount++; chain = Math.min(5, chain + 1); coinPoints += 10 * chain; fx.burst(coin.x, coin.y, palette.yellow, 8, 70); if (chain > 1) fx.label(coin.x, coin.y - 12, `+${10 * chain} ×${chain}`, palette.yellow); s.sound(700 + chain * 45, .035); coins.splice(i, 1); } else if (coin.x < player.x - 20 && !coin.missed) { coin.missed = true; chain = 0; } if (coins[i] && coins[i].x < -15) coins.splice(i, 1); }
        s.hud([['SCORE', score()], ['거리', `${Math.floor(traveled / 20)}m`], ['코인', coinCount], ['코인 연속', chain ? `×${chain}` : '-']]);
    }, () => {
        background(ctx, width, height);
        ctx.strokeStyle = '#536b83'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, ground + 1); ctx.lineTo(width, ground + 1); ctx.stroke(); ctx.lineWidth = 1;
        ctx.fillStyle = '#2d3a49'; for (let x = -(traveled % 45); x < width; x += 45) ctx.fillRect(x, ground + 18, 14, 2);
        obstacles.forEach((obstacle) => {
            if (obstacle.overhead) { ctx.fillStyle = '#c1a0ff33'; ctx.fillRect(obstacle.x + obstacle.w / 2 - 1, 0, 2, obstacle.y); }
            rounded(ctx, obstacle.x, obstacle.y, obstacle.w, obstacle.h, obstacle.overhead ? palette.purple : palette.coral, 5);
        });
        coins.forEach((coin) => circle(ctx, coin.x, coin.y + Math.sin(s.time * 4 + coin.x * .03) * 2, 6, palette.yellow));
        // 러너: 둥근 사각형 하나. 올라갈 때는 살짝 길어지고, 착지하면 잠깐 납작해졌다 돌아온다.
        const h = ducking ? 15 : 28, stretch = (airborne ? Math.max(-.1, Math.min(.12, -vy / 4000)) : 0) - wobble(landAge, .3, 28, 8) + wobble(jumpAge, .22, 28, 9), bodyH = h * (1 + stretch), bodyW = 26 * (1 - stretch * .6);
        rounded(ctx, 113 - bodyW / 2, feet - bodyH, bodyW, bodyH, palette.blue, 7); circle(ctx, 113 + bodyW / 2 - 7, feet - bodyH + (ducking ? 6 : 9), 2.2, '#1b3046');
        fx.draw(ctx);
    }); s.hud([['SCORE', 0], ['거리', '0m'], ['코인', 0], ['코인 연속', '-']]); s.message('Space / ↑ / 클릭 점프 · 공중에서 한 번 더 점프 · ↓ / S 숙이기 · 코인을 놓치지 않고 이어 먹으면 최대 ×5.'); s.ready('Endless Runner', '낮은 장애물은 점프, 보라 가로 막대는 숙이세요. 공중 점프 한 번으로 실수를 만회할 수 있어요.');
};
