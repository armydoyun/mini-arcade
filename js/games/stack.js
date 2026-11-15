import { text, palette, rounded, clamp } from '../core.js';
import { effects } from '../effects.js';

export default (s) => {
    const width = 540, height = 480, { ctx, canvas } = s.canvas(width, height), blocks = [{ x: 150, w: 240 }], scraps = [], fx = effects(s); let moving = { x: 0, w: 240 }, direction = 1, floors = 0, perfect = 0, streak = 0, score = 0, camera = 0;
    const place = () => {
        const below = blocks.at(-1), left = Math.max(moving.x, below.x), right = Math.min(moving.x + moving.w, below.x + below.w), overlap = right - left, worldY = floors * 25 + 25;
        if (overlap <= 0) { fx.shake(7); s.sound(150, .2); s.finish({ score, recordText: `${floors}층 · ${score}점`, win: false, title: '한 층씩, 충분히 높이!', text: `${floors}층 · 완벽 정렬 ${perfect}번 · ${score}점` }); return; }
        const exact = Math.abs(moving.x - below.x) <= Math.min(5, below.w * .1); let block;
        if (exact) { streak++; perfect++; const growth = streak >= 3 ? 5 : 0; const grownWidth = Math.min(240, below.w + growth); block = { x: clamp(below.x - growth / 2, 0, width - grownWidth), w: grownWidth }; fx.label(width / 2, 150, streak >= 3 ? `PERFECT ×${streak} · +WIDTH` : 'PERFECT!', palette.green); fx.burst(block.x + block.w / 2, 425 - worldY + camera, palette.green, 12, 75); fx.ring(block.x + block.w / 2, 436 - worldY + camera, streak >= 3 ? palette.yellow : palette.green, block.w * .7, .45); if (streak >= 3) fx.shake(3, 160); }
        else { streak = 0; block = { x: left, w: overlap }; if (moving.x < left) scraps.push({ x: moving.x, y: 425 - worldY + camera, w: left - moving.x, vy: -50, spin: -2.5, angle: 0 }); if (moving.x + moving.w > right) scraps.push({ x: right, y: 425 - worldY + camera, w: moving.x + moving.w - right, vy: -50, spin: 2.5, angle: 0 }); }
        blocks.push(block); floors++; score += 100 + (exact ? 25 * Math.min(8, streak) : 0); s.sound(exact ? 660 + Math.min(5, streak) * 55 : 390, .06); moving = { x: floors % 2 ? width - block.w : 0, w: block.w }; direction = floors % 2 ? -1 : 1; s.hud([['층수', floors], ['SCORE', score], ['연속 PERFECT', streak]]);
    };
    s.bindKeys(['Space'], place); s.on(canvas, 'pointerdown', () => { if (s.active()) place(); });
    s.run((dt) => {
        fx.update(dt); camera += (Math.max(0, (blocks.length - 10) * 25) - camera) * Math.min(1, dt * 8); moving.x += direction * (140 + Math.min(floors, 40) * 6) * dt; if (moving.x < 0 || moving.x + moving.w > width) {
            moving.x = Math.max(0, Math.min(width - moving.w, moving.x)); direction *= -1; } for (let i = scraps.length - 1; i >= 0; i--) {
                scraps[i].vy += 650 * dt; scraps[i].y += scraps[i].vy * dt; scraps[i].angle += scraps[i].spin * dt; if (scraps[i].y > height) scraps.splice(i, 1); } }, () => {
        // 높이 올라갈수록 하늘 색이 저녁 → 밤 → 별빛으로 바뀌어 '얼마나 높이 왔는지'가 보인다.
        const height01 = Math.min(1, floors / 60), sky = ctx.createLinearGradient(0, 0, 0, height); sky.addColorStop(0, `hsl(${222 - height01 * 20} 40% ${16 - height01 * 9}%)`); sky.addColorStop(1, `hsl(${200 + height01 * 30} 35% ${24 - height01 * 12}%)`); ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
        if (floors > 15) { ctx.globalAlpha = Math.min(1, (floors - 15) / 20) * .7; for (let k = 0; k < 30; k++) { const sx = (k * 97) % width, sy = ((k * 53 + camera * .3) % height); ctx.fillStyle = '#e8eef8'; ctx.fillRect(sx, sy, 1.5, 1.5); } ctx.globalAlpha = 1; }
        ctx.fillStyle = '#ffffff08'; for (let k = 0; k < 4; k++) { const cy = ((k * 140 + camera * .5) % (height + 80)) - 40; ctx.beginPath(); ctx.ellipse((k * 173) % width, cy, 70, 14, 0, 0, Math.PI * 2); ctx.fill(); }
        blocks.forEach((block, i) => { const y = 425 - i * 25 + camera; if (y > height || y < -30) return; rounded(ctx, block.x, y + 4, block.w, 22, `hsl(${155 + i * 9} 40% 42%)`, 3); rounded(ctx, block.x, y, block.w, 20, `hsl(${155 + i * 9} 48% 66%)`, 3); ctx.fillStyle = '#ffffff30'; ctx.fillRect(block.x + 3, y + 3, Math.max(0, block.w - 6), 3); });
        const below = blocks.at(-1), y = 425 - blocks.length * 25 + camera; ctx.setLineDash([3, 5]); ctx.strokeStyle = '#8ebd7c55'; ctx.strokeRect(below.x, y - 5, below.w, 32); ctx.setLineDash([]); rounded(ctx, moving.x, y, moving.w, 22, palette.green, 3); scraps.forEach((p) => { ctx.save(); ctx.translate(p.x + p.w / 2, p.y + 11); ctx.rotate(p.angle); rounded(ctx, -p.w / 2, -11, p.w, 22, '#c08f73', 2); ctx.restore(); }); text(ctx, `${Math.round(below.w)} px`, width / 2, 36, 14, palette.muted); fx.draw(ctx);
    }); s.hud([['층수', 0], ['SCORE', 0], ['연속 PERFECT', 0]]); s.message('Space / 클릭으로 놓기 · PERFECT 3연속부터 블록 폭을 조금 회복해요.'); s.ready('Stack Tower', '정확한 정렬을 이어가면 잘린 폭을 되찾을 수 있어요. 타이밍을 읽고 한 층씩 쌓으세요.');
};
