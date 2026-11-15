// Pure rules shared by games and the development verification suite.
export const slide2048 = (board, direction) => {
    const next = Array(16).fill(0), mergedCells = []; let score = 0;
    for (let lane = 0; lane < 4; lane++) {
        const indices = Array.from({ length: 4 }, (_, i) => direction === 'ArrowLeft' ? lane * 4 + i : direction === 'ArrowRight' ? lane * 4 + 3 - i : direction === 'ArrowUp' ? i * 4 + lane : (3 - i) * 4 + lane);
        const values = indices.map((i) => board[i]).filter(Boolean), merged = [];
        for (let i = 0; i < values.length; i++) { if (values[i] === values[i + 1]) { merged.push(values[i] * 2); mergedCells.push(indices[merged.length - 1]); score += values[i] * 2; i++; } else merged.push(values[i]); }
        indices.forEach((index, i) => { next[index] = merged[i] || 0; });
    }
    return { board: next, score, changed: next.some((value, i) => value !== board[i]), merged: mergedCells };
};
export const winningLine = (board, columns, index, count) => {
    const player = board[index]; if (!player) return [];
    const rows = board.length / columns, x = index % columns, y = Math.floor(index / columns);
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        const line = [index];
        for (const sign of [-1, 1]) for (let n = 1; n < Math.max(columns, rows); n++) { const xx = x + dx * n * sign, yy = y + dy * n * sign; if (xx < 0 || yy < 0 || xx >= columns || yy >= rows || board[yy * columns + xx] !== player) break; line.push(yy * columns + xx); }
        if (line.length >= count) return line;
    }
    return [];
};
export const reversiMoves = (board, player) => {
    const moves = new Map();
    board.forEach((value, index) => {
        if (value) return; const flips = [], x = index % 8, y = Math.floor(index / 8);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue; const line = []; let xx = x + dx, yy = y + dy;
            while (xx >= 0 && yy >= 0 && xx < 8 && yy < 8 && board[yy * 8 + xx] === 3 - player) { line.push(yy * 8 + xx); xx += dx; yy += dy; }
            if (line.length && xx >= 0 && yy >= 0 && xx < 8 && yy < 8 && board[yy * 8 + xx] === player) flips.push(...line);
        }
        if (flips.length) moves.set(index, flips);
    });
    return moves;
};
export const hexPath = (board, size, player) => {
    const queue = [], parent = new Map();
    for (let n = 0; n < size; n++) { const i = player === 1 ? n : n * size; if (board[i] === player) { queue.push(i); parent.set(i, -1); } }
    for (let head = 0; head < queue.length; head++) {
        const i = queue[head], x = i % size, y = Math.floor(i / size);
        if ((player === 1 ? y : x) === size - 1) { const path = []; for (let at = i; at !== -1; at = parent.get(at)) path.push(at); return path; }
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, -1], [-1, 1]]) { const xx = x + dx, yy = y + dy, next = yy * size + xx; if (xx >= 0 && yy >= 0 && xx < size && yy < size && board[next] === player && !parent.has(next)) { parent.set(next, i); queue.push(next); } }
    }
    return [];
};
export const tetrisShapes = [ [[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[0, 1, 1], [1, 1, 0]], [[1, 1, 0], [0, 1, 1]] ];
export const rotateMatrix = (matrix) => matrix[0].map((_, x) => matrix.map((row) => row[x]).reverse());
export const tetrisFits = (board, shape, x, y) => shape.every((row, dy) => row.every((value, dx) => !value || (x + dx >= 0 && x + dx < 10 && y + dy < 20 && (y + dy < 0 || !board[y + dy][x + dx]))));

export const mineNeighbors = (index, columns, rows) => {
    const result = [], x = index % columns, y = Math.floor(index / columns);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && x + dx >= 0 && y + dy >= 0 && x + dx < columns && y + dy < rows) result.push((y + dy) * columns + x + dx);
    return result;
};
export const lightsSolution = (board, size) => {
    const n = size * size, rows = Array(n).fill(0), mask = (1 << n) - 1, pivots = []; let rank = 0;
    for (let i = 0; i < n; i++) { const x = i % size, y = Math.floor(i / size); for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (x + dx >= 0 && x + dx < size && y + dy >= 0 && y + dy < size) rows[i] |= 1 << ((y + dy) * size + x + dx); if (board[i]) rows[i] |= 1 << n; }
    for (let column = 0; column < n; column++) { const found = rows.findIndex((row, i) => i >= rank && (row & (1 << column))); if (found < 0) continue; [rows[rank], rows[found]] = [rows[found], rows[rank]]; for (let r = 0; r < n; r++) if (r !== rank && (rows[r] & (1 << column))) rows[r] ^= rows[rank]; pivots.push(column); rank++; }
    if (rows.some((row) => !(row & mask) && (row & (1 << n)))) return null;
    const free = Array.from({ length: n }, (_, i) => i).filter((i) => !pivots.includes(i)); let best = null;
    for (let choice = 0; choice < 2 ** free.length; choice++) { let bits = 0; free.forEach((column, i) => { if (choice & (1 << i)) bits |= 1 << column; }); for (let r = 0; r < rank; r++) { let parity = (rows[r] >> n) & 1, overlap = rows[r] & bits & mask; while (overlap) { parity ^= 1; overlap &= overlap - 1; } if (parity) bits |= 1 << pivots[r]; } const solution = Array.from({ length: n }, (_, i) => i).filter((i) => bits & (1 << i)); if (!best || solution.length < best.length) best = solution; }
    return best;
};
export const floodRegion = (board, size) => {
    const area = new Set([0]), queue = [0];
    for (let head = 0; head < queue.length; head++) { const i = queue[head]; for (const next of [i % size ? i - 1 : -1, i % size < size - 1 ? i + 1 : -1, i - size, i + size]) if (next >= 0 && next < board.length && !area.has(next) && board[next] === board[0]) { area.add(next); queue.push(next); } }
    return area;
};
export const floodGreedy = (board, size, limit = 100) => {
    const copy = [...board], path = []; let area = floodRegion(copy, size);
    while (area.size < copy.length && path.length < limit) { let bestColor = -1, bestSize = -1; for (let color = 0; color < 6; color++) if (color !== copy[0]) { const trial = [...copy]; area.forEach((i) => { trial[i] = color; }); const count = floodRegion(trial, size).size; if (count > bestSize) { bestSize = count; bestColor = color; } } area.forEach((i) => { copy[i] = bestColor; }); path.push(bestColor); area = floodRegion(copy, size); }
    return area.size === copy.length ? path : null;
};
export const shortestMazePath = (walls, size, start = 0, goal = walls.length - 1) => {
    const parent = new Map([[start, -1]]), queue = [start], directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (let head = 0; head < queue.length; head++) { const i = queue[head]; if (i === goal) { const path = []; for (let at = goal; at !== -1; at = parent.get(at)) path.push(at); return path.reverse(); } directions.forEach(([dx, dy], d) => { const x = i % size + dx, y = Math.floor(i / size) + dy, next = y * size + x; if (!walls[i][d] && x >= 0 && y >= 0 && x < size && y < size && !parent.has(next)) { parent.set(next, i); queue.push(next); } }); }
    return [];
};
export const torusDistance = (a, b, width, height) => { const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y); return Math.hypot(Math.min(dx, width - dx), Math.min(dy, height - dy)); };

// Pointy hexagons and all four goal borders use the same logical geometry.
export const hexLayout = (size) => {
    const unitHeight = 2 / Math.sqrt(3), margin = .35;
    const width = size + (size - 1) / 2 + margin * 2, height = (1 + (size - 1) * .75) * unitHeight + margin * 2;
    const cells = Array.from({ length: size * size }, (_, i) => ({ x: margin + i % size + Math.floor(i / size) / 2, y: margin + Math.floor(i / size) * unitHeight * .75 }));
    const points = (items) => items.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(4)} ${y.toFixed(4)}`).join('');
    const top = [[margin, margin + unitHeight / 4]], bottom = [], left = [[margin, margin + unitHeight / 4]], right = [];
    const low = cells[(size - 1) * size]; bottom.push([low.x, low.y + unitHeight * .75]);
    right.push([cells[size - 1].x + 1, margin + unitHeight / 4]);
    for (let i = 0; i < size; i++) {
        top.push([margin + i + .5, margin], [margin + i + 1, margin + unitHeight / 4]);
        bottom.push([low.x + i + .5, low.y + unitHeight], [low.x + i + 1, low.y + unitHeight * .75]);
        const a = cells[i * size], b = cells[i * size + size - 1];
        left.push([a.x, a.y + unitHeight * .75]); right.push([b.x + 1, b.y + unitHeight * .75]);
        if (i < size - 1) { left.push([a.x + .5, a.y + unitHeight]); const next = cells[(i + 1) * size + size - 1]; right.push([next.x + 1, next.y + unitHeight / 4]); }
    }
    return { width, height, unitHeight, cells, goals: [points(top), points(bottom), points(left), points(right)] };
};

export const gridNeighbors = (i, columns, length) => [i % columns ? i - 1 : -1, i % columns < columns - 1 ? i + 1 : -1, i >= columns ? i - columns : -1, i + columns < length ? i + columns : -1].filter((n) => n >= 0);
export const parseSokoban = (map) => {
    const rows = map.split('/'), columns = rows[0].length, floor = new Set(), goals = new Set(), boxes = []; let player = -1;
    rows.forEach((row, y) => [...row].forEach((c, x) => { const i = y * columns + x; if (c !== '#') floor.add(i); if ('.*+'.includes(c)) goals.add(i); if ('$*'.includes(c)) boxes.push(i); if ('@+'.includes(c)) player = i; }));
    return { columns, rows: rows.length, floor, goals, player, boxes };
};
export const sokobanStep = (level, state, next) => {
    if (!gridNeighbors(state.player, level.columns, level.columns * level.rows).includes(next) || !level.floor.has(next)) return null;
    const box = state.boxes.indexOf(next), target = next + next - state.player, boxes = [...state.boxes];
    if (box >= 0) { if (!gridNeighbors(next, level.columns, level.columns * level.rows).includes(target) || !level.floor.has(target) || boxes.includes(target)) return null; boxes[box] = target; }
    return { player: next, boxes, moves: state.moves + 1, pushes: state.pushes + (box >= 0 ? 1 : 0) };
};
export const sokobanWalk = (level, state, target) => {
    const previous = new Map([[state.player, -1]]), queue = [state.player], occupied = new Set(state.boxes);
    for (let head = 0; head < queue.length && !previous.has(target); head++) for (const next of gridNeighbors(queue[head], level.columns, level.columns * level.rows)) {
        if (level.floor.has(next) && !occupied.has(next) && !previous.has(next)) { previous.set(next, queue[head]); queue.push(next); }
    }
    if (!previous.has(target)) return [];
    const path = []; for (let at = target; at !== state.player; at = previous.get(at)) path.unshift(at); return path;
};
export const sokobanCorners = (level) => [...level.floor].filter((i) => !level.goals.has(i) && [[-1, -level.columns], [1, -level.columns], [1, level.columns], [-1, level.columns]].some(([a, b]) => !level.floor.has(i + a) && !level.floor.has(i + b)));
export const sameGroup = (board, columns, start) => {
    if (!board[start]) return [];
    const found = new Set([start]), queue = [start];
    for (let head = 0; head < queue.length; head++) for (const next of gridNeighbors(queue[head], columns, board.length)) if (board[next] === board[start] && !found.has(next)) { found.add(next); queue.push(next); }
    return queue;
};
export const collapseSame = (board, columns, removed) => {
    const rows = board.length / columns, excluded = new Set(removed), next = Array(board.length).fill(0), moves = []; let x = 0;
    for (let column = 0; column < columns; column++) {
        const survivors = []; for (let y = rows - 1; y >= 0; y--) { const from = y * columns + column; if (board[from] && !excluded.has(from)) survivors.push(from); }
        if (!survivors.length) continue;
        survivors.forEach((from, n) => { const to = (rows - n - 1) * columns + x; next[to] = board[from]; moves.push({ from, to }); }); x++;
    }
    return { board: next, moves };
};
export const raceBlocked = (walls, a, b, size = 9) => {
    const ax = a % size, ay = Math.floor(a / size), bx = b % size, by = Math.floor(b / size);
    return walls.some((w) => w.dir === 'h' ? ay !== by && Math.min(ay, by) === w.y && ax >= w.x && ax <= w.x + 1 : ax !== bx && Math.min(ax, bx) === w.x && ay >= w.y && ay <= w.y + 1);
};
export const racePath = (walls, from, goalRow, size = 9) => {
    const queue = [from], previous = new Map([[from, -1]]);
    for (let head = 0; head < queue.length; head++) {
        const i = queue[head];
        if (Math.floor(i / size) === goalRow) { const path = []; for (let at = i; at >= 0; at = previous.get(at)) path.unshift(at); return path; }
        for (const next of gridNeighbors(i, size, size * size)) if (!previous.has(next) && !raceBlocked(walls, i, next, size)) { previous.set(next, i); queue.push(next); }
    }
    return [];
};
export const raceMoves = (walls, player, opponent, size = 9) => {
    const moves = new Set();
    for (const next of gridNeighbors(player, size, size * size)) {
        if (raceBlocked(walls, player, next, size)) continue;
        if (next !== opponent) { moves.add(next); continue; }
        const delta = opponent - player, behind = opponent + delta;
        if (gridNeighbors(opponent, size, size * size).includes(behind) && !raceBlocked(walls, opponent, behind, size)) moves.add(behind);
        else for (const side of gridNeighbors(opponent, size, size * size)) if ((Math.abs(delta) === 1 ? Math.abs(side - opponent) === size : Math.abs(side - opponent) === 1) && !raceBlocked(walls, opponent, side, size)) moves.add(side);
    }
    return [...moves];
};
export const raceWallError = (walls, wall, players, size = 9) => {
    if (!Number.isInteger(wall.x) || !Number.isInteger(wall.y) || !['h', 'v'].includes(wall.dir) || wall.x < 0 || wall.y < 0 || wall.x >= size - 1 || wall.y >= size - 1) return '보드 안의 교차점을 선택하세요.';
    if (walls.some((w) => w.dir === wall.dir ? wall.dir === 'h' ? w.y === wall.y && Math.abs(w.x - wall.x) < 2 : w.x === wall.x && Math.abs(w.y - wall.y) < 2 : w.x === wall.x && w.y === wall.y)) return '장벽은 겹치거나 교차할 수 없어요.';
    const next = [...walls, wall];
    return racePath(next, players[0], 0, size).length && racePath(next, players[1], size - 1, size).length ? '' : '두 플레이어에게 도착할 길을 남겨야 해요.';
};
export const sweepBox = (point, delta, box, radius = 0) => {
    const times = [];
    for (const axis of ['x', 'y']) {
        const low = box[axis] - radius, high = box[axis] + box[axis === 'x' ? 'w' : 'h'] + radius, speed = delta[axis];
        if (Math.abs(speed) < 1e-10) { if (point[axis] < low || point[axis] > high) return null; times.push({ near: -Infinity, far: Infinity, normal: 0 }); }
        else { const a = (low - point[axis]) / speed, b = (high - point[axis]) / speed; times.push({ near: Math.min(a, b), far: Math.max(a, b), normal: speed > 0 ? -1 : 1 }); }
    }
    const near = Math.max(times[0].near, times[1].near), far = Math.min(times[0].far, times[1].far);
    if (near < -1e-8 || near > 1 || near > far || far < 0) return null;
    return { t: Math.max(0, near), nx: Math.abs(times[0].near - near) < 1e-8 ? times[0].normal : 0, ny: Math.abs(times[1].near - near) < 1e-8 ? times[1].normal : 0 };
};
export const traceRicochet = (bullet, seconds, walls, radius = 3) => {
    let { x, y, vx, vy, bounces = 0 } = bullet, remaining = seconds, elapsed = 0; const segments = [];
    for (let contact = 0; contact < 8 && remaining > 1e-9; contact++) {
        const delta = { x: vx * remaining, y: vy * remaining }; let hit = null;
        for (const wall of walls) {
            const candidate = sweepBox({ x, y }, delta, wall, radius); if (!candidate) continue;
            if (!hit || candidate.t < hit.t - 1e-8) hit = candidate;
            else if (Math.abs(candidate.t - hit.t) < 1e-8) { hit.nx ||= candidate.nx; hit.ny ||= candidate.ny; }
        }
        const fraction = hit ? hit.t : 1, endX = x + delta.x * fraction, endY = y + delta.y * fraction, duration = remaining * fraction;
        segments.push({ x1: x, y1: y, x2: endX, y2: endY, t0: seconds ? elapsed / seconds : 0, t1: seconds ? (elapsed + duration) / seconds : 1, bounces });
        x = endX; y = endY; elapsed += duration; remaining -= duration;
        if (!hit) break;
        if (hit.nx) vx = -vx; if (hit.ny) vy = -vy; bounces++; x += hit.nx * .02; y += hit.ny * .02;
    }
    return { ...bullet, x, y, vx, vy, bounces, segments };
};
export const sweepCircle = (from, to, radius) => {
    const c = from.x * from.x + from.y * from.y - radius * radius; if (c <= 0) return 0;
    const dx = to.x - from.x, dy = to.y - from.y, a = dx * dx + dy * dy, b = 2 * (from.x * dx + from.y * dy), discriminant = b * b - 4 * a * c;
    if (a < 1e-12 || discriminant < 0) return null;
    const t = (-b - Math.sqrt(discriminant)) / (2 * a); return t >= 0 && t <= 1 ? t : null;
};

// Preserve every unclaimed component containing a hazard; claim the other side of a closed cut.
export const captureTerritory = (board, columns, trail, hazards) => {
    const next = [...board]; trail.forEach((i) => { next[i] = 1; });
    const safe = new Set(), queue = hazards.filter((i) => i >= 0 && i < next.length && !next[i]);
    queue.forEach((i) => safe.add(i));
    for (let head = 0; head < queue.length; head++) for (const i of gridNeighbors(queue[head], columns, next.length)) if (!next[i] && !safe.has(i)) { safe.add(i); queue.push(i); }
    return next.map((value, i) => value || !safe.has(i) ? 1 : 0);
};
export const bubblePosition = (i, phase = 0) => ({ x: 53 + i % 12 * 36 + ((Math.floor(i / 12) + phase) % 2) * 18, y: 42 + Math.floor(i / 12) * Math.sqrt(3) * 18 });
export const bubbleNeighbors = (i, phase = 0, length = 168) => {
    const x = i % 12, y = Math.floor(i / 12), shift = (y + phase) % 2 ? 1 : -1;
    return [[x - 1, y], [x + 1, y], [x, y - 1], [x + shift, y - 1], [x, y + 1], [x + shift, y + 1]].filter(([a, b]) => a >= 0 && a < 12 && b >= 0 && b * 12 + a < length).map(([a, b]) => b * 12 + a);
};
export const bubbleResolve = (board, at, color, phase = 0) => {
    if (at < 0 || at >= board.length || board[at]) return null;
    const next = [...board]; next[at] = color; const group = [at], seen = new Set(group);
    for (let head = 0; head < group.length; head++) for (const i of bubbleNeighbors(group[head], phase, board.length)) if (next[i] === color && !seen.has(i)) { seen.add(i); group.push(i); }
    if (group.length < 3) return { board: next, popped: [], dropped: [] };
    group.forEach((i) => { next[i] = 0; }); const attached = new Set(), queue = [];
    for (let i = 0; i < 12; i++) if (next[i]) { queue.push(i); attached.add(i); }
    for (let head = 0; head < queue.length; head++) for (const i of bubbleNeighbors(queue[head], phase, board.length)) if (next[i] && !attached.has(i)) { attached.add(i); queue.push(i); }
    const dropped = []; next.forEach((value, i) => { if (value && !attached.has(i)) { dropped.push(i); next[i] = 0; } });
    return { board: next, popped: group, dropped };
};
// The dotted aim and live projectile share this continuous trace, including side reflections.
export const bubbleTrace = (ball, distance, board, phase = 0) => {
    let { x, y, vx, vy } = ball, remaining = distance; const segments = [];
    for (let n = 0; n < 12 && remaining > 1e-7; n++) {
        const delta = { x: vx * remaining, y: vy * remaining }; let hit = null;
        const offer = (t, type, index = -1) => { if (t >= 0 && t <= 1 && (!hit || t < hit.t)) hit = { t, type, index }; };
        if (vx < 0) offer((53 - x) / delta.x, 'wall'); else if (vx > 0) offer((467 - x) / delta.x, 'wall');
        if (vy < 0) offer((42 - y) / delta.y, 'top');
        board.forEach((value, i) => { if (!value) return; const p = bubblePosition(i, phase), t = sweepCircle({ x: x - p.x, y: y - p.y }, { x: x + delta.x - p.x, y: y + delta.y - p.y }, 35.999); if (t !== null) offer(t, 'bubble', i); });
        const fraction = hit ? hit.t : 1, endX = x + delta.x * fraction, endY = y + delta.y * fraction;
        segments.push({ x1: x, y1: y, x2: endX, y2: endY }); x = endX; y = endY; remaining *= 1 - fraction;
        if (!hit) break;
        if (hit.type !== 'wall') {
            const candidates = hit.type === 'top' ? Array.from({ length: 12 }, (_, i) => i) : bubbleNeighbors(hit.index, phase, board.length);
            const empty = candidates.filter((i) => !board[i]).sort((a, b) => { const p = bubblePosition(a, phase), q = bubblePosition(b, phase); return Math.hypot(p.x - x, p.y - y) - Math.hypot(q.x - x, q.y - y); });
            return { x, y, vx, vy, segments, contact: true, slot: empty[0] ?? -1 };
        }
        vx = -vx; x += vx * .0001;
    }
    return { x, y, vx, vy, segments, contact: false, slot: -1 };
};
export const golfStep = (ball, dt, course) => {
    let { x, y, vx, vy } = ball, remaining = dt;
    const bounds = [{ x: 0, y: 0, w: 600, h: 18 }, { x: 0, y: 382, w: 600, h: 18 }, { x: 0, y: 18, w: 18, h: 364 }, { x: 582, y: 18, w: 18, h: 364 }];
    for (let n = 0; n < 8 && remaining > 1e-8; n++) {
        const decay = Math.exp(-1.2 * remaining), delta = { x: vx * (1 - decay) / 1.2, y: vy * (1 - decay) / 1.2 }; let hit = null;
        const offer = (value, type) => { if (value && (!hit || value.t < hit.t)) hit = { ...value, type }; };
        for (const wall of [...bounds, ...course.walls]) offer(sweepBox({ x, y }, delta, wall, 7), 'wall');
        for (const water of course.water || []) offer(sweepBox({ x, y }, delta, water, 1), 'water');
        const t = sweepCircle({ x: x - course.hole[0], y: y - course.hole[1] }, { x: x + delta.x - course.hole[0], y: y + delta.y - course.hole[1] }, 11);
        if (t !== null && Math.hypot(vx, vy) * (1 - t * (1 - decay)) <= 150) offer({ t }, 'hole');
        const fraction = hit?.t ?? 1, used = -Math.log(Math.max(1e-12, 1 - fraction * (1 - decay))) / 1.2;
        x += delta.x * fraction; y += delta.y * fraction; vx *= Math.exp(-1.2 * used); vy *= Math.exp(-1.2 * used); remaining -= used;
        if (!hit) break;
        if (hit.type !== 'wall') return { x, y, vx: 0, vy: 0, status: hit.type };
        if (hit.nx) vx = -vx * .78; if (hit.ny) vy = -vy * .78; x += hit.nx * .02; y += hit.ny * .02;
    }
    const rest = Math.hypot(vx, vy) < 8; return { x, y, vx: rest ? 0 : vx, vy: rest ? 0 : vy, status: rest ? 'rest' : 'moving' };
};
export const parseDuo = (map) => {
    const rows = map.split('/'), columns = rows[0].length, tiles = [...rows.join('')];
    if (!rows.every((row) => row.length === columns) || !['A', 'B', 'X', 'Y'].every((c) => tiles.filter((t) => t === c).length === 1)) throw new Error('Invalid cooperative map');
    return { columns, rows: rows.length, tiles, players: [tiles.indexOf('A'), tiles.indexOf('B')], exits: [tiles.indexOf('X'), tiles.indexOf('Y')] };
};
export const duoDoors = (level, state) => [0, 1].map((channel) => !!(state.bits & (1 << channel)) || state.players.some((at) => level.tiles[at] === String(channel + 1) || level.tiles[at] === 'IJ'[channel]));
export const duoStep = (level, state, intents) => {
    const open = duoDoors(level, state), next = state.players.map((at, p) => {
        const to = intents[p], tile = level.tiles[to];
        return gridNeighbors(at, level.columns, level.tiles.length).includes(to) && tile !== '#' && !(tile === 'r' && p === 1) && !(tile === 'u' && p === 0) && !('IJ'.includes(tile) && !open['IJ'.indexOf(tile)]) ? to : at;
    });
    if (next[0] === next[1]) return null;
    if (next.every((at, p) => at === state.players[p])) return null;
    let bits = state.bits, moves = state.moves;
    next.forEach((at, p) => { if (at !== state.players[p]) { moves++; const channel = 'ab'.indexOf(level.tiles[at]); if (channel >= 0) bits ^= 1 << channel; } });
    return { players: next, bits, moves };
};

export const parseLaser = (map, direction = 1) => {
    const rows = map.split('/'), columns = rows[0].length, tiles = [...rows.join('')];
    if (!rows.every((row) => row.length === columns) || tiles.filter((c) => c === 'S').length !== 1 || !tiles.includes('T')) throw new Error('Invalid laser board');
    return { columns, rows: rows.length, tiles, source: tiles.indexOf('S'), direction, mirrors: tiles.flatMap((c, i) => c === 'M' ? [i] : []), targets: tiles.flatMap((c, i) => c === 'T' ? [i] : []) };
};
export const laserTrace = (level, mask) => {
    const queue = [[level.source, level.direction]], seen = new Set(), lit = new Set(), active = new Set(), segments = [], steps = [[0,-1],[1,0],[0,1],[-1,0]]; let repeated = false;
    for (let head = 0; head < queue.length; head++) {
        const [at, direction] = queue[head], key = at * 4 + direction;
        if (seen.has(key)) { repeated = true; continue; } seen.add(key);
        const [dx,dy] = steps[direction], x = at % level.columns, y = Math.floor(at / level.columns), nx = x + dx, ny = y + dy, next = ny * level.columns + nx;
        const blocked = nx < 0 || nx >= level.columns || ny < 0 || ny >= level.rows || level.tiles[next] === '#';
        segments.push({ from: [x + .5, y + .5], to: blocked ? [x + .5 + dx * .5, y + .5 + dy * .5] : [nx + .5, ny + .5] });
        if (blocked) continue;
        active.add(next); if (level.tiles[next] === 'T') lit.add(next);
        const mirror = level.mirrors.indexOf(next);
        if (mirror >= 0) queue.push([next, (mask & (1 << mirror) ? [3,2,1,0] : [1,0,3,2])[direction]]);
        else if (level.tiles[next] === '+') for (const d of [direction, (direction + 1) % 4, (direction + 3) % 4]) queue.push([next,d]);
        else queue.push([next,direction]);
    }
    return { lit, active, segments, repeated, win: lit.size === level.targets.length };
};
export const rotatePorts = (ports, turns = 1) => { const n = ((turns % 4) + 4) % 4; return ((ports << n) | (ports >> (4 - n))) & 15; };
export const pipeNetwork = (board, columns, source) => {
    const connected = new Set([source]), queue = [source], leaks = [], delta = [-columns,1,columns,-1];
    const neighbor = (at, d) => { const next = at + delta[d]; return gridNeighbors(at, columns, board.length).includes(next) ? next : -1; };
    board.forEach((ports, at) => { for (let d = 0; d < 4; d++) if (ports & (1 << d)) { const next = neighbor(at,d); if (next < 0 || !(board[next] & (1 << ((d + 2) % 4)))) leaks.push(at * 4 + d); } });
    for (let head = 0; head < queue.length; head++) for (let d = 0; d < 4; d++) {
        if (!(board[queue[head]] & (1 << d))) continue; const next = neighbor(queue[head],d);
        if (next >= 0 && board[next] & (1 << ((d + 2) % 4)) && !connected.has(next)) { connected.add(next); queue.push(next); }
    }
    return { connected, leaks, win: !leaks.length && connected.size === board.length };
};
export const sudokuPeer = (a, b) => Math.floor(a / 9) === Math.floor(b / 9) || a % 9 === b % 9 || (Math.floor(a / 27) === Math.floor(b / 27) && Math.floor(a % 9 / 3) === Math.floor(b % 9 / 3));
export const sudokuConflicts = (board) => {
    const conflicts = new Set();
    for (let i = 0; i < 81; i++) if (board[i]) for (let j = 0; j < i; j++) if (board[i] === board[j] && sudokuPeer(i,j)) { conflicts.add(i); conflicts.add(j); }
    return conflicts;
};
export const sudokuSolve = (input, limit = 2) => {
    if (input.length !== 81 || !input.every((n) => Number.isInteger(n) && n >= 0 && n <= 9)) return [];
    const board = [...input], rows = Array(9).fill(0), columns = Array(9).fill(0), boxes = Array(9).fill(0), solutions = [];
    const house = (i) => [Math.floor(i / 9), i % 9, Math.floor(i / 27) * 3 + Math.floor(i % 9 / 3)];
    for (let i = 0; i < 81; i++) if (board[i]) { const [r,c,b] = house(i), bit = 1 << board[i]; if ((rows[r] | columns[c] | boxes[b]) & bit) return []; rows[r] |= bit; columns[c] |= bit; boxes[b] |= bit; }
    const search = () => {
        if (solutions.length >= limit) return;
        let at = -1, choices = 0, fewest = 10;
        for (let i = 0; i < 81; i++) if (!board[i]) {
            const [r,c,b] = house(i), bits = 1022 & ~(rows[r] | columns[c] | boxes[b]); let count = 0;
            for (let n = bits; n; n &= n - 1) count++;
            if (!count) return;
            if (count < fewest) { at = i; choices = bits; fewest = count; if (count === 1) break; }
        }
        if (at < 0) { solutions.push([...board]); return; }
        const [r,c,b] = house(at);
        while (choices && solutions.length < limit) { const bit = choices & -choices; choices ^= bit; board[at] = 31 - Math.clz32(bit); rows[r] |= bit; columns[c] |= bit; boxes[b] |= bit; search(); rows[r] ^= bit; columns[c] ^= bit; boxes[b] ^= bit; }
        board[at] = 0;
    };
    search(); return solutions;
};
export const mancalaMove = (state, pit) => {
    const { board, turn } = state, start = turn === 1 ? 0 : 7, store = turn === 1 ? 6 : 13, opponent = turn === 1 ? 13 : 6;
    if (![1,2].includes(turn) || !Number.isInteger(pit) || pit < start || pit >= start + 6 || !board[pit]) return null;
    const next = [...board], steps = []; let stones = next[pit], at = pit; next[pit] = 0;
    while (stones) { at = (at + 1) % 14; if (at === opponent) continue; next[at]++; steps.push(at); stones--; }
    let capture = null;
    if (at >= start && at < start + 6 && next[at] === 1 && next[12 - at]) { capture = { own: at, opposite: 12 - at, count: next[at] + next[12 - at] }; next[store] += capture.count; next[at] = next[12 - at] = 0; }
    const finished = !next.slice(0,6).some(Boolean) || !next.slice(7,13).some(Boolean);
    if (finished) { for (let i = 0; i < 6; i++) { next[6] += next[i]; next[i] = 0; next[13] += next[i + 7]; next[i + 7] = 0; } }
    const extra = !finished && at === store;
    return { state: { board: next, turn: finished ? 0 : extra ? turn : 3 - turn, moves: state.moves + 1 }, steps, capture, extra, finished, winner: finished ? next[6] === next[13] ? 0 : next[6] > next[13] ? 1 : 2 : null };
};

// 지뢰찾기 논리 풀이기: 숫자 하나의 직접 추론 + 두 숫자의 부분집합 추론 + 남은 지뢰 수 추론만으로 판을 연다.
// 운에 기대는 추측 없이 끝까지 열 수 있으면 solved=true. 막힌 경우 열린 칸(open)을 돌려줘 생성기가 배치를 고칠 수 있게 한다.
export const minesSolve = (mines, columns, rows, start) => {
    const total = columns * rows, near = (i) => mineNeighbors(i, columns, rows), open = new Uint8Array(total), flag = new Uint8Array(total);
    const counts = Array.from({ length: total }, (_, i) => near(i).filter((n) => mines.has(n)).length);
    let opened = 0, flagged = 0; const safe = total - mines.size;
    const reveal = (i) => {
        const queue = [i];
        for (let head = 0; head < queue.length; head++) { const at = queue[head]; if (open[at]) continue; open[at] = 1; opened++; if (!counts[at]) for (const n of near(at)) if (!open[n] && !flag[n]) queue.push(n); }
    };
    const mark = (n) => { if (!flag[n]) { flag[n] = 1; flagged++; } };
    if (mines.has(start)) return { solved: false, open, flag };
    reveal(start);
    const constraint = (i) => { const unknown = []; let marked = 0; for (const n of near(i)) { if (flag[n]) marked++; else if (!open[n]) unknown.push(n); } return { unknown, left: counts[i] - marked }; };
    for (let progress = true; progress && opened < safe;) {
        progress = false; const frontier = [];
        for (let i = 0; i < total; i++) {
            if (!open[i] || !counts[i]) continue; const c = constraint(i); if (!c.unknown.length) continue;
            if (c.left === 0) { c.unknown.forEach(reveal); progress = true; }
            else if (c.left === c.unknown.length) { c.unknown.forEach(mark); progress = true; }
            else frontier.push({ i, ...c, set: new Set(c.unknown) });
        }
        if (progress) continue;
        search: for (const a of frontier) for (const b of frontier) {
            if (a === b || a.unknown.length >= b.unknown.length || Math.abs(a.i % columns - b.i % columns) > 2 || Math.abs(Math.floor(a.i / columns) - Math.floor(b.i / columns)) > 2) continue;
            if (!a.unknown.every((n) => b.set.has(n))) continue;
            const rest = b.unknown.filter((n) => !a.set.has(n)), extra = b.left - a.left;
            if (extra === 0) { rest.forEach(reveal); progress = true; break search; }
            if (extra === rest.length) { rest.forEach(mark); progress = true; break search; }
        }
        if (progress) continue;
        const unknownAll = []; for (let i = 0; i < total; i++) if (!open[i] && !flag[i]) unknownAll.push(i);
        const remaining = mines.size - flagged;
        if (remaining === 0) { unknownAll.forEach(reveal); progress = true; } else if (remaining === unknownAll.length) { unknownAll.forEach(mark); progress = true; }
    }
    return { solved: opened === safe, open, flag };
};
export const minesSolvable = (mines, columns, rows, start) => minesSolve(mines, columns, rows, start).solved;

// 추측 없는 판 생성: 첫 클릭 주변 3×3을 비우고 무작위로 심은 뒤, 풀이기가 막히면 경계(열린 칸 옆)의 지뢰 하나를
// 아직 아무 정보도 없는 안쪽 칸으로 옮겨 다시 푼다. 지뢰 수와 첫 클릭 안전은 그대로이고, 결과는 항상 풀이기로 다시 확인한다.
export const minesNoGuess = (columns, rows, total, start, rand = Math.random, budgetMs = 1500) => {
    const near = (i) => mineNeighbors(i, columns, rows), safe = new Set([start, ...near(start)]), cells = Array.from({ length: columns * rows }, (_, n) => n).filter((n) => !safe.has(n));
    const pickFrom = (list) => list[Math.floor(rand() * list.length)];
    const began = Date.now(); let tries = 0, mines;
    do {
        tries++; const pool = [...cells];
        for (let k = 0; k < total; k++) { const j = k + Math.floor(rand() * (pool.length - k)); [pool[k], pool[j]] = [pool[j], pool[k]]; }
        mines = new Set(pool.slice(0, total));
        for (let repair = 0; repair < columns * rows; repair++) {
            const { solved, open, flag } = minesSolve(mines, columns, rows, start);
            if (solved) return { mines, solved: true, tries };
            const seen = (i) => near(i).some((n) => open[n]);
            const border = [...mines].filter((m) => !flag[m] && seen(m)), inside = cells.filter((i) => !open[i] && !mines.has(i) && !seen(i));
            if (!border.length || !inside.length) break;
            mines.delete(pickFrom(border)); mines.add(pickFrom(inside));
        }
    } while (Date.now() - began < budgetMs);
    return { mines, solved: false, tries };
};
