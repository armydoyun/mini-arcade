import { random, history, seededRandom } from '../core.js';
import { lightsSolution } from '../rules.js';

export default (s) => {
    const rng = seededRandom(s.options.seed ?? random(1, 0xffffffff));
    const size = s.options.mode === 'easy' ? 3 : 5; let board = Array(size * size).fill(false), moves = 0, hint = -1;
    const flip = (i) => { const x = i % size, y = Math.floor(i / size); for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) if (x + dx >= 0 && x + dx < size && y + dy >= 0 && y + dy < size) { const at = (y + dy) * size + x + dx; board[at] = !board[at]; } };
    let initial;
    do { board.fill(false); for (let i = 0; i < size * 3; i++) flip(Math.floor(rng() * board.length)); initial = lightsSolution(board, size); } while (!initial?.length);
    const render = () => { cells.forEach((cell, i) => { cell.className = `cell ${board[i] ? 'lit' : ''} ${i === hint ? 'hint' : ''}`; cell.textContent = board[i] ? '●' : '·'; cell.setAttribute('aria-label', `${Math.floor(i / size) + 1}행 ${i % size + 1}열 ${board[i] ? '켜짐' : '꺼짐'}`); cell.setAttribute('aria-pressed', board[i]); }); s.hud([['이동', moves], ['남은 불', board.filter(Boolean).length], ['처음 최소 해답', `${initial.length}회`]]); };
    const past = history(() => ({ board, moves }), (state) => { ({ board, moves } = state); hint = -1; render(); });
    const undo = () => { if (past.undo()) s.assist(); }, help = () => { const solution = lightsSolution(board, size); if (solution?.length) { hint = solution[0]; s.assist(); render(); s.message(`다음 해답 중 한 칸: ${Math.floor(hint / size) + 1}행 ${hint % size + 1}열. 이 칸을 직접 눌러 보세요.`); } };
    const { cells } = s.grid(size, size, (i) => { if (!moves) s.startClock(); s.changed(); past.save(); hint = -1; flip(i); moves++; render(); s.sound(420 + board.filter(Boolean).length * 12, .04); if (!board.some(Boolean)) s.finish({ score: moves - initial.length, recordText: `최적 +${moves - initial.length}회 · 총 ${moves}회`, title: '모든 불이 꺼졌어요!', text: `${moves}번 만에 완성 · 시작 판의 최소 해답은 ${initial.length}번이에요.` }); }, 'lights');
    s.controls([{ label: '되돌리기 · Z', action: undo, disabled: () => !past.available() }, { label: '한 칸 힌트 · H', action: help }]); s.bindKeys(['KeyZ', 'KeyH'], (code) => code === 'KeyZ' ? undo() : help()); render(); s.message('●와 ·로 상태를 구분해요. 되돌리기·힌트 사용 시 연습 기록으로 남아요.');
};
