import { random, palette, intersects, rounded, circle } from '../core.js';
import { effects } from '../effects.js';

export default (s) => {
    const width = 600, height = 360, ground = 294, { ctx, canvas } = s.canvas(width, height), obstacles = [], coins = [], fx = effects(s); let feet = ground, vy = 0, spawn = 1.6, traveled = 0, coinCount = 0, coinPoints = 0, chain = 0, jumps = 0, jumpBuffer = 0, ducking = false, airborne = false, stride = 0;
    // 원경: 별·먼 빌딩·가까운 빌딩을 다른 속도로 흘려 깊이감을 만든다(판정과 무관).
    const stars = Array.from({ length: 40 }, () => ({ x: Math.random() * width, y: Math.random() * 150, r: Math.random() * 1.3 + .3 }));
    const skyline = (layer, seed) => Array.from({ length: 14 }, (_, i) => ({ x: i * 62, w: 40 + ((i * 37 + seed) % 30), h: 40 + ((i * 53 + seed * 7) % (layer ? 90 : 60)) }));
    const far = skyline(0, 11), nearCity = skyline(1, 5);
    const jump = () => { jumpBuffer = .13; }; s.bindKeys(['Space', 'ArrowUp', 'ArrowDown', 'KeyS'], (code) => { if (code === 'Space' || code === 'ArrowUp') jump(); }); s.on(canvas, 'pointerdown', () => { if (s.active()) jump(); });
    const speedLines = () => s.time > 25;
    const score = () => Math.floor(traveled / 20) + coinPoints;
    s.run((dt) => {
        fx.update(dt); jumpBuffer -= dt; ducking = feet >= ground - .1 && (s.down('ArrowDown') || s.down('KeyS'));
        if (jumpBuffer > 0 && jumps < 2) { vy = jumps ? -420 : -490; jumps++; jumpBuffer = 0; ducking = false; fx.burst(110, feet, palette.blue, 7, 60); s.sound(jumps === 2 ? 610 : 420, .035); }
        vy += 1360 * dt; feet += vy * dt; if (feet >= ground) { if (airborne && vy > 300) fx.burst(113, ground, '#8a96a7', 6, 50); feet = ground; vy = 0; jumps = 0; airborne = false; } else airborne = true;
        const speed = 235 + Math.min(165, s.time * 2.9); traveled += speed * dt; spawn -= dt; stride += speed * dt;
        if (spawn <= 0) { const overhead = s.time > 12 && Math.random() < .3, h = overhead ? 20 : random(28, 58), w = overhead ? 70 : random(25, 43); obstacles.push({ x: width + 30, y: overhead ? ground - 39 : ground - h, w, h, overhead }); coins.push({ x: width + 45, y: overhead ? ground - 10 : ground - h - 43, r: 6, taken: false }); spawn = random(105, 150) / 100; }
        const player = { x: 100, y: feet - (ducking ? 15 : 28), w: 26, h: ducking ? 15 : 28 };
        for (let i = obstacles.length - 1; i >= 0; i--) { const obstacle = obstacles[i]; obstacle.x -= speed * dt; if (intersects({ x: player.x + 3, y: player.y + 2, w: player.w - 6, h: player.h - 3 }, obstacle)) { fx.burst(112, player.y + 12, palette.coral, 26, 150); fx.shake(8); fx.flash(palette.coral); s.sound(150, .2); s.finish({ score: score(), recordText: `${score()}점 · ${Math.floor(traveled / 20)}m`, win: false, title: '다음 장애물도 넘어봐요!', text: `${Math.floor(traveled / 20)}m · 코인 ${coinCount}개 · ${score()}점. 높은 가로 막대는 ↓로 숙여요.` }); return; } if (obstacle.x < -100) obstacles.splice(i, 1); }
        for (let i = coins.length - 1; i >= 0; i--) { const coin = coins[i]; coin.x -= speed * dt; if (coin.x > player.x - 5 && coin.x < player.x + player.w + 5 && coin.y > player.y - 6 && coin.y < player.y + player.h + 6) { coinCount++; chain = Math.min(5, chain + 1); coinPoints += 10 * chain; fx.burst(coin.x, coin.y, palette.yellow, 8, 70); if (chain > 1) fx.label(coin.x, coin.y - 12, `+${10 * chain} ×${chain}`, palette.yellow); s.sound(700 + chain * 45, .035); coins.splice(i, 1); } else if (coin.x < player.x - 20 && !coin.missed) { coin.missed = true; chain = 0; } if (coins[i] && coins[i].x < -15) coins.splice(i, 1); }
        s.hud([['SCORE', score()], ['거리', `${Math.floor(traveled / 20)}m`], ['코인', coinCount], ['코인 연속', chain ? `×${chain}` : '-']]);
    }, () => {
        const sky = ctx.createLinearGradient(0, 0, 0, ground); sky.addColorStop(0, '#0f1622'); sky.addColorStop(1, '#1c2a3a'); ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
        stars.forEach((st) => { const x = ((st.x - traveled * .02) % width + width) % width; ctx.globalAlpha = .4 + Math.sin(s.time * 2 + st.x) * .25; circle(ctx, x, st.y, st.r, '#dfe9f5'); }); ctx.globalAlpha = 1;
        circle(ctx, 480, 70, 22, '#f5e7b8'); circle(ctx, 470, 64, 20, '#1a2535');
        for (const [layer, list, color, rate] of [[0, far, '#1d2b3b', .12], [1, nearCity, '#243447', .3]]) {
            const loop = list.length * 62;
            list.forEach((b) => { const x = ((b.x - traveled * rate) % loop + loop) % loop - 60; ctx.fillStyle = color; ctx.fillRect(x, ground - b.h - (layer ? 0 : 20), b.w, b.h + 20); if (layer) { ctx.fillStyle = '#f5d47d22'; for (let wy = ground - b.h + 8; wy < ground - 8; wy += 14) for (let wx = x + 6; wx < x + b.w - 6; wx += 10) if ((wx * 7 + wy * 3) % 5 < 2) ctx.fillRect(wx, wy, 4, 6); } });
        }
        ctx.fillStyle = '#1a2330'; ctx.fillRect(0, ground + 1, width, height - ground); ctx.strokeStyle = '#6f8aa5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, ground + 1); ctx.lineTo(width, ground + 1); ctx.stroke(); ctx.lineWidth = 1;
        ctx.fillStyle = '#2d3a49'; for (let x = -(traveled % 45); x < width; x += 45) ctx.fillRect(x, ground + 18, 14, 2); ctx.fillStyle = '#26323f'; for (let x = -(traveled * 1.4 % 70); x < width; x += 70) ctx.fillRect(x, ground + 38, 30, 3);
        obstacles.forEach((obstacle) => {
            if (obstacle.overhead) {
                ctx.fillStyle = '#c1a0ff44'; ctx.fillRect(obstacle.x + 4, 0, 2, obstacle.y); ctx.fillRect(obstacle.x + obstacle.w - 6, 0, 2, obstacle.y);
                rounded(ctx, obstacle.x, obstacle.y, obstacle.w, obstacle.h, palette.purple, 4); ctx.fillStyle = '#5d3f8f'; for (let k = 6; k < obstacle.w - 4; k += 12) ctx.fillRect(obstacle.x + k, obstacle.y + 6, 6, obstacle.h - 12);
            } else {
                rounded(ctx, obstacle.x, obstacle.y, obstacle.w, obstacle.h, palette.coral, 4); ctx.fillStyle = '#c4614f'; ctx.fillRect(obstacle.x, obstacle.y + obstacle.h - 6, obstacle.w, 6);
                ctx.fillStyle = '#ffd2c855'; for (let k = 8; k < obstacle.h - 8; k += 12) ctx.fillRect(obstacle.x + 4, obstacle.y + k, obstacle.w - 8, 3);
            }
            ctx.fillStyle = '#ffffff38'; ctx.fillRect(obstacle.x + 4, obstacle.y + 3, obstacle.w - 8, 2);
        });
        coins.forEach((coin) => { const spin = Math.abs(Math.cos(s.time * 6 + coin.x * .05)); ctx.fillStyle = palette.yellow; ctx.beginPath(); ctx.ellipse(coin.x, coin.y, 7 * Math.max(.18, spin), 7, 0, 0, Math.PI * 2); ctx.fill(); if (spin > .5) circle(ctx, coin.x, coin.y, 2.6, '#9b763b'); });
        if (speedLines()) { ctx.strokeStyle = '#ffffff14'; ctx.lineWidth = 1; for (let k = 0; k < 6; k++) { const ly = 40 + ((k * 47 + Math.floor(traveled / 9)) % 220), lx = width - ((traveled * 2 + k * 97) % (width + 80)); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 50, ly); ctx.stroke(); } }
        // 러너: 몸통·머리·달리는 다리. 공중에서는 다리를 모으고, 숙이면 납작해진다.
        const h = ducking ? 15 : 28, top = feet - h, legs = ducking || airborne ? 0 : Math.sin(stride / 9);
        ctx.strokeStyle = '#4f86c9'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(108, feet - 6); ctx.lineTo(108 + legs * 6, feet); ctx.moveTo(118, feet - 6); ctx.lineTo(118 - legs * 6, feet); ctx.stroke(); ctx.lineCap = 'butt'; ctx.lineWidth = 1;
        rounded(ctx, 100, top, 26, h - 4, palette.blue, 6); ctx.fillStyle = '#d6e7ff'; ctx.fillRect(113, top + 5, 10, ducking ? 4 : 6); ctx.fillStyle = '#1b3046'; ctx.fillRect(119, top + 6, 3, ducking ? 2 : 4);
        if (airborne) { ctx.fillStyle = '#82b6ff33'; ctx.fillRect(96, top + 4, 4, h - 10); }
        fx.draw(ctx);
    }); s.hud([['SCORE', 0], ['거리', '0m'], ['코인', 0], ['코인 연속', '-']]); s.message('Space / ↑ / 클릭 점프 · 공중에서 한 번 더 점프 · ↓ / S 숙이기 · 코인을 놓치지 않고 이어 먹으면 최대 ×5.'); s.ready('Endless Runner', '낮은 장애물은 점프, 보라 가로 막대는 숙이세요. 공중 점프 한 번으로 실수를 만회할 수 있어요.');
};
