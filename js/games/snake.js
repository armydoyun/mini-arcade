import { random, palette, rounded, circle } from '../core.js';
import { effects } from '../effects.js';

// 20×20 판을 12px 여백 안쪽에 그린다. 칸은 옅은 체크무늬로 또렷하게, 경계는 클래식·고속은 붉은 실선(닿으면 끝),
// 경계 통과는 초록 점선(반대편으로 이어짐) 한 줄로만 표시해 어디까지가 판인지 한눈에 보이게 한다.
export default (s) => {
    const size = 20, cell = 24, wall = 12, side = size * cell + wall * 2, { ctx } = s.canvas(side, side), fx = effects(s), body = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }], turns = [];
    const wrap = s.options.mode === 'wrap', rush = s.options.mode === 'rush'; let direction = { x: 1, y: 0 }, food, bonus = null, score = 0, eaten = 0, timer = 0, foodAge = 0, gulps = [];
    const px = (v) => wall + v * cell, center = (v) => wall + v * cell + cell / 2;
    // 속도는 먹은 먹이 수로만 오른다. 보너스 점수로 갑자기 빨라지지 않는다.
    const interval = () => 1 / Math.min(rush ? 20 : 15, (rush ? 11 : 7) + eaten / 9);
    const free = () => { const empty = []; for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!body.some((p) => p.x === x && p.y === y) && !(food && food.x === x && food.y === y) && !(bonus && bonus.x === x && bonus.y === y)) empty.push({ x, y }); return empty; };
    const spawn = () => { food = null; const empty = free(); food = empty[random(0, empty.length - 1)]; foodAge = 0; };
    // 다섯 개마다 잠깐 나타나는 보너스: 남은 시간이 많을수록 높은 점수. 짧은 우회로 위험을 감수할지 고르는 재미.
    const BONUS_LIFE = 6;
    const spawnBonus = () => { const empty = free().filter((p) => Math.abs(p.x - body[0].x) + Math.abs(p.y - body[0].y) >= 6); if (empty.length) bonus = { ...empty[random(0, empty.length - 1)], life: BONUS_LIFE }; };
    const hud = () => s.hud([['SCORE', score], ['길이', body.length], ['속도', `${(1 / interval()).toFixed(1)}칸/초`], ['보너스', bonus ? `${Math.ceil(bonus.life)}초` : `${5 - eaten % 5}개 뒤`]]);
    const steer = (code) => { const next = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] }[code]; if (!next || turns.length >= 2) return; const last = turns.at(-1) || direction; if (next[0] === last.x && next[1] === last.y) return; if (next[0] !== -last.x || next[1] !== -last.y) turns.push({ x: next[0], y: next[1] }); };
    s.bindKeys(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD'], steer); spawn(); hud();
    s.run((dt) => {
        fx.update(dt); foodAge += dt;
        if (bonus) { const before = Math.ceil(bonus.life); bonus.life -= dt; if (bonus.life <= 0) { bonus = null; hud(); } else if (Math.ceil(bonus.life) !== before) hud(); }
        timer += dt; if (timer < interval()) return; timer -= interval();
        const head = { x: body[0].x + direction.x, y: body[0].y + direction.y }; if (wrap) { head.x = (head.x + size) % size; head.y = (head.y + size) % size; }
        const eating = head.x === food.x && head.y === food.y, golden = bonus && head.x === bonus.x && head.y === bonus.y, grow = eating || golden;
        if (head.x < 0 || head.y < 0 || head.x >= size || head.y >= size || body.slice(0, grow ? body.length : -1).some((p) => p.x === head.x && p.y === head.y)) {
            fx.burst(center(body[0].x), center(body[0].y), palette.coral, 14, 90); fx.shake(4); s.sound(140, .2);
            s.finish({ score, win: false, title: '길어진 만큼 잘했어요!', text: `${score}점 · 길이 ${body.length}칸 · ${Math.round(s.elapsed())}초` }); return;
        }
        body.unshift(head); gulps = gulps.map((g) => g + 1).filter((g) => g < body.length);
        if (!grow) body.pop();
        if (eating) {
            eaten++; score += 10; gulps.push(0); fx.ring(center(food.x), center(food.y), palette.coral, 22, .3); s.sound(560 + (eaten % 5) * 40);
            if (body.length === size * size) { hud(); s.finish({ score, title: '완벽한 스네이크!', text: '400칸을 전부 채웠어요.' }); return; }
            spawn(); if (eaten % 5 === 0 && !bonus) spawnBonus();
        }
        if (golden) { const gain = 20 + Math.ceil(bonus.life) * 10; score += gain; gulps.push(0); fx.ring(center(bonus.x), center(bonus.y), palette.yellow, 34); fx.label(center(bonus.x), px(bonus.y) - 4, `+${gain}`, palette.yellow); s.sound(880, .09); bonus = null; }
        if (turns.length) direction = turns.shift(); hud();
    }, () => {
        // 판: 체크무늬 칸 + 단단한 벽(또는 포털 점선). 칸 경계가 흐려 보이지 않도록 명도 차이를 분명히 둔다.
        ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, side, side);
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { ctx.fillStyle = (x + y) % 2 ? '#19212c' : '#202b38'; ctx.fillRect(px(x), px(y), cell, cell); }
        ctx.strokeStyle = '#ffffff0d'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 1; k < size; k++) { ctx.moveTo(px(k) + .5, wall); ctx.lineTo(px(k) + .5, side - wall); ctx.moveTo(wall, px(k) + .5); ctx.lineTo(side - wall, px(k) + .5); } ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = wrap ? '#b9f86b99' : '#ff8e7acc'; if (wrap) { ctx.setLineDash([8, 6]); ctx.lineDashOffset = -s.time * 12; }
        ctx.beginPath(); ctx.roundRect(wall - 3, wall - 3, side - wall * 2 + 6, side - wall * 2 + 6, 6); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
        ctx.lineWidth = 1;
        if (food) { // 먹이: 나타날 때 부드럽게 커지고 아주 가볍게 숨 쉰다
            const grow = Math.min(1, foodAge * 5), ease = 1 - (1 - grow) ** 3;
            circle(ctx, center(food.x), center(food.y), (7 + Math.sin(s.time * 4) * .5) * ease, palette.coral);
        }
        if (bonus) { // 보너스: 노란 점 + 남은 시간을 보여 주는 얇은 고리. 마지막 2초는 천천히 깜빡인다
            const x = center(bonus.x), y = center(bonus.y);
            ctx.globalAlpha = bonus.life < 2 ? .45 + Math.abs(Math.sin(s.time * 5)) * .55 : 1;
            ctx.strokeStyle = palette.yellow; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * bonus.life / BONUS_LIFE); ctx.stroke(); ctx.lineWidth = 1;
            circle(ctx, x, y, 5.5, palette.yellow); ctx.globalAlpha = 1;
        }
        const fraction = Math.min(1, timer / interval());
        for (let i = body.length - 1; i >= 0; i--) {
            const part = body[i];
            let target = i ? { ...body[i - 1] } : { x: part.x + direction.x, y: part.y + direction.y };
            if (wrap) {
                if (target.x - part.x > size / 2) target.x -= size;
                if (target.x - part.x < -size / 2) target.x += size;
                if (target.y - part.y > size / 2) target.y -= size;
                if (target.y - part.y < -size / 2) target.y += size;
            }
            const x = (part.x + (target.x - part.x) * fraction) * cell, y = (part.y + (target.y - part.y) * fraction) * cell;
            const positions = wrap ? [[x, y], [x < 0 ? x + size * cell : x - size * cell, y], [x, y < 0 ? y + size * cell : y - size * cell]] : [[x, y]];
            const fat = gulps.includes(i) ? 3 : 0, taper = Math.max(0, Math.min(3, (i - body.length + 4))), inset = 2 - fat + taper;
            ctx.save(); ctx.beginPath(); ctx.rect(wall, wall, size * cell, size * cell); ctx.clip();
            positions.forEach(([xx, yy]) => {
                const bx = wall + xx, by = wall + yy;
                rounded(ctx, bx + inset, by + inset, cell - inset * 2, cell - inset * 2, i ? `hsl(92 46% ${Math.max(36, 62 - i * .4)}%)` : palette.green, 7);
                if (!i) for (const sgn of [-1, 1]) circle(ctx, bx + 12 + direction.x * 4 + direction.y * sgn * 4.5, by + 12 + direction.y * 4 + direction.x * sgn * 4.5, 2, '#24371a');
            });
            ctx.restore();
        }
        fx.draw(ctx);
    }); s.message(wrap ? '초록 점선 테두리는 반대편으로 이어져요. 몸통만 피하세요.' : '붉은 벽에 닿으면 끝나요. 먹이 다섯 개마다 보너스이 잠깐 나타나요. 빨리 먹을수록 점수가 커요!'); s.ready('스네이크', wrap ? '화면을 넘나들며 먹이를 모으세요. 먹이 다섯 개마다 나타나는 보너스은 6초 안에 먹으면 보너스예요.' : '벽과 몸통을 피해 먹이를 모으세요. 먹이 다섯 개마다 6초 동안 보너스이 나타나요. 방향키 또는 WASD로 조작해요.');
};
