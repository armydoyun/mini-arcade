import { random, palette, rounded, circle } from '../core.js';
import { effects } from '../effects.js';

// 20×20 판을 12px 벽 안쪽에 그린다. 칸은 체크무늬로 또렷하게, 바깥 경계는 클래식·고속에서는 단단한 벽,
// 경계 통과에서는 반대편으로 이어지는 빛나는 점선 포털로 그려 어디까지가 판인지 한눈에 보이게 한다.
export default (s) => {
    const size = 20, cell = 24, wall = 12, side = size * cell + wall * 2, { ctx } = s.canvas(side, side), fx = effects(s), body = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }], turns = [];
    const wrap = s.options.mode === 'wrap', rush = s.options.mode === 'rush'; let direction = { x: 1, y: 0 }, food, bonus = null, score = 0, eaten = 0, timer = 0, foodAge = 0, gulps = [];
    const px = (v) => wall + v * cell, center = (v) => wall + v * cell + cell / 2;
    // 속도는 먹은 먹이 수로만 오른다. 보너스 점수로 갑자기 빨라지지 않는다.
    const interval = () => 1 / Math.min(rush ? 20 : 15, (rush ? 11 : 7) + eaten / 9);
    const free = () => { const empty = []; for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!body.some((p) => p.x === x && p.y === y) && !(food && food.x === x && food.y === y) && !(bonus && bonus.x === x && bonus.y === y)) empty.push({ x, y }); return empty; };
    const spawn = () => { food = null; const empty = free(); food = empty[random(0, empty.length - 1)]; foodAge = 0; };
    // 다섯 개마다 잠깐 나타나는 황금 별: 남은 시간이 많을수록 높은 점수. 짧은 우회로 위험을 감수할지 고르는 재미.
    const BONUS_LIFE = 6;
    const spawnBonus = () => { const empty = free().filter((p) => Math.abs(p.x - body[0].x) + Math.abs(p.y - body[0].y) >= 6); if (empty.length) bonus = { ...empty[random(0, empty.length - 1)], life: BONUS_LIFE }; };
    const hud = () => s.hud([['SCORE', score], ['길이', body.length], ['속도', `${(1 / interval()).toFixed(1)}칸/초`], ['황금 별', bonus ? `${Math.ceil(bonus.life)}초` : `${5 - eaten % 5}개 뒤`]]);
    const steer = (code) => { const next = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] }[code]; if (!next || turns.length >= 2) return; const last = turns.at(-1) || direction; if (next[0] === last.x && next[1] === last.y) return; if (next[0] !== -last.x || next[1] !== -last.y) turns.push({ x: next[0], y: next[1] }); };
    s.bindKeys(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD'], steer); spawn(); hud();
    s.run((dt) => {
        fx.update(dt); foodAge += dt;
        if (bonus) { const before = Math.ceil(bonus.life); bonus.life -= dt; if (bonus.life <= 0) { fx.burst(center(bonus.x), center(bonus.y), '#f5d47d88', 8, 40); bonus = null; hud(); } else if (Math.ceil(bonus.life) !== before) hud(); }
        timer += dt; if (timer < interval()) return; timer -= interval();
        const head = { x: body[0].x + direction.x, y: body[0].y + direction.y }; if (wrap) { head.x = (head.x + size) % size; head.y = (head.y + size) % size; }
        const eating = head.x === food.x && head.y === food.y, golden = bonus && head.x === bonus.x && head.y === bonus.y, grow = eating || golden;
        if (head.x < 0 || head.y < 0 || head.x >= size || head.y >= size || body.slice(0, grow ? body.length : -1).some((p) => p.x === head.x && p.y === head.y)) {
            fx.burst(center(body[0].x), center(body[0].y), palette.coral, 28, 140); fx.ring(center(body[0].x), center(body[0].y), palette.coral, 60); fx.flash(palette.coral); fx.shake(7); s.sound(140, .2);
            s.finish({ score, win: false, title: '길어진 만큼 잘했어요!', text: `${score}점 · 길이 ${body.length}칸 · ${Math.round(s.elapsed())}초` }); return;
        }
        body.unshift(head); gulps = gulps.map((g) => g + 1).filter((g) => g < body.length);
        if (!grow) body.pop();
        if (eating) {
            eaten++; score += 10; gulps.push(0); fx.burst(center(food.x), center(food.y), palette.coral, 14, 110); fx.ring(center(food.x), center(food.y), '#ff8e7a', 30, .3); s.sound(560 + (eaten % 5) * 40);
            if (body.length === size * size) { hud(); s.finish({ score, title: '완벽한 스네이크!', text: '400칸을 전부 채웠어요.' }); return; }
            spawn(); if (eaten % 5 === 0 && !bonus) spawnBonus();
        }
        if (golden) { const gain = 20 + Math.ceil(bonus.life) * 10; score += gain; gulps.push(0); fx.burst(center(bonus.x), center(bonus.y), palette.yellow, 26, 150); fx.ring(center(bonus.x), center(bonus.y), palette.yellow, 54); fx.label(center(bonus.x), px(bonus.y) - 4, `★ +${gain}`, palette.yellow); s.sound(880, .09); bonus = null; }
        if (turns.length) direction = turns.shift(); hud();
    }, () => {
        // 판: 체크무늬 칸 + 단단한 벽(또는 포털 점선). 칸 경계가 흐려 보이지 않도록 명도 차이를 분명히 둔다.
        ctx.fillStyle = wrap ? '#132a26' : '#3a2f33'; ctx.fillRect(0, 0, side, side);
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { ctx.fillStyle = (x + y) % 2 ? '#1a2430' : '#212d3b'; ctx.fillRect(px(x), px(y), cell, cell); }
        ctx.strokeStyle = '#ffffff10'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 1; k < size; k++) { ctx.moveTo(px(k) + .5, wall); ctx.lineTo(px(k) + .5, side - wall); ctx.moveTo(wall, px(k) + .5); ctx.lineTo(side - wall, px(k) + .5); } ctx.stroke();
        if (wrap) {
            ctx.strokeStyle = `rgba(185, 248, 107, ${.55 + Math.sin(s.time * 4) * .2})`; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -s.time * 30; ctx.strokeRect(wall - 2, wall - 2, side - wall * 2 + 4, side - wall * 2 + 4); ctx.setLineDash([]); ctx.lineDashOffset = 0;
        } else {
            for (let k = 0; k < side; k += 24) for (const [x, y, w, h] of [[k, 0, 22, wall - 2], [k, side - wall + 2, 22, wall - 2], [0, k, wall - 2, 22], [side - wall + 2, k, wall - 2, 22]]) rounded(ctx, x + 1, y + 1, w, h, '#6a5257', 3);
            ctx.strokeStyle = '#ff8e7a88'; ctx.lineWidth = 2; ctx.strokeRect(wall - 1, wall - 1, side - wall * 2 + 2, side - wall * 2 + 2);
        }
        ctx.lineWidth = 1;
        if (food) { // 사과: 나타날 때 톡 튀어나오고 가볍게 숨 쉰다
            const pop = Math.min(1, foodAge * 6), r = (7 + Math.sin(s.time * 5) * .7) * (pop < 1 ? pop * 1.25 : 1), x = center(food.x), y = center(food.y);
            circle(ctx, x, y, r + 5, '#ff8e7a1c'); circle(ctx, x, y + 1, r, palette.coral); circle(ctx, x - r * .35, y - r * .3, r * .3, '#ffd2c8');
            ctx.fillStyle = '#8bd36a'; ctx.beginPath(); ctx.ellipse(x + 3, y - r - 1, 3.5, 1.8, -.6, 0, Math.PI * 2); ctx.fill();
        }
        if (bonus) { // 황금 별과 남은 시간 고리
            const x = center(bonus.x), y = center(bonus.y), blink = bonus.life < 2 && Math.floor(s.time * 8) % 2;
            ctx.strokeStyle = '#f5d47d'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * bonus.life / BONUS_LIFE); ctx.stroke(); ctx.lineWidth = 1;
            if (!blink) { ctx.save(); ctx.translate(x, y); ctx.rotate(s.time * 1.5); ctx.fillStyle = palette.yellow; ctx.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 3.4 : 8, a = k * Math.PI / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.restore(); }
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
                rounded(ctx, bx + inset, by + inset, cell - inset * 2, cell - inset * 2, i ? `hsl(${96 - (i % 2) * 6} 48% ${Math.max(34, 64 - i * .4)}%)` : palette.green, i ? 6 : 8);
                if (i) { ctx.fillStyle = '#ffffff1c'; ctx.fillRect(bx + inset + 3, by + inset + 2, cell - inset * 2 - 6, 2); }
                if (!i) {
                    for (const sgn of [-1, 1]) { const ex = bx + 12 + direction.x * 4 + direction.y * sgn * 5, ey = by + 12 + direction.y * 4 + direction.x * sgn * 5; circle(ctx, ex, ey, 3.2, '#f4ffe6'); circle(ctx, ex + direction.x, ey + direction.y, 1.6, '#1b2a14'); }
                    if (Math.sin(s.time * 3) > .6) { ctx.strokeStyle = palette.coral; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + 12 + direction.x * 11, by + 12 + direction.y * 11); ctx.lineTo(bx + 12 + direction.x * 16, by + 12 + direction.y * 16); ctx.stroke(); ctx.lineWidth = 1; }
                }
            });
            ctx.restore();
        }
        fx.draw(ctx);
    }); s.message(wrap ? '가장자리의 빛나는 점선은 반대편으로 이어지는 통로예요. 몸통만 피하세요.' : '붉은 벽에 닿으면 끝나요. 먹이 다섯 개마다 황금 별이 잠깐 나타나요. 빨리 먹을수록 점수가 커요!'); s.ready('스네이크', wrap ? '화면을 넘나들며 먹이를 모으세요. 먹이 다섯 개마다 나타나는 황금 별은 6초 안에 먹으면 보너스예요.' : '벽과 몸통을 피해 먹이를 모으세요. 먹이 다섯 개마다 6초 동안 황금 별이 나타나요. 방향키 또는 WASD로 조작해요.');
};
