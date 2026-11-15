import { duelHud, duelFinish, cpuHud, cpuFinish, history } from '../core.js';
import { reversiMoves } from '../rules.js';
import { reversiMove } from '../ai.js';

export default (s) => {
    const cpu = s.options.mode === 'cpu';
    let board = Array(64).fill(0), turn = 1, last = -1, hover = -1, thinking = 0; board[27] = board[36] = 2; board[28] = board[35] = 1; let legal = reversiMoves(board, turn);
    const count = (p) => board.filter((v) => v === p).length;
    const render = () => {
        const mine = !cpu || turn === 1, preview = new Set(mine ? legal.get(hover) || [] : []); element.dataset.turn = turn;
        cells.forEach((cell, i) => { const open = mine && legal.has(i); cell.className = `cell ${board[i] ? `p${board[i]}` : open ? 'legal' : ''} ${i === last ? 'last' : ''} ${preview.has(i) ? 'preview-flip' : ''}`; cell.textContent = open ? String(legal.get(i).length) : ''; cell.setAttribute('aria-label', `${Math.floor(i / 8) + 1}행 ${i % 8 + 1}열 ${board[i] ? `P${board[i]}` : open ? `${legal.get(i).length}개 뒤집기 가능` : '놓을 수 없음'}`); });
        (cpu ? cpuHud : duelHud)(s, turn, `● ${count(1)}`, `○ ${count(2)}`);
    };
    const name = (p) => (cpu ? (p === 1 ? '나' : '컴퓨터') : `P${p}`);
    const past = history(() => ({ board, turn, last }), (state) => { ({ board, turn, last } = state); legal = reversiMoves(board, turn); hover = -1; thinking++; render(); s.message(cpu ? '직전 수와 뒤집힌 돌을 되돌렸어요. 다시 둬 보세요.' : `직전 수와 뒤집힌 돌을 되돌렸어요. P${turn} 차례예요.`); });
    const think = () => { const token = ++thinking; s.later(0.5, () => { if (token === thinking && turn === 2 && !s.over) play(reversiMove(board), true); }); };
    const play = (i, fromCpu = false) => {
        if (cpu && turn === 2 && !fromCpu) { s.message('컴퓨터가 수를 고르는 중이에요.'); return; }
        if (!legal.has(i)) { s.message('숫자가 표시된 칸에 놓으세요. 숫자는 뒤집을 돌의 개수예요.'); return; }
        s.changed(); past.save(); const flipped = legal.get(i), mover = turn; board[i] = turn; flipped.forEach((at) => { board[at] = turn; }); last = i; hover = -1; s.sound(380 + flipped.length * 30, .07); turn = 3 - turn; legal = reversiMoves(board, turn);
        if (!legal.size) { const skipped = turn; turn = 3 - turn; legal = reversiMoves(board, turn); s.message(`${name(skipped)}${cpu && skipped === 1 ? '는' : '은'} 둘 곳이 없어 자동 패스 · ${name(turn)}${cpu ? '가' : '이'} 이어서 둬요.`); }
        else s.message(cpu ? (mover === 2 ? `컴퓨터가 ${flipped.length}개를 뒤집었어요. 내 차례 · ${legal.size}곳에 둘 수 있어요.` : `${flipped.length}개를 뒤집었어요. 컴퓨터가 생각 중이에요.`) : `${flipped.length}개를 뒤집었어요. P${turn}은 ${legal.size}곳에 놓을 수 있어요.`);
        if (!legal.size) { turn = 0; render(); const a = count(1), b = count(2); (cpu ? cpuFinish : duelFinish)(s, a === b ? 0 : a > b ? 1 : 2, `둘 다 둘 곳이 없어요. 흑 ${a}개 · 백 ${b}개`); }
        else { render(); if (cpu && turn === 2) think(); }
    };
    const { cells, element } = s.grid(8, 8, (i) => play(i), 'reversi');
    s.on(element, 'pointerover', (event) => { const cell = event.target.closest('.cell'); if (cell && s.active()) { hover = Number(cell.dataset.index); render(); } }); s.on(element, 'pointerleave', () => { hover = -1; if (!s.over) render(); });
    s.on(element, 'focusin', (event) => { const cell = event.target.closest('.cell'); if (cell && s.active()) { hover = Number(cell.dataset.index); render(); } });
    // 컴퓨터와 둘 때는 컴퓨터의 응수까지 함께 되돌린다.
    const undo = () => { past.undo(); if (cpu && turn === 2 && past.available()) past.undo(); };
    s.controls([{ label: '한 수 되돌리기 · Z', action: undo, disabled: () => !past.available() }]); s.bindKeys(['KeyZ'], undo); render();
    s.message(cpu ? '혼자 하기 · 내가 흑 ●으로 먼저 둬요. 모서리는 뒤집히지 않는 좋은 자리예요.' : '숫자 = 뒤집을 돌의 수. 칸 위에 마우스를 올리면 뒤집을 돌을 미리 볼 수 있어요.');
};
