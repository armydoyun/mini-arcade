import { node, history } from '../core.js';
import { nonograms } from '../puzzles.js';
export const puzzles = nonograms.map((item) => item.pattern);
export const clues = (line) => { const groups = []; let run = 0; for (const value of [...line, 0]) { if (Number(value)) run++; else if (run) { groups.push(run); run = 0; } } return groups.length ? groups : [0]; };

export default (s) => {
    const level = Math.max(0, Math.min(nonograms.length - 1, Number(s.options.mode?.split('-')[1]) || 0)), puzzle = nonograms[level], pattern = puzzle.pattern.split('/').map((row) => [...row].map(Number)), size = pattern.length;
    let board = Array(size * size).fill(0), marking = false, moves = 0, drag = null, hinted = -1;
    const rowClues = pattern.map(clues), columnClues = pattern[0].map((_, x) => clues(pattern.map((row) => row[x]))), wrapper = node('div', 'nonogram-wrap'), top = node('div', 'nonogram-top'), left = node('div', 'nonogram-left');
    top.style.gridTemplateColumns = `repeat(${size}, 1fr)`; left.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    const topLabels = columnClues.map((value) => node('div', 'nonogram-clue', value.join('\n'))), leftLabels = rowClues.map((value) => node('div', 'nonogram-clue', value.join(' '))); top.append(...topLabels); left.append(...leftLabels); wrapper.append(top, left); s.root.append(wrapper);
    const match = (a, b) => String(a) === String(b);
    const render = () => {
        const filled = board.map((v) => v === 1 ? 1 : 0); cells.forEach((cell, i) => {
            cell.className = `cell ${board[i] === 1 ? 'filled' : board[i] === -1 ? 'mark' : ''} ${i === hinted ? 'hint' : ''}`; cell.textContent = board[i] === -1 ? '×' : ''; cell.setAttribute('aria-label', `${Math.floor(i / size) + 1}행 ${i % size + 1}열 ${board[i] === 1 ? '채움' : board[i] === -1 ? '비움 표시' : '미정'}`); });
        const rowDone = rowClues.map((value, y) => match(value, clues(filled.slice(y * size, y * size + size)))), colDone = columnClues.map((value, x) => match(value, clues(Array.from({ length: size }, (_, y) => filled[y * size + x])))); leftLabels.forEach((label, i) => label.classList.toggle('done', rowDone[i])); topLabels.forEach((label, i) => label.classList.toggle('done', colDone[i])); s.hud([['퍼즐', `${level + 1} / ${nonograms.length}`], ['완성한 단서', `${rowDone.filter(Boolean).length + colDone.filter(Boolean).length} / ${size * 2}`], ['조작', moves]]);
        if (moves && rowDone.every(Boolean) && colDone.every(Boolean) && !drag) { const seconds = Math.max(1, Math.floor(s.elapsed() + 1e-7)); s.finish({ seconds, score: seconds, recordText: `${seconds}초`, title: `${puzzle.name} 완성!`, text: `${seconds}초 · ${moves}번의 조작으로 숨은 그림을 찾았어요.`, next: level + 1 < nonograms.length ? { mode: `puzzle-${level + 1}` } : null }); }
    };
    const past = history(() => ({ board, moves }), (state) => { ({ board, moves } = state); hinted = -1; render(); });
    const paint = (i, value) => { if (board[i] === value) return; if (!moves) s.startClock(); s.changed(); board[i] = value; moves++; hinted = -1; render(); };
    const change = (i, mark = marking) => { past.save(); paint(i, mark ? board[i] === -1 ? 0 : -1 : board[i] === 1 ? 0 : 1); };
    const { element, cells } = s.grid(size, size, (i, event) => { if (!event.detail) change(i); }, 'nonogram'); wrapper.append(element);
    s.on(element, 'pointerdown', (event) => { const cell = event.target.closest('.cell'); if (!cell || !s.active() || event.button !== 0) return; const i = Number(cell.dataset.index); past.save(); drag = { value: marking ? board[i] === -1 ? 0 : -1 : board[i] === 1 ? 0 : 1 }; paint(i, drag.value); });
    s.on(element, 'pointerover', (event) => { const cell = event.target.closest('.cell'); if (drag && cell && s.active() && (event.buttons & 1)) paint(Number(cell.dataset.index), drag.value); }); const endDrag = () => { if (drag) { drag = null; if (s.active()) render(); } }; s.on(window, 'pointerup', endDrag); s.on(window, 'pointercancel', endDrag); s.on(s.root, 'gamepause', () => { drag = null; }); s.on(s.root, 'gameresume', () => { if (s.active()) render(); });
    s.on(element, 'contextmenu', (event) => { event.preventDefault(); const cell = event.target.closest('.cell'); if (cell && s.active()) change(Number(cell.dataset.index), true); });
    const undo = () => { if (past.undo()) s.assist(); }, help = () => { let index = board.findIndex((value, i) => value && ((value === 1) !== !!pattern[Math.floor(i / size)][i % size])); if (index < 0) index = board.findIndex((value, i) => !value && pattern[Math.floor(i / size)][i % size]); if (index >= 0) { past.save(); s.assist(); paint(index, pattern[Math.floor(index / size)][index % size] ? 1 : -1); hinted = index; if (!s.over) render(); } };
    const toggle = () => { marking = !marking; modeButton.textContent = marking ? '× 비움 표시 · M' : '칸 채우기 · M'; modeButton.classList.toggle('selected', marking); modeButton.setAttribute('aria-pressed', marking); modeButton.title = modeButton.textContent; };
    const controls = s.controls([{ label: '칸 채우기 · M', action: toggle }, { label: '되돌리기 · Z', action: undo, disabled: () => !past.available() }, { label: '한 칸 힌트 · H', action: help }]), modeButton = controls.children[0]; modeButton.setAttribute('aria-pressed', false);
    s.bindKeys(['KeyM', 'KeyZ', 'KeyH'], (code) => code === 'KeyM' ? toggle() : code === 'KeyZ' ? undo() : help()); s.setRecord(`puzzle-${level}`, `퍼즐 ${level + 1} / ${nonograms.length}`); render(); s.message('드래그로 이어 칠하기 · 우클릭 × · 단서를 만족한 행과 열은 초록색이 돼요.');
};
