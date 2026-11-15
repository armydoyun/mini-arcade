import { node, history, reducedMotion } from '../core.js';
import { rotatePorts, pipeNetwork } from '../rules.js';
import { pipePuzzles } from '../puzzles.js';

export default (s) => {
    s.pauseOnStall = false;
    const index = Math.max(0, Math.min(pipePuzzles.length - 1, Number(s.options.mode?.split('-')[1]) || 0)), puzzle = pipePuzzles[index], size = puzzle.size, solution = [...puzzle.solution].map((n) => parseInt(n,16)), fixed = new Set(puzzle.fixed), ends = [[12,0],[24,12],[12,24],[0,12]];
    let board = [...puzzle.initial].map((n) => parseInt(n,16)), turns = Array(board.length).fill(0), moves = 0, selected = 0, ending = false;
    const locked = (i) => fixed.has(i) || board[i] === 15;
    const render = () => {
        const network = pipeNetwork(board, size, puzzle.source), leaks = new Set(network.leaks);
        cells.forEach((cell, i) => {
            cell.className = `cell logic-cell pipe-tile ${network.connected.has(i) ? 'pipe-powered' : ''} ${locked(i) ? 'pipe-fixed' : ''} ${i === puzzle.source ? 'pipe-source' : ''} ${selected === i ? 'puzzle-selected' : ''}`;
            shapes[i].style.transform = `rotate(${turns[i] * 90}deg)`;
            const warning = ends.map(([x,y],d) => leaks.has(i * 4 + d) ? `<circle cx="${x * .75 + 3}" cy="${y * .75 + 3}" r="1.6" class="pipe-leak"/>` : '').join('');
            warnings[i].innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${warning}</svg>`;
            cell.setAttribute('aria-label', `${Math.floor(i / size) + 1}행 ${i % size + 1}열 ${i === puzzle.source ? '전원 · ' : ''}${network.connected.has(i) ? '연결됨' : '연결 안 됨'} · ${ends.map((_,d) => board[i] & (1 << d) ? ['위','오른쪽','아래','왼쪽'][d] : '').filter(Boolean).join('·')}${locked(i) ? ' · 고정' : ' · 회전 가능'}`);
            cell.setAttribute('aria-disabled', locked(i) || ending);
        });
        grid.focus(selected); s.hud([['전원 연결', `${network.connected.size} / ${board.length}`], ['열린 끝', network.leaks.length], ['회전 / 최소', `${moves} / ${puzzle.par}`]]); return network;
    };
    const past = history(() => ({ board, turns, moves, selected }), (saved) => { ({ board, turns, moves, selected } = saved); s.releaseKeys(); render(); s.message('파이프 방향과 회전 수를 되돌렸어요.'); }, Infinity);
    const rotate = (i, direction = 1) => {
        selected = i; if (!s.active() || ending) return;
        if (locked(i)) { render(); s.message('◆ 고정 파이프는 돌릴 수 없어요. 이 연결을 기준으로 주변을 맞춰 보세요.'); return; }
        if (!moves) s.startClock(); past.save(); board[i] = rotatePorts(board[i],direction); turns[i] += direction; moves++; s.changed(); const network = render(); s.sound(330 + Math.min(network.connected.size,20) * 14, .035);
        if (network.win) { ending = true; s.syncTools(); s.message('열린 끝 없이 모두 이어졌어요!'); s.later(reducedMotion() ? 0 : .22, () => s.finish({ score: moves, recordText: `${moves}회 회전 · 최소 ${puzzle.par}회`, title: '모든 길에 불이 들어왔어요!', text: `${puzzle.name} · ${moves}회 회전 · 시작 최소 ${puzzle.par}회` })); }
        else s.message('초록은 전원에 이어진 파이프, 붉은 점은 열린 끝이에요. 전부 연결하고 열린 끝을 없애세요.');
    };
    const grid = s.grid(size, size, (i) => rotate(i), 'pipe-board'), { element, cells } = grid;
    const warnings = cells.map(() => node('span','pipe-warnings')), shapes = cells.map((cell,i) => {
        const shape = node('span','pipe-lines'), paths = ends.map(([x,y],d) => board[i] & (1 << d) ? `M12 12L${x} ${y}` : '').join('');
        shape.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths}" class="pipe-track"/><path d="${paths}" class="pipe-flow"/><circle cx="12" cy="12" r="${i === puzzle.source ? 4 : 2.2}" class="pipe-cap"/></svg>`;
        cell.append(shape,warnings[i]); if (locked(i)) { const anchor = node('span','pipe-anchor','◆'); anchor.setAttribute('aria-hidden','true'); cell.append(anchor); } return shape;
    });
    const undo = () => { if (!ending) past.undo(); }, help = () => {
        if (ending) return; const at = board[selected] !== solution[selected] && !locked(selected) ? selected : board.findIndex((v,i) => v !== solution[i] && !locked(i));
        if (at >= 0) { const distances = [1,-1,2].filter((n) => rotatePorts(board[at],n) === solution[at]); s.assist(); rotate(at,distances[0] < 0 ? -1 : 1); s.message('해답 방향으로 한 번 회전했어요. 힌트 사용은 연습 기록으로 남아요.'); }
    };
    s.controls([{ label: '반시계 회전 · Q', action: () => rotate(selected,-1), disabled: () => ending || locked(selected) }, { label: '시계 회전 · E', action: () => rotate(selected), disabled: () => ending || locked(selected) }, { label: '되돌리기 · Z', action: undo, disabled: () => ending || !past.available() }, { label: '한 수 힌트 · H', action: help, disabled: () => ending }]);
    s.bindKeys(['KeyQ','KeyE','KeyZ','KeyH'], (code) => code === 'KeyQ' ? rotate(selected,-1) : code === 'KeyE' ? rotate(selected) : code === 'KeyZ' ? undo() : help());
    s.on(element, 'contextmenu', (event) => { event.preventDefault(); const cell = event.target.closest('.cell'); if (cell && s.active()) rotate(Number(cell.dataset.index),-1); });
    s.on(element, 'focusin', (event) => { const cell = event.target.closest('.cell'); if (cell) { selected = Number(cell.dataset.index); if (!ending) render(); } });
    s.on(s.root, 'keydown', (event) => { if (event.target !== s.root || !event.code.startsWith('Arrow') || event.ctrlKey || event.metaKey || event.altKey) return; event.preventDefault(); const dx = { ArrowLeft:-1, ArrowRight:1, ArrowUp:-size, ArrowDown:size }[event.code], next = selected + dx; if (next >= 0 && next < cells.length && (Math.abs(dx) !== 1 || Math.floor(next / size) === Math.floor(selected / size))) { selected = next; grid.focus(next); cells[next].focus({ preventScroll:true }); if (!ending) render(); } });
    s.setRecord(`stage-${index}`, `${index + 1} / ${pipePuzzles.length} · ${puzzle.name}`); render(); s.message('클릭은 시계 방향, 우클릭은 반시계 방향 회전이에요. ◆는 고정. 전부 연결하고 열린 끝을 없애세요.');
};
