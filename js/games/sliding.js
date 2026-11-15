import { random, history, seededRandom } from '../core.js';

export default (s) => {
    const seed = s.options.seed ?? random(1, 0xffffffff), rng = seededRandom(seed);
    const size = s.options.mode === 'easy' ? 3 : 4, length = size * size; let board = Array.from({ length }, (_, i) => (i + 1) % length), empty = length - 1, previous = -1, moves = 0;
    const neighbors = (i) => [i % size ? i - 1 : -1, i % size < size - 1 ? i + 1 : -1, i - size, i + size].filter((at) => at >= 0 && at < length);
    for (let n = 0; n < (size === 3 ? 55 : 150); n++) { const options = neighbors(empty).filter((at) => at !== previous), next = options[Math.floor(rng() * options.length)]; [board[empty], board[next]] = [board[next], board[empty]]; previous = empty; empty = next; }
    if (board.every((value, i) => value === (i + 1) % length)) { const next = neighbors(empty)[0]; [board[empty], board[next]] = [board[next], board[empty]]; empty = next; }
    const distance = () => board.reduce((sum, value, i) => value ? sum + Math.abs(i % size - (value - 1) % size) + Math.abs(Math.floor(i / size) - Math.floor((value - 1) / size)) : sum, 0);
    const render = () => { const legal = neighbors(empty); cells.forEach((cell, i) => { cell.textContent = board[i] || ''; cell.className = `cell ${!board[i] ? 'blank' : ''} ${board[i] === i + 1 ? 'correct' : ''} ${legal.includes(i) ? 'movable' : ''}`; cell.setAttribute('aria-label', board[i] ? `${Math.floor(i / size) + 1}행 ${i % size + 1}열, ${board[i]}번 타일${legal.includes(i) ? ', 이동 가능' : ''}` : '빈칸'); }); s.hud([['이동', moves], ['필요 이동 하한', `${distance()}회 이상`], ['정렬', `${board.filter((v, i) => v && v === i + 1).length} / ${length - 1}`]]); };
    const past = history(() => ({ board, empty, moves }), (state) => { ({ board, empty, moves } = state); render(); });
    const undo = () => { if (past.undo()) { s.assist(); s.message('직전 이동을 되돌렸어요. 이번 판은 연습으로 기록해요.'); } };
    const move = (i) => { if (!neighbors(empty).includes(i)) return; if (!moves) s.startClock(); s.changed(); past.save(); [board[empty], board[i]] = [board[i], board[empty]]; empty = i; moves++; render(); s.sound(430, .04); if (!distance()) s.finish({ score: moves, recordText: `${moves}회 이동`, title: '모든 타일이 제자리로!', text: `${moves}번 이동 · ${Math.floor(s.elapsed() + 1e-7)}초` }); };
    const { cells } = s.grid(size, size, move, 'sliding', false);
    const direction = (code) => { if (code === 'KeyZ') { undo(); return; } const next = code === 'ArrowLeft' ? (empty % size ? empty - 1 : -1) : code === 'ArrowRight' ? (empty % size < size - 1 ? empty + 1 : -1) : code === 'ArrowUp' ? empty - size : empty + size; move(next); };
    s.setRecord(`${s.options.mode || 'classic'}:${seed.toString(36)}`, `${size}×${size} · 문제 ${seed.toString(36).toUpperCase()}`);
    s.controls([{ label: '되돌리기 · Z', action: undo, disabled: () => !past.available() }]); s.bindKeys(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyZ'], direction); render(); s.message('밝게 표시된 타일을 빈칸으로 옮기세요. 숫자 아래 점은 올바른 위치를 뜻해요.');
};
