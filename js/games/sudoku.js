import { history, formatTime, reducedMotion } from '../core.js';
import { sudokuSolve, sudokuPeer, sudokuConflicts } from '../rules.js';
import { sudokuPuzzles } from '../puzzles.js';

export default (s) => {
    s.pauseOnStall = false;
    const index = Math.max(0, Math.min(sudokuPuzzles.length - 1, Number(s.options.mode?.split('-')[1]) || 0)), puzzle = sudokuPuzzles[index], givens = [...puzzle.givens].map(Number), solution = sudokuSolve(givens,1)[0];
    let values = [...givens], notes = Array(81).fill(0), selected = givens.findIndex((n) => !n), pencil = false, entries = 0, started = false, ending = false, endSeconds = null;
    const hud = () => s.hud([['채운 칸', `${values.filter(Boolean).length} / 81`], ['풀이 시간', formatTime(endSeconds ?? (started ? s.elapsed() : 0))], ['숫자 입력 / 충돌 칸', `${entries} / ${sudokuConflicts(values).size}`]]);
    const render = () => {
        const conflicts = sudokuConflicts(values);
        cells.forEach((cell, i) => {
            cell.className = `cell logic-cell sudoku-cell ${givens[i] ? 'sudoku-given' : ''} ${selected === i ? 'puzzle-selected' : sudokuPeer(i,selected) ? 'sudoku-related' : ''} ${values[i] && values[i] === values[selected] ? 'sudoku-same' : ''} ${conflicts.has(i) ? 'sudoku-conflict' : ''} ${i % 9 === 2 || i % 9 === 5 ? 'box-right' : ''} ${Math.floor(i / 9) === 2 || Math.floor(i / 9) === 5 ? 'box-bottom' : ''}`;
            cell.innerHTML = values[i] ? `<span>${values[i]}</span>` : notes[i] ? `<span class="sudoku-notes">${Array.from({ length:9 },(_,d) => `<i>${notes[i] & (1 << (d + 1)) ? d + 1 : ''}</i>`).join('')}</span>` : '';
            cell.setAttribute('aria-label', `${Math.floor(i / 9) + 1}행 ${i % 9 + 1}열 ${givens[i] ? '고정 숫자 ' : ''}${values[i] || `빈칸${notes[i] ? ` · 메모 ${Array.from({ length:9 },(_,d) => notes[i] & (1 << (d + 1)) ? d + 1 : '').filter(Boolean).join(',')}` : ''}`}${conflicts.has(i) ? ' · 규칙 충돌' : ''}`);
            cell.setAttribute('aria-readonly', !!givens[i]); cell.setAttribute('aria-pressed', selected === i);
        });
        grid.focus(selected); const button = bar.children[9]; button.textContent = `메모 ${pencil ? 'ON' : 'OFF'} · N`; button.title = button.textContent; button.setAttribute('aria-pressed', pencil); hud();
    };
    const past = history(() => ({ values, notes, entries }), (saved) => { ({ values, notes, entries } = saved); s.releaseKeys(); render(); s.message('숫자와 메모를 함께 되돌렸어요. 풀이 시간은 계속 이어져요.'); }, Infinity);
    const put = (number, hint = false) => {
        if (!s.active() || ending) return;
        if (givens[selected]) { s.message('고정 숫자는 바꿀 수 없어요. 빈칸을 선택하세요.'); return; }
        if (pencil && number && !hint && values[selected]) { s.message('메모를 쓰려면 먼저 숫자를 지우세요.'); return; }
        if (!(pencil && number && !hint) && values[selected] === number && !notes[selected]) return;
        if (!started) { s.startClock(); started = true; } past.save(); s.changed();
        if (pencil && number && !hint) notes[selected] ^= 1 << number;
        else { values[selected] = number; notes[selected] = 0; if (number) { entries++; notes = notes.map((mask,i) => sudokuPeer(i,selected) ? mask & ~(1 << number) : mask); } }
        render(); s.sound(number ? 330 + number * 25 : 240, .025);
        if (values.every(Boolean) && !sudokuConflicts(values).size) {
            ending = true; const seconds = Math.max(1,Math.floor(s.elapsed())); endSeconds = seconds; hud();
            s.later(reducedMotion() ? 0 : .18, () => s.finish({ score: seconds, seconds, recordText: `${formatTime(seconds)} · ${puzzle.name}`, title: '아홉 칸의 균형을 찾았어요!', text: `${puzzle.name} · ${formatTime(seconds)} · 숫자 입력 ${entries}회` }));
        } else s.message(sudokuConflicts(values).size ? '붉은 칸은 행·열·3×3 상자에 같은 숫자가 겹친 곳이에요. 답안 자체를 미리 채점하지는 않아요.' : pencil ? '메모 ON · 숫자를 다시 누르면 해당 메모가 사라져요. N으로 숫자 모드로 돌아가세요.' : '각 행·열·3×3 상자에 1~9를 한 번씩 넣으세요. 같은 집의 메모는 숫자를 넣으면 자동 정리돼요.');
    };
    const toggle = () => { if (!ending) { pencil = !pencil; render(); s.message(pencil ? '메모 ON · 빈칸에 후보 숫자를 기록하세요.' : '메모 OFF · 숫자를 입력하세요.'); } }, undo = () => { if (!ending) past.undo(); }, help = () => {
        if (ending) return; const at = !givens[selected] && values[selected] !== solution[selected] ? selected : values.findIndex((n,i) => n !== solution[i]);
        if (at >= 0) { selected = at; s.assist(); put(solution[at],true); s.message('해답 숫자 하나를 채웠어요. 이번 판은 연습 기록이에요.'); }
    };
    const grid = s.grid(9,9,(i) => { selected = i; render(); },'sudoku-board'), { element, cells } = grid;
    const bar = s.controls([...Array.from({ length:9 },(_,i) => ({ label: String(i + 1), className:'sudoku-digit', title:`숫자 ${i + 1} 입력 · ${i + 1}`, action:() => put(i + 1), disabled:() => ending || !!givens[selected] })), { label:'메모 OFF · N', action:toggle, disabled:() => ending }, { label:'지우기 · Del', action:() => put(0), disabled:() => ending || !!givens[selected] || (!values[selected] && !notes[selected]) }, { label:'되돌리기 · Z', action:undo, disabled:() => ending || !past.available() }, { label:'한 칸 힌트 · H', action:help, disabled:() => ending }]);
    s.bindKeys([...Array.from({ length:10 },(_,i) => `Digit${i}`),'Numpad0','Backspace','Delete','KeyN','KeyZ','KeyH'], (code) => { if (code.startsWith('Digit')) put(Number(code.slice(-1))); else if (['Numpad0','Backspace','Delete'].includes(code)) put(0); else if (code === 'KeyN') toggle(); else if (code === 'KeyZ') undo(); else help(); });
    s.on(element,'focusin',(event) => { const cell = event.target.closest('.cell'); if (cell) { selected = Number(cell.dataset.index); if (!ending) render(); } });
    s.on(s.root,'keydown',(event) => { if (event.target !== s.root || !event.code.startsWith('Arrow') || event.ctrlKey || event.metaKey || event.altKey) return; event.preventDefault(); const dx = { ArrowLeft:-1, ArrowRight:1, ArrowUp:-9, ArrowDown:9 }[event.code], next = selected + dx; if (next >= 0 && next < 81 && (Math.abs(dx) !== 1 || Math.floor(next / 9) === Math.floor(selected / 9))) { selected = next; grid.focus(next); cells[next].focus({ preventScroll:true }); if (!ending) render(); } });
    const timer = () => { if (!ending) { hud(); s.later(1,timer); } }; s.later(1,timer);
    s.setRecord(`stage-${index}`, `${index + 1} / ${sudokuPuzzles.length} · ${puzzle.name}`); render(); s.message('숫자 1~9 입력 · N 메모 · Del 지우기 · Z 자유롭게 되돌리기 · H 힌트는 연습 기록. 18문제 모두 유일해를 검증했어요.');
};
