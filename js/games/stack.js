import { background, text, palette, rounded, clamp, wobble } from '../core.js';
import { effects } from '../effects.js';

export default (s) => {
    const width = 540, height = 480, { ctx, canvas } = s.canvas(width, height), blocks = [{ x: 150, w: 240 }], scraps = [], fx = effects(s); let moving = { x: 0, w: 240 }, direction = 1, floors = 0, perfect = 0, streak = 0, score = 0, camera = 0;
    const place = () => {
        const below = blocks.at(-1), left = Math.max(moving.x, below.x), right = Math.min(moving.x + moving.w, below.x + below.w), overlap = right - left, worldY = floors * 25 + 25;
        if (overlap <= 0) { fx.shake(7); s.sound(150, .2); s.finish({ score, recordText: `${floors}층 · ${score}점`, win: false, title: '한 층씩, 충분히 높이!', text: `${floors}층 · 완벽 정렬 ${perfect}번 · ${score}점` }); return; }
        const exact = Math.abs(moving.x - below.x) <= Math.min(5, below.w * .1); let block;
        if (exact) { streak++; perfect++; const growth = streak >= 3 ? 5 : 0; const grownWidth = Math.min(240, below.w + growth); block = { x: clamp(below.x - growth / 2, 0, width - grownWidth), w: grownWidth }; fx.label(width / 2, 150, streak >= 3 ? `PERFECT ×${streak} · +WIDTH` : 'PERFECT!', palette.green); fx.burst(block.x + block.w / 2, 425 - worldY + camera, palette.green, 12, 75); fx.ring(block.x + block.w / 2, 436 - worldY + camera, streak >= 3 ? palette.yellow : palette.green, block.w * .7, .45); }
        else { streak = 0; block = { x: left, w: overlap }; if (moving.x < left) scraps.push({ x: moving.x, y: 425 - worldY + camera, w: left - moving.x, vy: -50, spin: -2.5, angle: 0 }); if (moving.x + moving.w > right) scraps.push({ x: right, y: 425 - worldY + camera, w: moving.x + moving.w - right, vy: -50, spin: 2.5, angle: 0 }); }
        block.age = 0; blocks.push(block); floors++; score += 100 + (exact ? 25 * Math.min(8, streak) : 0); s.sound(exact ? 660 + Math.min(5, streak) * 55 : 390, .06); moving = { x: floors % 2 ? width - block.w : 0, w: block.w }; direction = floors % 2 ? -1 : 1; s.hud([['층수', floors], ['SCORE', score], ['연속 PERFECT', streak]]);
    };
    s.bindKeys(['Space'], place); s.on(canvas, 'pointerdown', () => { if (s.active()) place(); });
    s.run((dt) => {
        fx.update(dt); const top = blocks.at(-1); if (top.age !== undefined) top.age += dt; camera += (Math.max(0, (blocks.length - 10) * 25) - camera) * Math.min(1, dt * 8); moving.x += direction * (140 + Math.min(floors, 40) * 6) * dt; if (moving.x < 0 || moving.x + moving.w > width) {
            moving.x = Math.max(0, Math.min(width - moving.w, moving.x)); direction *= -1; } for (let i = scraps.length - 1; i >= 0; i--) {
                scraps[i].vy += 650 * dt; scraps[i].y += scraps[i].vy * dt; scraps[i].angle += scraps[i].spin * dt; if (scraps[i].y > height) scraps.splice(i, 1); } }, () => {
        background(ctx, width, height);
        blocks.forEach((block, i) => { const y = 425 - i * 25 + camera; if (y > height || y < -30) return; const w = block.age === undefined ? 0 : wobble(block.age, .22, 26, 8), bh = 22 * (1 - w), bw = block.w * (1 + w * .35); rounded(ctx, block.x + (block.w - bw) / 2, y + 22 - bh, bw, bh, `hsl(${155 + i * 9} 48% 66%)`, 4); });
        const below = blocks.at(-1), y = 425 - blocks.length * 25 + camera; ctx.setLineDash([3, 5]); ctx.strokeStyle = '#8ebd7c55'; ctx.strokeRect(below.x, y - 5, below.w, 32); ctx.setLineDash([]); rounded(ctx, moving.x, y, moving.w, 22, palette.green, 3); scraps.forEach((p) => { ctx.save(); ctx.translate(p.x + p.w / 2, p.y + 11); ctx.rotate(p.angle); ctx.globalAlpha = Math.max(0, 1 - (p.vy + 50) / 900); rounded(ctx, -p.w / 2, -11, p.w, 22, '#c08f73', 4); ctx.restore(); ctx.globalAlpha = 1; }); text(ctx, `${Math.round(below.w)} px`, width / 2, 36, 14, palette.muted); fx.draw(ctx);
    }); s.hud([['층수', 0], ['SCORE', 0], ['연속 PERFECT', 0]]); s.message('Space / 클릭으로 놓기 · PERFECT 3연속부터 블록 폭을 조금 회복해요.'); s.ready('Stack Tower', '정확한 정렬을 이어가면 잘린 폭을 되찾을 수 있어요. 타이밍을 읽고 한 층씩 쌓으세요.');
};
