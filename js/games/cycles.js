import { background, palette, duelFinish, text, clamp } from '../core.js';

export default (s) => {
    const columns = 40, rows = 28, cell = 15, { ctx } = s.canvas(columns * cell, rows * cell), wins = [0, 0], target = s.options.mode === 'sudden' ? 1 : 3; let board, riders, timer = 0, roundTime = 0, round = 1, crashes = [];
    const setup = () => { board = Array(columns * rows).fill(0); riders = round % 3 === 2 ? [{ x: 20, y: 5, dx: 0, dy: 1, turns: [] }, { x: 20, y: 22, dx: 0, dy: -1, turns: [] }] : [{ x: 9, y: round % 3 ? 14 : 8, dx: 1, dy: 0, turns: [] }, { x: 30, y: round % 3 ? 14 : 19, dx: -1, dy: 0, turns: [] }]; riders.forEach((rider, i) => { board[rider.y * columns + rider.x] = i + 1; }); timer = roundTime = 0; crashes = []; };
    const hud = () => s.hud([['P1 · WASD', `${wins[0]}승`, 'p1'], [`ROUND ${round}`, `먼저 ${target}승`], ['P2 · 방향키', `${wins[1]}승`, 'p2']]);
    const steer = (player, dx, dy) => { const rider = riders[player], last = rider.turns.at(-1) || rider; if (rider.turns.length < 2 && (dx !== last.dx || dy !== last.dy) && (dx !== -last.dx || dy !== -last.dy)) rider.turns.push({ dx, dy }); };
    const bindings = { KeyW: [0, 0, -1], KeyS: [0, 0, 1], KeyA: [0, -1, 0], KeyD: [0, 1, 0], ArrowUp: [1, 0, -1], ArrowDown: [1, 0, 1], ArrowLeft: [1, -1, 0], ArrowRight: [1, 1, 0] };
    s.bindKeys(Object.keys(bindings), (code) => steer(...bindings[code])); setup(); hud();
    s.run((dt) => {
        roundTime += dt; if (roundTime < .65) return; timer += dt; const interval = Math.max(.078, .115 - Math.min(6, round - 1) * .006); if (timer < interval) return; timer -= interval;
        const next = riders.map((rider) => { if (rider.turns.length) Object.assign(rider, rider.turns.shift()); return { x: rider.x + rider.dx, y: rider.y + rider.dy }; }), collisions = next.map((p) => p.x < 0 || p.y < 0 || p.x >= columns || p.y >= rows || !!board[p.y * columns + p.x]); if (next[0].x === next[1].x && next[0].y === next[1].y) collisions[0] = collisions[1] = true;
        if (collisions.some(Boolean)) {
            crashes = next.filter((_, i) => collisions[i]); const winner = collisions.every(Boolean) ? 0 : collisions[0] ? 2 : 1; if (winner) wins[winner - 1]++; hud(); s.sound(winner ? 660 : 220, .12);
            if ((winner && wins[winner - 1] >= target) || (target === 1 && !winner)) { duelFinish(s, winner, `P1 ${wins[0]}승 : ${wins[1]}승 P2 · ${round}라운드 승부`); return; }
            const title = winner ? `P${winner} 라운드 승리!` : '동시 충돌 · 무승부!'; s.message(`${title} 다음 판은 출발 위치가 바뀌고 조금 빨라져요.`); s.ready(title, `P1 ${wins[0]}승 · P2 ${wins[1]}승. 먼저 ${target}승! 둘 다 준비되면 다음 라운드를 시작하세요.`, () => { round++; setup(); hud(); }); return;
        }
        riders.forEach((rider, i) => { Object.assign(rider, next[i]); board[rider.y * columns + rider.x] = i + 1; });
    }, () => {
        background(ctx, columns * cell, rows * cell, cell);
        board.forEach((owner, i) => {
            if (owner) {
                ctx.fillStyle = owner === 1 ? '#aa554c' : '#456c9d';
                ctx.fillRect(i % columns * cell + 2, Math.floor(i / columns) * cell + 2, cell - 4, cell - 4);
            }
            });
        riders.forEach((rider, i) => {
            ctx.fillStyle = i === 0 ? palette.coral : palette.blue;
            ctx.fillRect(rider.x * cell + 1, rider.y * cell + 1, cell - 2, cell - 2);
            ctx.fillStyle = '#fff';
            ctx.fillRect(rider.x * cell + 6 + rider.dx * 4, rider.y * cell + 6 + rider.dy * 4, 3, 3);
        });
        crashes.forEach((p) => {
            const x = clamp(p.x * cell + 7, 8, columns * cell - 8), y = clamp(p.y * cell + 7, 8, rows * cell - 8);
            ctx.strokeStyle = '#fff0c5';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 6, y - 6);
            ctx.lineTo(x + 6, y + 6);
            ctx.moveTo(x + 6, y - 6);
            ctx.lineTo(x - 6, y + 6);
            ctx.stroke();
        });
        if (roundTime < .65) text(ctx, 'READY', 300, 50, 18, palette.muted);
    }); s.message('P1 WASD · P2 방향키 · 이동 예약 2회 · 바깥 벽과 모든 궤적이 충돌 대상이에요.'); s.ready('Light Cycles', `두 사람의 다음 칸을 동시에 판정해요. 같은 칸·맞충돌은 무승부! 먼저 ${target}라운드를 이기세요.`);
};
