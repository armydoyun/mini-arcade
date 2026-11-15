import { random, history } from '../core.js';
import { slide2048 } from '../rules.js';

export default (s) => {
    let board = Array(16).fill(0), score = 0, moves = 0, announced = false, spawned = -1, merged = [];
    const { cells } = s.grid(4, 4, () => {}, 'tile-2048'); cells.forEach((cell) => { cell.disabled = true; });
    const spawn = () => {
        const free = board.map((value, i) => value ? -1 : i).filter((i) => i >= 0);
        if (free.length) { spawned = free[random(0, free.length - 1)]; board[spawned] = Math.random() < .9 ? 2 : 4; }
    };
    const render = () => {
                cells.forEach((cell, i) => {
            cell.textContent = board[i] || ''; cell.dataset.value = board[i];
            cell.className = `cell ${board[i] >= 128 ? 'high' : ''} ${i === spawned ? 'new-tile' : ''} ${merged.includes(i) ? 'merged-tile' : ''}`;
            cell.setAttribute('aria-label', `${Math.floor(i / 4) + 1}행 ${i % 4 + 1}열, ${board[i] || '빈칸'}`);
        });
        merged = []; s.hud([['SCORE', score], ['최대 타일', Math.max(...board)], ['이동', moves]]);
    };
    const past = history(() => ({ board, score, moves, announced }), (state) => { ({ board, score, moves, announced } = state); spawned = -1; merged = []; render(); });
    const undo = () => { if (past.undo()) { s.assist(); s.message('새 타일과 점수도 함께 되돌렸어요. 이번 판은 연습 기록이에요.'); } };
    const move = (code) => {
        if (code === 'KeyZ') { undo(); return; }
        const result = slide2048(board, code); if (!result.changed) return;
        if (!moves) s.startClock(); s.changed(); past.save(); board = result.board; score += result.score; moves++; merged = result.merged; spawn(); render();
        if (result.score) { s.sound(280 + Math.min(result.score * 2, 700), .055); s.message(`+${result.score}점 · 빈칸 ${board.filter((value) => !value).length}개. 큰 타일을 한쪽에 모아 보세요.`); }
        if (!announced && board.some((value) => value >= 2048)) { announced = true; s.message('2048 완성! 이제 4096과 그 너머에 도전해요.'); s.sound(880, .18); }
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].every((direction) => !slide2048(board, direction).changed)) {
            s.finish({ score, title: '멋진 숫자를 만들었어요!', text: `${score.toLocaleString()}점 · 최대 ${Math.max(...board)} · ${moves}번 이동`, win: false });
        }
    };
    s.controls([{ label: '되돌리기 · Z', action: undo, disabled: () => !past.available() }]);
    s.bindKeys(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyZ'], move); spawn(); spawn(); render();
    s.message('방향키로 합치세요. 움직이지 않은 턴에는 새 타일이 생기지 않아요.');
};
