import { node, history, duelFinish } from './core.js';
import { winningLine } from './rules.js';

// The three line-connection games share only placement, history and line checks.
export const connectionGame = (s, { columns, rows = columns, needed, className, pieces = ['×', '○'], stoneBoard = false, gravity = false, reverse = false }) => {
    let board = Array(columns * rows).fill(0), turn = 1, last = -1, moves = 0, victory = [], hover = -1;
    const columnButtons = [];
    const landing = (column) => {
        for (let y = rows - 1; y >= 0; y--) if (!board[y * columns + column]) return y * columns + column;
        return -1;
    };
    const render = (ended = false) => {
        element.dataset.turn = turn;
        element.style.setProperty('--ghost', `'${pieces[turn - 1]}'`);
        element.style.setProperty('--turn-color', turn === 1 ? '#ff8e7a' : '#82b6ff');
        cells.forEach((cell, i) => {
            const star = stoneBoard && [3, 7, 11].includes(i % columns) && [3, 7, 11].includes(Math.floor(i / columns));
            const preview = gravity && !ended && hover >= 0 && landing(hover) === i;
            cell.className = `cell ${board[i] ? `p${board[i]}` : ''} ${i === last ? 'last' : ''} ${victory.includes(i) ? 'win' : ''} ${star ? 'star' : ''} ${preview ? 'preview' : ''}`;
            cell.textContent = board[i] && !stoneBoard && !gravity ? pieces[board[i] - 1] : '';
            cell.setAttribute('aria-label', `${Math.floor(i / columns) + 1}행 ${i % columns + 1}열 ${board[i] ? `P${board[i]}` : '빈칸'}`);
        });
        columnButtons.forEach((button, x) => { button.disabled = ended || landing(x) < 0; });
        s.hud([
            ['PLAYER 1', stoneBoard ? '● 흑' : pieces[0], `p1 ${!ended && turn === 1 ? 'active' : ''}`],
            ['현재 차례', ended ? '대결 종료' : `P${turn}`],
            ['PLAYER 2', stoneBoard ? '○ 백' : pieces[1], `p2 ${!ended && turn === 2 ? 'active' : ''}`], ['수', moves]
        ]);
    };
    const past = history(() => ({ board, turn, last, moves }), (state) => {
        ({ board, turn, last, moves } = state); victory = []; render(); s.message(`직전 수를 되돌렸어요. P${turn} 차례예요.`);
    }, 256);
    const place = (index) => {
        const i = gravity ? landing(index % columns) : index;
        if (i < 0 || board[i]) {
            s.message(gravity ? '이 열은 가득 찼어요. 다른 열을 선택하세요.' : '이미 놓은 칸이에요. 빈칸을 선택하세요.'); return;
        }
        s.changed(); past.save(); board[i] = turn; last = i; moves++;
        s.sound(350 + turn * 120, .055); victory = winningLine(board, columns, i, needed);
        if (victory.length) {
            render(true);
            duelFinish(s, reverse ? 3 - turn : turn, reverse ? `P${turn}이 ${needed}개를 이어 반대 플레이어가 승리했어요.` : `${moves}수 만에 ${needed}개 연결을 완성했어요.`);
        } else if (board.every(Boolean)) { render(true); duelFinish(s, 0); }
        else {
            turn = 3 - turn; render();
            const coordinate = `${String.fromCharCode(65 + i % columns)}${rows - Math.floor(i / columns)}`;
            s.message(`최근 수 ${coordinate} · P${turn} 차례${reverse ? ' · 세 개를 이으면 패배!' : ''}`);
        }
    };
    const { cells, element } = s.grid(columns, rows, place, className);
    if (gravity) {
        const strip = node('div', 'connect-column-bar');
        for (let x = 0; x < columns; x++) {
            const button = node('button', '', `↓ ${x + 1}`); button.type = 'button'; button.dataset.column = x;
            button.setAttribute('aria-label', `${x + 1}열에 놓기`);
            s.on(button, 'click', () => { if (s.active()) { place(x); if (s.active()) s.focus(); } });
            strip.append(button); columnButtons.push(button);
        }
        const wrapper = node('div', 'connect-board-wrap'); wrapper.append(strip, element); s.root.append(wrapper);
        const preview = (event) => {
            if (!s.active()) return;
            const cell = event.target.closest('.cell'), column = event.target.closest('[data-column]');
            if (!cell && !column) return;
            const next = cell ? Number(cell.dataset.index) % columns : Number(column.dataset.column);
            if (hover !== next) { hover = next; render(); }
        };
        s.on(wrapper, 'pointermove', preview); s.on(wrapper, 'focusin', preview);
        s.on(wrapper, 'pointerleave', () => { hover = -1; if (!s.over) render(); });
    }
    const undo = () => past.undo();
    s.controls([{ label: '한 수 되돌리기 · Z', action: undo, disabled: () => !past.available() }]);
    s.bindKeys(['KeyZ', ...(gravity ? Array.from({ length: columns }, (_, i) => `Digit${i + 1}`) : [])], (code) => code === 'KeyZ' ? undo() : place(Number(code.slice(-1)) - 1));
    render();
    s.message(reverse ? 'P1 × 먼저 · 세 개를 연결한 사람이 패배하는 역전 규칙이에요.' : gravity ? '열 버튼 또는 1~7 키로 돌을 떨어뜨리세요. 희미한 칸이 착지 위치예요.' : stoneBoard ? '15×15 자유형 오목 · 5개 이상 연결 · 금수 없음 · 방향키로 칸 이동, Enter로 놓기.' : 'P1 × 먼저 · 빈칸 위에 다음 돌이 미리 보여요. 방향키로도 칸을 선택할 수 있어요.');
};
