import { random, background, palette, rounded, circle } from '../core.js';
import { effects } from '../effects.js';

export default (s) => {
    const size = 20, cell = 24, { ctx } = s.canvas(480, 480), fx = effects(s), body = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }], turns = [];
    const wrap = s.options.mode === 'wrap', rush = s.options.mode === 'rush'; let direction = { x: 1, y: 0 }, food, score = 0, timer = 0;
    const interval = () => 1 / Math.min(rush ? 20 : 15, (rush ? 11 : 7) + score / 90);
    const spawn = () => { const empty = []; for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!body.some((p) => p.x === x && p.y === y)) empty.push({ x, y }); food = empty[random(0, empty.length - 1)]; };
    const hud = () => s.hud([['SCORE', score], ['길이', body.length], ['속도', `${(1 / interval()).toFixed(1)}칸/초`]]);
    const steer = (code) => { const next = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] }[code]; if (!next || turns.length >= 2) return; const last = turns.at(-1) || direction; if (next[0] === last.x && next[1] === last.y) return; if (next[0] !== -last.x || next[1] !== -last.y) turns.push({ x: next[0], y: next[1] }); };
    s.bindKeys(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD'], steer); spawn(); hud();
    s.run((dt) => {
        fx.update(dt); timer += dt; if (timer < interval()) return; timer -= interval(); 
        const head = { x: body[0].x + direction.x, y: body[0].y + direction.y }; if (wrap) { head.x = (head.x + size) % size; head.y = (head.y + size) % size; }
        const eating = head.x === food.x && head.y === food.y;
        if (head.x < 0 || head.y < 0 || head.x >= size || head.y >= size || body.slice(0, eating ? body.length : -1).some((p) => p.x === head.x && p.y === head.y)) { fx.burst(body[0].x * cell + 12, body[0].y * cell + 12, palette.coral, 24); s.finish({ score, win: false, title: '길어진 만큼 잘했어요!', text: `${score}점 · 길이 ${body.length}칸 · ${Math.round(s.elapsed())}초` }); return; }
        body.unshift(head); if (!eating) body.pop(); else { score += 10; fx.burst(food.x * cell + 12, food.y * cell + 12, palette.yellow); s.sound(620); if (body.length === size * size) { hud(); s.finish({ score, title: '완벽한 스네이크!', text: '400칸을 전부 채웠어요.' }); return; } spawn(); } if (turns.length) direction = turns.shift(); hud();
    }, () => {
        background(ctx, 480, 480, cell); if (wrap) { ctx.strokeStyle = '#8dcf7055'; ctx.setLineDash([8, 8]); ctx.strokeRect(1, 1, 478, 478); ctx.setLineDash([]); }
        if (food) { circle(ctx, food.x * cell + 12, food.y * cell + 12, 11 + Math.sin(s.time * 5) * 2, '#ff8e7a16'); circle(ctx, food.x * cell + 12, food.y * cell + 12, 7, palette.coral); }
        const fraction = Math.min(1, timer / interval());
        body.forEach((part, i) => {
            let target = i ? { ...body[i - 1] } : { x: part.x + direction.x, y: part.y + direction.y };
            if (wrap) {
                if (target.x - part.x > size / 2) target.x -= size;
                if (target.x - part.x < -size / 2) target.x += size;
                if (target.y - part.y > size / 2) target.y -= size;
                if (target.y - part.y < -size / 2) target.y += size;
            }
            const x = (part.x + (target.x - part.x) * fraction) * cell, y = (part.y + (target.y - part.y) * fraction) * cell;
            const positions = wrap ? [[x, y], [x < 0 ? x + 480 : x - 480, y], [x, y < 0 ? y + 480 : y - 480]] : [[x, y]];
            positions.forEach(([xx, yy]) => {
                rounded(ctx, xx + 2, yy + 2, 20, 20, i ? `hsl(91 44% ${Math.max(32, 65 - i * .45)}%)` : palette.green, 6);
                if (!i) for (const sign of [-1, 1]) circle(ctx, xx + 12 + direction.x * 5 + direction.y * sign * 4, yy + 12 + direction.y * 5 + direction.x * sign * 4, 1.8, '#24371a');
            });
        });
        fx.draw(ctx);
    }); s.message(wrap ? '가장자리는 반대편으로 이어져요. 몸통은 피하세요.' : '방향 입력을 두 번까지 미리 받을 수 있어요. 꼬리가 빠진 칸으로 이동할 수 있어요.'); s.ready('스네이크', wrap ? '화면을 넘나들며 먹이를 모으세요. 길이와 함께 난이도가 올라가요.' : '먹이를 모으고 길게 살아남으세요. 방향키 또는 WASD로 조작해요.');
};
