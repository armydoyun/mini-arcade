import { node, duelHud, duelFinish, history } from '../core.js';
import { hexPath, hexLayout } from '../rules.js';

export default (s) => {
    const size = s.options.mode === 'large' ? 9 : 7, layout = hexLayout(size), cells = [];
    let board = Array(size * size).fill(0), turn = 1, last = -1, path = [], moves = 0, focused = 0;
    const goals = node('div', 'hex-goals'); goals.append(node('span', '', 'P1 ↕ 위에서 아래로'), node('span', '', 'P2 ↔ 왼쪽에서 오른쪽으로')); s.root.append(goals);
    const element = node('div', 'hex-board'); element.style.aspectRatio = `${layout.width} / ${layout.height}`; element.style.setProperty('--hex-ratio', layout.width / layout.height);
    element.setAttribute('role', 'group'); element.setAttribute('aria-label', `${size}×${size} 헥스 보드`);
    const border = node('div', 'hex-goal-lines');
    border.innerHTML = `<svg viewBox="0 0 ${layout.width} ${layout.height}" aria-hidden="true">${layout.goals.map((d, i) => `<path d="${d}" stroke="${i < 2 ? '#ff8e7a' : '#82b6ff'}"/>`).join('')}</svg>`;
    element.append(border);
    layout.cells.forEach(({ x, y }, i) => {
        const button = node('button', 'hex-cell'); button.type = 'button'; button.dataset.index = i; button.tabIndex = i ? -1 : 0;
        button.style.left = `${x / layout.width * 100}%`; button.style.top = `${y / layout.height * 100}%`;
        button.style.width = `${100 / layout.width}%`; button.style.height = `${layout.unitHeight / layout.height * 100}%`;
        cells.push(button); element.append(button);
    });
    const focus = (index, move = false) => { cells[focused].tabIndex = -1; focused = index; cells[index].tabIndex = 0; if (move) cells[index].focus({ preventScroll: true }); };
    const render = (ended = false) => {
        element.dataset.turn = turn;
        cells.forEach((cell, i) => {
            cell.className = `hex-cell ${board[i] ? `p${board[i]}` : ''} ${i === last ? 'last' : ''} ${path.includes(i) ? 'win' : ''}`;
            cell.textContent = i === last ? '•' : board[i] || ''; cell.setAttribute('aria-label', `${Math.floor(i / size) + 1}행 ${i % size + 1}열 ${board[i] ? `P${board[i]}` : '빈칸'}`);
        });
        duelHud(s, ended ? 0 : turn, '↕ 위·아래', '↔ 왼쪽·오른쪽');
    };
    const past = history(() => ({ board, turn, last, moves }), (state) => { ({ board, turn, last, moves } = state); path = []; render(); s.message(`직전 돌을 회수했어요. P${turn} 차례예요.`); });
    s.root.append(element);
    s.on(element, 'click', (event) => {
        const cell = event.target.closest('.hex-cell'); if (!cell || !s.active()) return;
        const i = Number(cell.dataset.index); focus(i);
        if (board[i]) { s.message('이미 놓인 돌은 바꿀 수 없어요. 빈 육각형을 선택하세요.'); return; }
        s.changed(); past.save(); board[i] = turn; last = i; moves++; s.sound(turn === 1 ? 400 : 520, .05); path = hexPath(board, size, turn);
        if (path.length) { render(true); duelFinish(s, turn, `${moves}수 만에 양쪽 변을 잇는 길을 완성했어요.`); }
        else { turn = 3 - turn; render(); s.message(`P${turn} 차례 · ${turn === 1 ? '붉은 위·아래' : '푸른 왼쪽·오른쪽'} 변을 연결하세요.`); }
    });
    s.on(element, 'keydown', (event) => {
        const cell = event.target.closest('.hex-cell'); if (!cell || (!s.active() && !s.over)) return;
        const i = Number(cell.dataset.index), x = i % size;
        const next = { ArrowLeft: x ? i - 1 : i, ArrowRight: x < size - 1 ? i + 1 : i, ArrowUp: i >= size ? i - size : i, ArrowDown: i + size < cells.length ? i + size : i, Home: i - x, End: i - x + size - 1 }[event.code];
        if (next !== undefined) { event.preventDefault(); event.stopPropagation(); focus(next, true); }
    });
    const undo = () => past.undo(); s.controls([{ label: '한 수 되돌리기 · Z', action: undo, disabled: () => !past.available() }]); s.bindKeys(['KeyZ'], undo);
    render(); s.message('붉은 변 ↕은 P1, 푸른 변 ↔은 P2의 목표예요. 변을 공유한 육각형만 연결돼요.');
};
