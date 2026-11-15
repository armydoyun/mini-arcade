import { random, background, circle, palette, seededRandom } from '../core.js';
import { shortestMazePath } from '../rules.js';

export default (s) => {
    const rng = seededRandom(s.options.seed ?? random(1, 0xffffffff));
    const fog = s.options.mode === 'fog', size = fog ? 21 : 15, walls = Array.from({ length: size * size }, () => [true, true, true, true]), visited = new Set([0]), stack = [0], directions = [[0, -1], [1, 0], [0, 1], [-1, 0]], trail = new Set([0]), seen = new Set(); let player = 0, moves = 0, timer = 0, breadcrumbs = true, hint = [], px = 0, py = 0, lastCode = null;
    while (stack.length) { const i = stack.at(-1), x = i % size, y = Math.floor(i / size), choices = directions.map(([dx, dy], d) => ({ x: x + dx, y: y + dy, d })).filter((v) => v.x >= 0 && v.y >= 0 && v.x < size && v.y < size && !visited.has(v.y * size + v.x)); if (!choices.length) { stack.pop(); continue; } const choice = choices[Math.floor(rng() * choices.length)], next = choice.y * size + choice.x; walls[i][choice.d] = false; walls[next][(choice.d + 2) % 4] = false; visited.add(next); stack.push(next); }
    const optimal = shortestMazePath(walls, size).length - 1, cell = 450 / size, offset = 15, { ctx } = s.canvas(480, 480);
    const discover = () => { const x = player % size, y = Math.floor(player / size); for (let yy = 0; yy < size; yy++) for (let xx = 0; xx < size; xx++) if (Math.hypot(xx - x, yy - y) <= 3.5) seen.add(yy * size + xx); }; discover();
    const hud = () => s.hud([['이동', moves], ['탐색', `${Math.round((fog ? seen.size : trail.size) / walls.length * 100)}%`], ['출구', '↘ 오른쪽 아래']]);
    const move = (code) => {
        const mapped = { KeyW: 'ArrowUp', KeyD: 'ArrowRight', KeyS: 'ArrowDown', KeyA: 'ArrowLeft' }[code] || code, d = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].indexOf(mapped);
        if (d < 0 || walls[player][d]) return;
        if (!moves) s.startClock();
        s.changed();
        player += directions[d][1] * size + directions[d][0];
        moves++;
        trail.add(player);
        hint = [];
        discover();
        hud();
        if (player === walls.length - 1) {
            px = player % size;
            py = Math.floor(player / size);
            const efficiency = Math.round(optimal / moves * 1000) / 10;
            s.finish({ score: efficiency, order: 'high', recordText: `${efficiency}% 효율 · ${moves}회`, title: '초록빛 출구에 도착!', text: `${moves}번 이동 · 최단 경로 대비 효율 ${efficiency}% · ${Math.floor(s.elapsed() + 1e-7)}초` });
        }
    };
    const help = () => { hint = shortestMazePath(walls, size, player).slice(0, 4); s.assist(); s.message('노란 점이 출구로 향하는 다음 세 칸이에요.'); };
    const input = (code) => { if (code === 'KeyH') help(); else if (code === 'KeyT') { breadcrumbs = !breadcrumbs; trailButton.textContent = `이동 흔적 ${breadcrumbs ? '켜짐' : '꺼짐'} · T`; trailButton.setAttribute('aria-pressed', breadcrumbs); trailButton.title = trailButton.textContent; } else { lastCode = code; move(code); timer = .16; } };
    const controls = s.controls([{ label: '이동 흔적 켜짐 · T', action: () => input('KeyT') }, { label: '세 칸 힌트 · H', action: help }]), trailButton = controls.children[0]; trailButton.setAttribute('aria-pressed', true);
    s.bindKeys(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyH', 'KeyT'], input);
    s.run((dt) => {
        timer -= dt; px += (player % size - px) * Math.min(1, dt * 24); py += (Math.floor(player / size) - py) * Math.min(1, dt * 24); if (timer <= 0) {
            const code = lastCode && s.down(lastCode) ? lastCode : ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].find((key) => s.down(key)); if (code) {
                move(code); timer = .095; } } }, () => {
        background(ctx, 480, 480); ctx.lineWidth = 1.8;
        walls.forEach((sides, i) => {
            if (fog && !seen.has(i)) return;
            const x = offset + i % size * cell, y = offset + Math.floor(i / size) * cell, lit = !fog || Math.hypot(i % size - player % size, Math.floor(i / size) - Math.floor(player / size)) <= 3.5;
            ctx.strokeStyle = lit ? '#8a9db3' : '#384456';
            ctx.beginPath();
            if (sides[0]) {
                ctx.moveTo(x, y);
                ctx.lineTo(x + cell, y);
            } if (sides[1]) {
                ctx.moveTo(x + cell, y);
                ctx.lineTo(x + cell, y + cell);
            } if (sides[2]) {
                ctx.moveTo(x, y + cell);
                ctx.lineTo(x + cell, y + cell);
            } if (sides[3]) {
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + cell);
            }
            ctx.stroke();
            if (breadcrumbs && trail.has(i)) circle(ctx, x + cell / 2, y + cell / 2, 2, '#698f7f');
        });
        hint.slice(1).forEach((i) => circle(ctx, offset + i % size * cell + cell / 2, offset + Math.floor(i / size) * cell + cell / 2, 3, palette.yellow)); ctx.fillStyle = '#b9f86b35'; ctx.fillRect(offset + (size - 1) * cell + 3, offset + (size - 1) * cell + 3, cell - 6, cell - 6); circle(ctx, offset + px * cell + cell / 2, offset + py * cell + cell / 2, cell * .26, palette.green);
    }); hud(); s.message(fog ? '안개 너머는 직접 탐색하세요. 지나온 지역은 지도에 남아요.' : 'R 같은 미로 · N 새 미로 · T 이동 흔적 · H 세 칸 힌트.'); s.ready('미로 탈출', fog ? '주변만 보이는 안개 미로예요. 출구는 오른쪽 아래에 있어요.' : '방향키 또는 WASD로 이동해요. 길을 헤매도 지나온 흔적이 도와줘요.');
};
