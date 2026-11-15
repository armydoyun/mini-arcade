import { winningLine, reversiMoves } from './rules.js';

// 혼자 하기 모드의 컴퓨터 상대. 브라우저 상태가 없는 순수 함수이며, 항상 둘 수 있는 칸의 인덱스를 돌려준다.
// 컴퓨터는 언제나 P2(값 2)이고 사람(P1)이 먼저 둔다. chance()는 테스트에서 고정할 수 있는 난수다.
const pick = (list, chance) => list[Math.floor(chance() * list.length) % list.length];
const empties = (board) => board.flatMap((value, i) => (value ? [] : [i]));

// 틱택토: 완전 탐색(minimax). 실수율만큼 즉시 승리·방어가 아닌 수를 무작위로 골라 이길 기회를 남긴다.
export const tictactoeMove = (board, { reverse = false, mistake = 0.18, chance = Math.random } = {}) => {
    const lines = (b, i) => winningLine(b, 3, i, 3).length > 0;
    const score = (b, turn, depth) => {
        let best = turn === 2 ? -Infinity : Infinity;
        for (const i of empties(b)) {
            b[i] = turn;
            const value = lines(b, i) ? (turn === 2 ? 10 - depth : depth - 10) * (reverse ? -1 : 1) : b.every(Boolean) ? 0 : score(b, 3 - turn, depth + 1);
            b[i] = 0;
            best = turn === 2 ? Math.max(best, value) : Math.min(best, value);
        }
        return best;
    };
    const work = [...board], open = empties(work), ranked = open.map((i) => { work[i] = 2; const value = lines(work, i) ? (reverse ? -10 : 10) : work.every(Boolean) ? 0 : score(work, 1, 1); work[i] = 0; return { i, value }; });
    const top = Math.max(...ranked.map((m) => m.value)), best = ranked.filter((m) => m.value === top).map((m) => m.i);
    const urgent = !reverse && open.some((i) => { for (const p of [1, 2]) { work[i] = p; const hit = lines(work, i); work[i] = 0; if (hit) return true; } return false; });
    if (!urgent && open.length < 9 && chance() < mistake) return pick(open, chance);
    return pick(best, chance);
};

// 사목: 4칸 창 평가 + 알파-베타 negamax. 가운데 열을 먼저 살핀다.
export const connectFourMove = (board, { columns = 7, rows = 6, depth = 5, chance = Math.random } = {}) => {
    const order = Array.from({ length: columns }, (_, i) => i).sort((a, b) => Math.abs(a - (columns - 1) / 2) - Math.abs(b - (columns - 1) / 2));
    const landing = (b, x) => { for (let y = rows - 1; y >= 0; y--) if (!b[y * columns + x]) return y * columns + x; return -1; };
    const windows = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        const cells = [0, 1, 2, 3].map((k) => [x + dx * k, y + dy * k]);
        if (cells.every(([cx, cy]) => cx >= 0 && cx < columns && cy >= 0 && cy < rows)) windows.push(cells.map(([cx, cy]) => cy * columns + cx));
    }
    const evaluate = (b, me) => {
        let total = 0;
        for (let y = 0; y < rows; y++) total += (b[y * columns + (columns >> 1)] === me ? 3 : b[y * columns + (columns >> 1)] ? -3 : 0);
        for (const w of windows) {
            let mine = 0, theirs = 0; for (const i of w) { if (b[i] === me) mine++; else if (b[i]) theirs++; }
            if (mine && theirs) continue;
            total += mine === 3 ? 5 : mine === 2 ? 2 : 0; total -= theirs === 3 ? 6 : theirs === 2 ? 2 : 0;
        }
        return total;
    };
    const search = (b, me, d, alpha, beta) => {
        let any = false;
        for (const x of order) {
            const i = landing(b, x); if (i < 0) continue; any = true;
            b[i] = me; const won = winningLine(b, columns, i, 4).length > 0; b[i] = 0;
            if (won) return 1000 + d;
        }
        if (!any) return 0;
        if (!d) return evaluate(b, me);
        let best = -Infinity;
        for (const x of order) {
            const i = landing(b, x); if (i < 0) continue;
            b[i] = me; const value = -search(b, 3 - me, d - 1, -beta, -alpha); b[i] = 0;
            if (value > best) best = value; if (value > alpha) alpha = value; if (alpha >= beta) break;
        }
        return best;
    };
    const work = [...board]; let best = -Infinity, choices = [];
    for (const x of order) {
        const i = landing(work, x); if (i < 0) continue;
        work[i] = 2; const value = winningLine(work, columns, i, 4).length ? 10000 : -search(work, 1, depth - 1, -Infinity, Infinity); work[i] = 0;
        if (value > best) { best = value; choices = [i]; } else if (value === best) choices.push(i);
    }
    return pick(choices, chance);
};

// 오목: 각 빈칸에 놓았을 때 네 방향으로 이어지는 길이와 열린 끝을 점수로 바꿔 공격·수비를 함께 본다.
export const gomokuMove = (board, { size = 15, chance = Math.random } = {}) => {
    if (!board.some(Boolean)) return Math.floor(size * size / 2);
    const at = (x, y) => (x < 0 || y < 0 || x >= size || y >= size ? -1 : board[y * size + x]);
    const shape = (x, y, me) => {
        let total = 0;
        for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
            let count = 1, open = 0;
            for (const sign of [1, -1]) {
                let k = 1; while (at(x + dx * k * sign, y + dy * k * sign) === me) { count++; k++; }
                if (at(x + dx * k * sign, y + dy * k * sign) === 0) open++;
            }
            total += count >= 5 ? 1e6 : !open ? 0 : count === 4 ? (open === 2 ? 5e4 : 6e3) : count === 3 ? (open === 2 ? 4e3 : 400) : count === 2 ? (open === 2 ? 200 : 30) : open * 4;
        }
        return total;
    };
    let best = -Infinity, choices = [];
    for (let i = 0; i < board.length; i++) {
        if (board[i]) continue;
        const x = i % size, y = Math.floor(i / size);
        let near = false; for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) if (at(x + dx, y + dy) > 0) { near = true; break; }
        if (!near) continue;
        const value = shape(x, y, 2) * 1.1 + shape(x, y, 1) - (Math.abs(x - size / 2) + Math.abs(y - size / 2)) * 0.5;
        if (value > best + 1e-9) { best = value; choices = [i]; } else if (Math.abs(value - best) <= 1e-9) choices.push(i);
    }
    return pick(choices, chance);
};

// 오델로: 자리 가중치(모서리 우대·X/C칸 경계) + 이동 가능 수, 알파-베타 3수 탐색.
const WEIGHTS = [
    100, -20, 10, 5, 5, 10, -20, 100, -20, -50, -2, -2, -2, -2, -50, -20, 10, -2, 1, 1, 1, 1, -2, 10, 5, -2, 1, 0, 0, 1, -2, 5,
    5, -2, 1, 0, 0, 1, -2, 5, 10, -2, 1, 1, 1, 1, -2, 10, -20, -50, -2, -2, -2, -2, -50, -20, 100, -20, 10, 5, 5, 10, -20, 100
];
export const reversiMove = (board, { player = 2, depth = 3, chance = Math.random } = {}) => {
    const apply = (b, i, flips, p) => { const next = [...b]; next[i] = p; for (const f of flips) next[f] = p; return next; };
    const evaluate = (b, p) => {
        let total = 0, discs = 0;
        for (let i = 0; i < 64; i++) if (b[i]) { discs++; total += b[i] === p ? WEIGHTS[i] : -WEIGHTS[i]; }
        const mobility = reversiMoves(b, p).size - reversiMoves(b, 3 - p).size;
        if (discs > 54) total += (b.filter((v) => v === p).length - b.filter((v) => v === 3 - p).length) * 4;
        return total + mobility * 5;
    };
    const search = (b, p, d, alpha, beta, passed = false) => {
        const moves = reversiMoves(b, p);
        if (!moves.size) {
            if (passed) { const mine = b.filter((v) => v === p).length, theirs = b.filter((v) => v === 3 - p).length; return (mine - theirs) * 1000; }
            return -search(b, 3 - p, d, -beta, -alpha, true);
        }
        if (!d) return evaluate(b, p);
        let best = -Infinity;
        for (const [i, flips] of moves) {
            const value = -search(apply(b, i, flips, p), 3 - p, d - 1, -beta, -alpha);
            if (value > best) best = value; if (value > alpha) alpha = value; if (alpha >= beta) break;
        }
        return best;
    };
    let best = -Infinity, choices = [];
    for (const [i, flips] of reversiMoves(board, player)) {
        const value = -search(apply(board, i, flips, player), 3 - player, depth - 1, -Infinity, Infinity);
        if (value > best) { best = value; choices = [i]; } else if (value === best) choices.push(i);
    }
    return pick(choices, chance);
};
