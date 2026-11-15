import { duelHud, duelFinish, history } from '../core.js';
import { reversiMoves } from '../rules.js';

export default (s) => {
    let board = Array(64).fill(0), turn = 1, last = -1, hover = -1; board[27] = board[36] = 2; board[28] = board[35] = 1; let legal = reversiMoves(board, turn);
    const render = () => {
        const preview = new Set(legal.get(hover) || []); element.dataset.turn = turn;
        cells.forEach((cell, i) => { cell.className = `cell ${board[i] ? `p${board[i]}` : legal.has(i) ? 'legal' : ''} ${i === last ? 'last' : ''} ${preview.has(i) ? 'preview-flip' : ''}`; cell.textContent = legal.has(i) ? String(legal.get(i).length) : ''; cell.setAttribute('aria-label', `${Math.floor(i / 8) + 1}행 ${i % 8 + 1}열 ${board[i] ? `P${board[i]}` : legal.has(i) ? `${legal.get(i).length}개 뒤집기 가능` : '놓을 수 없음'}`); }); duelHud(s, turn, `● ${board.filter((v) => v === 1).length}`, `○ ${board.filter((v) => v === 2).length}`);
    };
    const past = history(() => ({ board, turn, last }), (state) => { ({ board, turn, last } = state); legal = reversiMoves(board, turn); hover = -1; render(); s.message(`직전 수와 뒤집힌 돌을 되돌렸어요. P${turn} 차례예요.`); });
    const { cells, element } = s.grid(8, 8, (i) => {
        if (!legal.has(i)) { s.message('숫자가 표시된 칸에 놓으세요. 숫자는 뒤집을 돌의 개수예요.'); return; } s.changed(); past.save(); const flipped = legal.get(i); board[i] = turn; flipped.forEach((at) => { board[at] = turn; }); last = i; hover = -1; s.sound(380 + flipped.length * 30, .07); turn = 3 - turn; legal = reversiMoves(board, turn);
        if (!legal.size) { const skipped = turn; turn = 3 - turn; legal = reversiMoves(board, turn); s.message(`P${skipped}은 둘 곳이 없어 자동 패스 · P${turn}이 이어서 둬요.`); } else s.message(`${flipped.length}개를 뒤집었어요. P${turn}은 ${legal.size}곳에 놓을 수 있어요.`);
        if (!legal.size) { turn = 0; render(); const a = board.filter((v) => v === 1).length, b = board.filter((v) => v === 2).length; duelFinish(s, a === b ? 0 : a > b ? 1 : 2, `둘 다 둘 곳이 없어요. 흑 ${a}개 · 백 ${b}개`); } else render();
    }, 'reversi');
    s.on(element, 'pointerover', (event) => { const cell = event.target.closest('.cell'); if (cell && s.active()) { hover = Number(cell.dataset.index); render(); } }); s.on(element, 'pointerleave', () => { hover = -1; if (!s.over) render(); });
    s.on(element, 'focusin', (event) => { const cell = event.target.closest('.cell'); if (cell && s.active()) { hover = Number(cell.dataset.index); render(); } });
    const undo = () => past.undo(); s.controls([{ label: '한 수 되돌리기 · Z', action: undo, disabled: () => !past.available() }]); s.bindKeys(['KeyZ'], undo); render(); s.message('숫자 = 뒤집을 돌의 수. 칸 위에 마우스를 올리면 뒤집을 돌을 미리 볼 수 있어요.');
};
