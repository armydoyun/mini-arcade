import { random, history, seededRandom } from '../core.js';
import { floodRegion, floodGreedy } from '../rules.js';

const colors = ['#ff8e7a', '#82b6ff', '#b9f86b', '#f5d47d', '#c1a0ff', '#76d0c5'], symbols = ['●', '◆', '▲', '■', '✦', '○'];
export default (s) => {
    const seed = s.options.seed ?? random(1, 0xffffffff), rng = seededRandom(seed);
    const size = 10, limit = s.options.mode === 'easy' ? 30 : s.options.mode === 'hard' ? 22 : 25; let board, solution, moves = 0;
    for (let attempt = 0; attempt < 60; attempt++) { board = Array.from({ length: size * size }, () => Math.floor(rng() * 6)); solution = floodGreedy(board, size, limit); if (solution) break; }
    if (!solution) { board = Array.from({ length: size * size }, (_, i) => (i % size + Math.floor(i / size)) % 6); solution = floodGreedy(board, size, limit); }
    const { cells } = s.grid(size, size, () => {}, 'compact flood'); cells.forEach((cell) => { cell.disabled = true; });
    const render = () => { const area = floodRegion(board, size); cells.forEach((cell, i) => { cell.style.background = colors[board[i]]; cell.style.color = '#15202a99'; cell.textContent = symbols[board[i]]; cell.className = `cell ${area.has(i) ? 'territory' : ''}`; cell.style.fontSize = '11px'; cell.setAttribute('aria-label', `${symbols[board[i]]}${area.has(i) ? ', 내 영역' : ''}`); }); s.hud([['남은 선택', limit - moves], ['영역', `${area.size}%`], ['이동', moves]]); return area; };
    const past = history(() => ({ board, moves }), (state) => { ({ board, moves } = state); render(); });
    const choose = (color) => { if (board[0] === color) return; if (!moves) s.startClock(); s.changed(); past.save(); floodRegion(board, size).forEach((at) => { board[at] = color; }); moves++; const area = render(); s.sound(320 + color * 75, .05); if (area.size === board.length) s.finish({ score: moves, recordText: `${moves}회 선택`, title: '하나의 색으로 완성!', text: `${moves}번의 선택 · ${limit - moves}번의 여유를 남겼어요.` }); else if (moves >= limit) s.finish({ score: 0, win: false, title: '다른 색의 길을 찾아봐요', text: `${area.size}%까지 채웠어요. 이 판에는 제한 안에 완성하는 경로가 있어요.` }); };
    const undo = () => { if (past.undo()) s.assist(); };
    const controls = s.controls([...colors.map((color, i) => ({ label: `${symbols[i]} ${i + 1}`, title: `${i + 1}번 색 ${symbols[i]}`, action: () => choose(i), disabled: () => board[0] === i })), { label: '되돌리기 · Z', action: undo, disabled: () => !past.available() }]);
    [...controls.children].slice(0, 6).forEach((button, i) => { button.style.background = colors[i]; button.style.color = '#17212a'; button.style.borderColor = colors[i]; });
    s.setRecord(`${s.options.mode || 'classic'}:${seed.toString(36)}`, `${limit}회 · 문제 ${seed.toString(36).toUpperCase()}`);
    s.bindKeys(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'KeyZ'], (code) => code === 'KeyZ' ? undo() : choose(Number(code.slice(-1)) - 1)); render(); s.message('1~6으로 색을 선택하세요. 밝은 테두리가 현재 연결된 영역이에요.');
};
