// 혼자 하기(컴퓨터 상대) 검사: 즉시 승리·방어, 무작위 상대와의 대국 승률, 실제 모듈의 응수·되돌리기·결과.
import { tictactoeMove, connectFourMove, gomokuMove, reversiMove } from '../js/ai.js';
import { winningLine, reversiMoves } from '../js/rules.js';
import { advance, mount, check, counts } from './harness.mjs';

let seed = 99;
const rng = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 4294967296; };
const randomOf = (list) => list[Math.floor(rng() * list.length)];
const empties = (board) => board.flatMap((v, i) => (v ? [] : [i]));

// 틱택토: 실수 없는 컴퓨터는 무작위 상대에게 지지 않고, 자기 자신과 두면 항상 비긴다.
let tttLosses = 0, tttWins = 0;
for (let game = 0; game < 100; game++) {
    const board = Array(9).fill(0); let turn = 1, winner = 0;
    while (!winner && board.some((v) => !v)) {
        const i = turn === 1 ? randomOf(empties(board)) : tictactoeMove(board, { mistake: 0, chance: rng });
        check(!board[i], 'Tic-tac-toe AI only picks empty cells'); board[i] = turn;
        if (winningLine(board, 3, i, 3).length) winner = turn; turn = 3 - turn;
    }
    if (winner === 1) tttLosses++; if (winner === 2) tttWins++;
}
check(tttLosses === 0 && tttWins > 60, `Perfect tic-tac-toe AI never loses to random play (wins ${tttWins}, losses ${tttLosses})`);
check(tictactoeMove([1, 1, 0, 2, 2, 0, 0, 0, 0], { mistake: 1, chance: rng }) === 5, 'Tic-tac-toe AI takes an immediate win even with mistakes on');
check(tictactoeMove([1, 1, 0, 0, 2, 0, 0, 0, 0], { mistake: 1, chance: rng }) === 2, 'Tic-tac-toe AI blocks an immediate threat even with mistakes on');
check(tictactoeMove([1, 0, 0, 0, 0, 0, 0, 0, 0], { reverse: true, mistake: 0, chance: rng }) !== undefined, 'Reverse tic-tac-toe AI answers');
for (let game = 0; game < 40; game++) { // 역전 규칙에서도 실수 없는 컴퓨터는 무작위 상대에게 지지 않는다
    const board = Array(9).fill(0); let turn = 1, loser = 0;
    while (!loser && board.some((v) => !v)) { const i = turn === 1 ? randomOf(empties(board)) : tictactoeMove(board, { reverse: true, mistake: 0, chance: rng }); board[i] = turn; if (winningLine(board, 3, i, 3).length) loser = turn; turn = 3 - turn; }
    check(loser !== 2, 'Reverse tic-tac-toe AI never completes a line against random play');
}

// 사목: 즉시 승리·방어, 무작위 상대 전승에 가까운 승률
const c4 = (moves) => { const b = Array(42).fill(0); moves.forEach(([x, p]) => { for (let y = 5; y >= 0; y--) if (!b[y * 7 + x]) { b[y * 7 + x] = p; break; } }); return b; };
check(connectFourMove(c4([[0, 2], [1, 1], [0, 2], [1, 1], [0, 2], [1, 1]]), { chance: rng }) % 7 === 0, 'Connect Four AI completes its own vertical four');
check(connectFourMove(c4([[3, 1], [6, 2], [4, 1], [6, 2], [5, 1]]), { chance: rng }) % 7 === 2, 'Connect Four AI blocks an open three');
let c4Wins = 0;
for (let game = 0; game < 30; game++) {
    const b = Array(42).fill(0); let turn = 1, winner = 0;
    while (!winner && b.some((v) => !v)) {
        let i; if (turn === 1) { const cols = [0, 1, 2, 3, 4, 5, 6].filter((x) => !b[x]); const x = randomOf(cols); for (let y = 5; y >= 0; y--) if (!b[y * 7 + x]) { i = y * 7 + x; break; } } else i = connectFourMove(b, { chance: rng });
        check(!b[i] && (i >= 35 || b[i + 7]), 'Connect Four AI move respects gravity'); b[i] = turn;
        if (winningLine(b, 7, i, 4).length) winner = turn; turn = 3 - turn;
    }
    if (winner === 2) c4Wins++;
}
check(c4Wins >= 29, `Connect Four AI beats random play (${c4Wins}/30)`);

// 오목: 다섯 완성, 열린 넷 방어, 무작위 상대 전승
const gb = (stones) => { const b = Array(225).fill(0); stones.forEach(([x, y, p]) => { b[y * 15 + x] = p; }); return b; };
check(gomokuMove(gb([[3, 7, 2], [4, 7, 2], [5, 7, 2], [6, 7, 2], [3, 3, 1], [4, 4, 1], [5, 5, 1], [6, 6, 1]]), { chance: rng }) % 15 === 2 || gomokuMove(gb([[3, 7, 2], [4, 7, 2], [5, 7, 2], [6, 7, 2], [3, 3, 1], [4, 4, 1], [5, 5, 1], [6, 6, 1]]), { chance: rng }) === 7 * 15 + 7, 'Gomoku AI completes five before defending');
const threat = gomokuMove(gb([[4, 4, 1], [5, 4, 1], [6, 4, 1], [7, 4, 1], [9, 9, 2]]), { chance: rng });
check(threat === 4 * 15 + 3 || threat === 4 * 15 + 8, 'Gomoku AI blocks a four');
check(gomokuMove(Array(225).fill(0)) === 112, 'Gomoku AI opens in the center');
let goWins = 0;
for (let game = 0; game < 15; game++) {
    const b = Array(225).fill(0); let turn = 1, winner = 0;
    for (let n = 0; n < 225 && !winner; n++) { const i = turn === 1 ? randomOf(empties(b)) : gomokuMove(b, { chance: rng }); check(!b[i], 'Gomoku AI picks an empty point'); b[i] = turn; if (winningLine(b, 15, i, 5).length) winner = turn; turn = 3 - turn; }
    if (winner === 2) goWins++;
}
check(goWins === 15, `Gomoku AI beats random play (${goWins}/15)`);

// 오델로: 합법 수만 두고 무작위 상대를 크게 이긴다. 모서리를 놓치지 않는다.
let rvWins = 0;
for (let game = 0; game < 20; game++) {
    let b = Array(64).fill(0); b[27] = b[36] = 2; b[28] = b[35] = 1; let turn = 1, passes = 0;
    while (passes < 2) {
        const moves = reversiMoves(b, turn); if (!moves.size) { passes++; turn = 3 - turn; continue; } passes = 0;
        const i = turn === 1 ? randomOf([...moves.keys()]) : reversiMove(b, { chance: rng });
        check(moves.has(i), 'Reversi AI plays a legal move'); b = [...b]; b[i] = turn; moves.get(i).forEach((f) => { b[f] = turn; }); turn = 3 - turn;
    }
    if (b.filter((v) => v === 2).length > b.filter((v) => v === 1).length) rvWins++;
}
check(rvWins >= 18, `Reversi AI beats random play (${rvWins}/20)`);

// 실제 모듈: 사람의 수 뒤 컴퓨터가 응수하고, 생각하는 동안의 입력은 막고, 되돌리기는 두 수를 함께 되돌린다.
const stones = (t) => t.cells().filter((cell) => /\bp[12]\b/.test(cell.className)).length;
for (const [id, first] of [['tictactoe', 4], ['connect-four', 3], ['gomoku', 112], ['reversi', 19]]) {
    const t = mount(id, { mode: 'cpu' }), before = stones(t);
    t.click(first); check(stones(t) === before + 1, `${id} cpu: my move is placed`);
    t.click(first === 112 ? 0 : 8); check(stones(t) === before + 1, `${id} cpu: input is ignored while the computer thinks`);
    advance(0.7); check(stones(t) >= before + 2, `${id} cpu: the computer answers`);
    check(t.state.hud[0][0] === '나' && t.state.hud[2][0] === '컴퓨터', `${id} cpu: HUD names me and the computer`);
    t.controls.children[0].emit('click'); check(stones(t) === before, `${id} cpu: undo removes both moves`);
    t.destroy();
}
// 끝까지: 틱택토는 무승부 또는 컴퓨터 승, 결과 제목이 컴퓨터 대전 문구다
{
    const t = mount('tictactoe', { mode: 'cpu' });
    for (let n = 0; n < 9 && !t.state.results.length; n++) { const open = t.cells().findIndex((cell) => !/\bp[12]\b/.test(cell.className)); t.click(open); advance(0.7); }
    const result = t.state.results[0]; check(result && ['승리!', '컴퓨터 승리', '무승부!'].includes(result.title), 'Tic-tac-toe cpu game finishes with a computer-match title'); t.destroy();
}
{
    const t = mount('reversi', { mode: 'cpu' }); let guard = 0;
    while (!t.state.results.length && guard++ < 80) { const open = t.cells().findIndex((cell) => /\blegal\b/.test(cell.className)); if (open >= 0) t.click(open); advance(0.7); }
    check(t.state.results.length === 1, 'Reversi cpu game plays to the end'); t.destroy();
}
// Pong: 컴퓨터 패들은 혼자서 공을 받아치고, 가만히 있는 사람에게서 점수를 따내 경기를 끝낸다.
{
    const t = mount('pong', { mode: 'cpu' });
    check(t.state.hud[2][0] === '컴퓨터', 'Pong cpu: HUD names the computer');
    let guard = 0; while (!t.state.results.length && guard++ < 200) advance(1);
    const result = t.state.results[0];
    check(result?.winner === 2 && result.title === '컴퓨터 승리', 'Pong cpu: an idle player loses to the computer');
    t.destroy();
}
console.log(`PASS: ${counts().assertions} computer-opponent conditions`);
