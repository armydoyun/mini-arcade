import { shuffle, background, text, palette, rounded, formatTime } from '../core.js';
import { tetrisShapes, rotateMatrix, tetrisFits } from '../rules.js';
import { effects } from '../effects.js';

const colors = ['#82d6e8', '#f5d47d', '#c1a0ff', '#82b6ff', '#e5a36e', '#b9f86b', '#ff8e7a'];
export default (s) => {
    const board = Array.from({ length: 20 }, () => Array(10).fill(0)), { ctx } = s.canvas(400, 560), fx = effects(s);
    const sprint = s.options.mode === 'sprint'; let flashes = [], landed = null, bag = [], queue = [], current, held = null, heldUsed = false, score = 0, lines = 0, gravity = 0, repeat = .15, lockTime = 0, resets = 0, lastDirection = 1, combo = -1, bestCombo = 0, lastTimer = -1, backToBack = false;
    const pick = () => { if (!bag.length) bag = shuffle([0, 1, 2, 3, 4, 5, 6]); return bag.pop(); };
    const take = () => { while (queue.length < 4) queue.push(pick()); return queue.shift(); };
    const fits = (shape, x, y) => tetrisFits(board, shape, x, y);
    const hud = () => s.hud(sprint ? [['TIME', formatTime(s.elapsed(), true)], ['LINES', `${lines} / 40`], ['SCORE', score]] : [['SCORE', score], ['LINES', lines], ['LEVEL', Math.floor(lines / 10) + 1]]);
    const lose = () => s.finish({ score: sprint ? 0 : score, order: sprint ? 'low' : 'high', title: '다음 한 판은 더 높이!', text: `${score.toLocaleString()}점 · ${lines}줄 · 최대 ${bestCombo}콤보.`, win: false });
    const spawn = (type = take(), holding = false) => { const shape = tetrisShapes[type].map((row) => [...row]); current = { shape, type, x: Math.floor((10 - shape[0].length) / 2), y: 0 }; gravity = lockTime = resets = 0; heldUsed = holding; if (!fits(shape, current.x, current.y)) lose(); };
    const lock = () => {
        if (current.shape.some((row, y) => row.some((value) => value && current.y + y < 0))) { lose(); return; }
        current.shape.forEach((row, y) => row.forEach((value, x) => { if (value) board[current.y + y][current.x + x] = current.type + 1; }));
        let cleared = 0; const full = board.flatMap((row, y) => row.every(Boolean) ? [y] : []);
        // 지운 줄은 잠깐 하얗게 번쩍이며 사라지는 잔상으로 남긴다(판정은 즉시 끝나 있다). 착지한 블록도 살짝 빛난다.
        full.forEach((y) => flashes.push({ y, age: 0, tetris: full.length === 4 })); landed = { cells: current.shape.flatMap((row, y) => row.flatMap((v, x) => v ? [[current.x + x, current.y + y - full.filter((fy) => fy > current.y + y).length]] : [])), age: 0 };
        for (let y = 19; y >= 0; y--) if (board[y].every(Boolean)) { fx.burst(140, 46 + y * 24, palette.green, 22, 180); board.splice(y, 1); board.unshift(Array(10).fill(0)); cleared++; y++; }
        if (cleared) { combo++; bestCombo = Math.max(bestCombo, combo + 1); let gain = [0, 100, 300, 500, 800][cleared]; if (cleared === 4 && backToBack) gain *= 1.5; gain += Math.max(0, combo) * 50; score += gain * (Math.floor(lines / 10) + 1); backToBack = cleared === 4; lines += cleared; if (cleared === 4) { fx.shake(6); fx.flash('#b9f86b'); fx.ring(142, 46 + full[0] * 24, '#b9f86b', 140, .5); } fx.label(145, 275, cleared === 4 ? 'TETRIS!' : combo > 0 ? `${combo + 1} COMBO` : `${cleared} LINE`, palette.green); s.sound(440 + cleared * 100); }
        else combo = -1;
        hud(); if (sprint && lines >= 40) { const seconds = Math.max(.1, Math.floor(s.elapsed() * 10 + 1e-7) / 10); s.finish({ seconds, score: seconds, order: 'low', recordText: `${seconds.toFixed(1)}초`, title: '40줄 스프린트 완주!', text: `${seconds.toFixed(1)}초 · ${score.toLocaleString()}점` }); return; } spawn();
    };
    const grounded = () => !fits(current.shape, current.x, current.y + 1);
    const shift = (dx) => { if (!fits(current.shape, current.x + dx, current.y)) return; const onFloor = grounded(); current.x += dx; if (onFloor && resets < 12) { resets++; lockTime = 0; } };
    const rotate = (clockwise) => { let shape = current.shape; for (let i = 0; i < (clockwise ? 1 : 3); i++) shape = rotateMatrix(shape); const onFloor = grounded(); for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1], [0, -2]]) if (fits(shape, current.x + dx, current.y + dy)) { current.shape = shape; current.x += dx; current.y += dy; if (onFloor && resets < 12) { resets++; lockTime = 0; } s.sound(310, .025); return; } };
    const input = (code) => {
        if (code === 'ArrowLeft' || code === 'ArrowRight') { lastDirection = code === 'ArrowLeft' ? -1 : 1; shift(lastDirection); repeat = .15; }
        else if (code === 'ArrowUp' || code === 'KeyX') rotate(true);
        else if (code === 'KeyZ') rotate(false);
        else if (code === 'KeyC' && !heldUsed) { const previous = current.type, type = held === null ? take() : held; held = previous; spawn(type, true); s.sound(500, .04); }
        else if (code === 'Space') { let distance = 0; while (fits(current.shape, current.x, current.y + 1)) { current.y++; distance++; } score += distance * 2; fx.burst(34 + current.x * 24, 47 + current.y * 24, colors[current.type], 8, 60); lock(); }
    };
    spawn(); hud(); s.bindKeys(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyX', 'KeyZ', 'KeyC'], input);
    const block = (x, y, color, alpha = 1) => { if (y < 0) return; ctx.globalAlpha = alpha; rounded(ctx, 23 + x * 24, 35 + y * 24, 22, 22, color, 3); ctx.fillStyle = '#ffffff38'; ctx.fillRect(26 + x * 24, 38 + y * 24, 16, 2); ctx.globalAlpha = 1; };
    const miniature = (type, x, y) => { if (type === null) return; const shape = tetrisShapes[type], offset = (100 - shape[0].length * 18) / 2; shape.forEach((row, yy) => row.forEach((value, xx) => { if (value) rounded(ctx, x + offset + xx * 18, y + yy * 18, 16, 16, colors[type], 2); })); };
    s.run((dt) => {
        fx.update(dt); repeat -= dt; if (repeat <= 0 && (s.down('ArrowLeft') || s.down('ArrowRight'))) { shift(s.down('ArrowLeft') && s.down('ArrowRight') ? lastDirection : s.down('ArrowLeft') ? -1 : 1); repeat = .045; }
        gravity += dt; const interval = s.down('ArrowDown') ? .035 : Math.max(.065, .78 * .8 ** Math.floor(lines / 10));
        if (gravity >= interval) { gravity -= interval; if (fits(current.shape, current.x, current.y + 1)) { current.y++; if (s.down('ArrowDown')) { score++; hud(); } } }
        if (grounded()) { lockTime += dt; if (lockTime >= .45) lock(); } else if (resets < 12) lockTime = 0;
        for (let i = flashes.length - 1; i >= 0; i--) if ((flashes[i].age += dt) > .35) flashes.splice(i, 1); if (landed && (landed.age += dt) > .25) landed = null;
        if (sprint && Math.floor(s.elapsed() * 10) !== lastTimer) { lastTimer = Math.floor(s.elapsed() * 10); hud(); }
    }, () => {
        background(ctx, 400, 560, 24); rounded(ctx, 21, 33, 242, 482, '#101721', 3); ctx.strokeStyle = '#233142'; ctx.lineWidth = .6;
        for (let x = 0; x <= 10; x++) { ctx.beginPath(); ctx.moveTo(22 + x * 24, 34); ctx.lineTo(22 + x * 24, 514); ctx.stroke(); } for (let y = 0; y <= 20; y++) { ctx.beginPath(); ctx.moveTo(22, 34 + y * 24); ctx.lineTo(262, 34 + y * 24); ctx.stroke(); }
        board.forEach((row, y) => row.forEach((value, x) => { if (value) block(x, y, colors[value - 1]); })); let ghost = current.y; while (fits(current.shape, current.x, ghost + 1)) ghost++;
        current.shape.forEach((row, y) => row.forEach((value, x) => { if (value) { block(current.x + x, ghost + y, colors[current.type], .18); block(current.x + x, current.y + y, colors[current.type]); } }));
        if (landed) { ctx.globalAlpha = (1 - landed.age / .25) * .45; ctx.fillStyle = '#ffffff'; landed.cells.forEach(([x, y]) => { if (y >= 0) ctx.fillRect(22 + x * 24 + 1, 34 + y * 24 + 1, 22, 22); }); ctx.globalAlpha = 1; }
        flashes.forEach((f) => { const t = f.age / .35; ctx.globalAlpha = (1 - t) * .85; ctx.fillStyle = f.tetris ? '#e8ffc8' : '#ffffff'; const grow = 1 + t * .08; ctx.fillRect(22 + 120 - 120 * grow, 34 + f.y * 24 + 12 - 12 * (1 - t), 240 * grow, 24 * (1 - t)); }); ctx.globalAlpha = 1;
        text(ctx, 'NEXT', 329, 48, 12, palette.muted); queue.slice(0, 3).forEach((type, i) => miniature(type, 279, 75 + i * 85)); text(ctx, 'HOLD · C', 329, 355, 12, heldUsed ? '#536176' : palette.muted); miniature(held, 279, 383); text(ctx, 'Z ↶   X ↷', 329, 475, 12, palette.muted); text(ctx, 'SPACE ↓', 329, 501, 12, palette.muted); fx.draw(ctx);
    }); s.message('C 보관 · Z/X 회전 · Space 즉시 낙하 · 착지 후 0.45초 동안 위치를 조정할 수 있어요.'); s.ready('테트리스', sprint ? '40줄을 최대한 빠르게 지우세요. 보관과 양방향 회전을 활용해요.' : '다음 블록 3개를 보고 쌓으세요. 연속 줄 제거와 4줄 제거로 보너스를 얻어요.');
};
