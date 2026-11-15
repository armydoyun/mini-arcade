import assert from 'node:assert/strict';
import { slide2048, winningLine, reversiMoves, hexPath, tetrisShapes, rotateMatrix, tetrisFits } from '../js/rules.js';
import { puzzles, clues } from '../js/games/nonogram.js';
import { lightsSolution, mineNeighbors, floodGreedy, floodRegion, torusDistance } from '../js/rules.js';
import { circleBox } from '../js/core.js';
import { aimPath } from '../js/games/swipe-break.js';

let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
const row = (values) => [...values, ...Array(12).fill(0)];
assert.deepEqual(slide2048(row([2, 2, 2, 2]), 'ArrowLeft'), { board: row([4, 4, 0, 0]), score: 8, changed: true, merged: [0, 1] }); checks++;
assert.deepEqual(slide2048(row([4, 4, 8, 0]), 'ArrowLeft').board, row([8, 8, 0, 0])); checks++;
assert.deepEqual(slide2048(row([2, 0, 2, 4]), 'ArrowRight').board, row([0, 0, 4, 4])); checks++;
for (let mask = 0; mask < 256; mask++) {
    let value = mask; const board = row(Array.from({ length: 4 }, () => { const n = [0, 2, 4, 8][value % 4]; value = Math.floor(value / 4); return n; }));
    for (const direction of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) { const result = slide2048(board, direction); check(result.board.reduce((a, b) => a + b, 0) === board.reduce((a, b) => a + b, 0), '2048 conserves tile sum'); check(result.board.filter(Boolean).length <= board.filter(Boolean).length, '2048 never creates an extra tile during a slide'); }
}
let board = Array(225).fill(0); [30, 31, 32, 33, 34].forEach((i) => { board[i] = 1; }); check(winningLine(board, 15, 34, 5).length === 5, 'Gomoku horizontal win');
board = Array(225).fill(0); [13, 14, 15, 16, 17].forEach((i) => { board[i] = 1; }); check(!winningLine(board, 15, 15, 5).length, 'No row wrap for Gomoku');
board = Array(42).fill(0); [3, 10, 17, 24].forEach((i) => { board[i] = 2; }); check(winningLine(board, 7, 24, 4).length === 4, 'Connect Four vertical win');
board = Array(9).fill(0); [0, 4, 8].forEach((i) => { board[i] = 1; }); check(winningLine(board, 3, 8, 3).length === 3, 'Tic-tac-toe diagonal win');
board = Array(64).fill(0); board[27] = board[36] = 2; board[28] = board[35] = 1;
assert.deepEqual([...reversiMoves(board, 1).keys()], [19, 26, 37, 44]); checks++;
board[19] = 1; board[27] = 1; check(board.filter((v) => v === 1).length === 4, 'Reversi opening flips one stone');
for (let game = 0; game < 50; game++) {
    const b = Array(64).fill(0); b[27] = b[36] = 2; b[28] = b[35] = 1; let player = 1, passes = 0;
    for (let move = 0; move < 122 && passes < 2; move++) { const moves = reversiMoves(b, player); if (!moves.size) passes++; else { passes = 0; const indices = [...moves.keys()], at = indices[(game * 7 + move * 11) % indices.length], before = b.filter(Boolean).length; check(moves.get(at).length > 0, 'Every Reversi move flips at least one stone'); b[at] = player; moves.get(at).forEach((i) => { b[i] = player; }); check(b.filter(Boolean).length === before + 1, 'Reversi move adds exactly one stone'); } player = 3 - player; }
    check(!reversiMoves(b, 1).size && !reversiMoves(b, 2).size, 'Reversi game terminates with no legal moves');
}
for (let mask = 0; mask < 512; mask++) { const b = Array.from({ length: 9 }, (_, i) => mask & (1 << i) ? 1 : 2), a = hexPath(b, 3, 1), c = hexPath(b, 3, 2); check(Boolean(a.length) !== Boolean(c.length), 'Full Hex board has exactly one winning player'); }
for (const shape of tetrisShapes) { let rotated = shape; for (let n = 0; n < 4; n++) rotated = rotateMatrix(rotated); assert.deepEqual(rotated, shape); checks++; }
board = Array.from({ length: 20 }, () => Array(10).fill(0)); check(tetrisFits(board, [[1, 1]], 8, 19), 'Tetris valid corner'); check(!tetrisFits(board, [[1, 1]], 9, 19), 'Tetris right boundary'); check(!tetrisFits(board, [[1]], 0, 20), 'Tetris floor'); board[19][0] = 2; check(!tetrisFits(board, [[1]], 0, 19), 'Tetris pile collision');
for (const puzzle of puzzles) {
    const target = puzzle.split('/').map((line) => [...line].map(Number)), rows = target.map(clues), columns = target[0].map((_, x) => clues(target.map((r) => r[x]))), candidates = rows.map((c) => Array.from({ length: 32 }, (_, bits) => Array.from({ length: 5 }, (_, x) => (bits >> x) & 1)).filter((line) => String(clues(line)) === String(c))); let solutions = 0;
    const solve = (partial) => { if (solutions > 1) return; if (partial.length === 5) { if (columns.every((c, x) => String(c) === String(clues(partial.map((r) => r[x]))))) solutions++; return; } for (const line of candidates[partial.length]) solve([...partial, line]); };
    solve([]); check(solutions === 1, `Nonogram must have one solution: ${puzzle} (${solutions})`);
}
for (let bits = 0; bits < 512; bits++) {
    const board = Array.from({ length: 9 }, (_, i) => !!(bits & (1 << i))), solution = lightsSolution(board, 3); check(Array.isArray(solution), 'Every 3×3 Lights Out position is solvable');
    for (const i of solution) for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) { const x = i % 3 + dx, y = Math.floor(i / 3) + dy; if (x >= 0 && y >= 0 && x < 3 && y < 3) board[y * 3 + x] = !board[y * 3 + x]; }
    check(board.every((value) => !value), 'Lights solver actually turns off every light');
}
for (let seed = 0; seed < 100; seed++) {
    const board = Array(25).fill(false);
    for (let step = 0; step < 17; step++) { const i = (seed * 7 + step * 11) % 25; for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) { const x = i % 5 + dx, y = Math.floor(i / 5) + dy; if (x >= 0 && y >= 0 && x < 5 && y < 5) board[y * 5 + x] = !board[y * 5 + x]; } }
    const solution = lightsSolution(board, 5); check(solution !== null, 'Generated 5×5 Lights has a solution');
    for (const i of solution) for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) { const x = i % 5 + dx, y = Math.floor(i / 5) + dy; if (x >= 0 && y >= 0 && x < 5 && y < 5) board[y * 5 + x] = !board[y * 5 + x]; }
    check(!board.some(Boolean), '5×5 solver solution is valid');
}
check(mineNeighbors(0, 9, 9).length === 3, 'Mine corner has three neighbors'); check(mineNeighbors(40, 9, 9).length === 8, 'Mine center has eight neighbors'); check(!mineNeighbors(8, 9, 9).includes(9), 'Mine neighbors do not wrap rows');
check(circleBox({ x: -4, y: -4 }, 5, { x: 0, y: 0, w: 10, h: 10 }) === null, 'Ball misses a rectangular corner outside its radius'); check(circleBox({ x: -3, y: -3 }, 5, { x: 0, y: 0, w: 10, h: 10 }).depth > 0, 'Ball hits a corner within its true radius');
check(circleBox({ x: 5, y: 5 }, 2, { x: 0, y: 0, w: 10, h: 10 }).depth > 0, 'Embedded ball has a finite separation normal');
check(torusDistance({ x: 1, y: 50 }, { x: 599, y: 50 }, 600, 460) === 2, 'Asteroids wrap collision crosses the edge');
for (const angle of [-Math.PI / 2, -Math.PI + .16, -.16, -1, -2]) { const path = aimPath(250, angle, []); check(path.length >= 2 && path.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)), 'Aim reflection paths remain finite, including vertical rays'); }
const flooded = Array.from({ length: 100 }, (_, i) => (i % 10 + Math.floor(i / 10)) % 6), path = floodGreedy(flooded, 10, 22); check(path && path.length <= 22, 'Flood fallback is solvable inside the hardest budget'); for (const color of path) floodRegion(flooded, 10).forEach((i) => { flooded[i] = color; }); check(floodRegion(flooded, 10).size === 100, 'Flood construction has a valid completing path');
console.log(`PASS: ${checks.toLocaleString()} rule assertions`);
