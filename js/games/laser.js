import { node, history, reducedMotion } from '../core.js';
import { parseLaser, laserTrace } from '../rules.js';
import { laserPuzzles } from '../puzzles.js';

export default (s) => {
    s.pauseOnStall = false;
    const index = Math.max(0, Math.min(laserPuzzles.length - 1, Number(s.options.mode?.split('-')[1]) || 0)), puzzle = laserPuzzles[index], level = parseLaser(puzzle.map, puzzle.direction);
    let mask = puzzle.initial, moves = 0, selected = level.mirrors[0], ending = false;
    const render = () => {
        const trace = laserTrace(level, mask);
        cells.forEach((cell, i) => {
            const tile = level.tiles[i], mirror = level.mirrors.indexOf(i), lit = trace.lit.has(i);
            cell.className = `cell logic-cell laser-tile ${tile === '#' ? 'laser-wall' : ''} ${mirror >= 0 ? 'laser-mirror' : ''} ${tile === 'S' ? 'laser-source' : ''} ${tile === 'T' ? `laser-target ${lit ? 'target-lit' : ''}` : ''} ${tile === '+' ? 'laser-splitter' : ''} ${selected === i ? 'puzzle-selected' : ''}`;
            const shape = tile === 'S' ? `<path d="M12 19V5m-4 4 4-4 4 4" transform="rotate(${level.direction * 90} 12 12)"/>` : tile === 'T' ? '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2" fill="currentColor"/>' : tile === '+' ? '<circle cx="12" cy="12" r="8"/><path d="M12 5v14M5 12h14"/>' : '';
            if (mirror >= 0) glasses[mirror].style.transform = `rotate(${mask & (1 << mirror) ? 45 : -45}deg)`;
            else if (!cell.innerHTML) cell.innerHTML = shape ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">${shape}</svg>` : '';
            cell.setAttribute('aria-label', `${Math.floor(i / level.columns) + 1}행 ${i % level.columns + 1}열 ${mirror >= 0 ? `회전 거울 ${mask & (1 << mirror) ? '역슬래시' : '슬래시'}` : tile === 'S' ? '빛 출발점' : tile === 'T' ? `목표 ${lit ? '점등' : '꺼짐'}` : tile === '+' ? '고정 분광기 · 직진과 좌우로 나눔' : tile === '#' ? '벽' : '빈칸'}`);
            cell.setAttribute('aria-disabled', mirror < 0 || ending);
        });
        beams.innerHTML = `<svg viewBox="0 0 ${level.columns} ${level.rows}" aria-hidden="true"><path d="${trace.segments.map((part) => `M${part.from.join(' ')}L${part.to.join(' ')}`).join('')}"/></svg>`;
        grid.focus(selected); s.hud([['점등 목표', `${trace.lit.size} / ${level.targets.length}`], ['거울 회전', moves], ['시작 최소 회전', `${puzzle.par}회`]]);
        return trace;
    };
    const past = history(() => ({ mask, moves, selected }), (state) => { ({ mask, moves, selected } = state); s.releaseKeys(); render(); s.message('거울 방향과 회전 수를 되돌렸어요.'); }, Infinity);
    const rotate = (i) => {
        selected = i; const mirror = level.mirrors.indexOf(i);
        if (!s.active() || ending) return;
        if (mirror < 0) { render(); s.message('거울을 클릭해 방향을 바꾸세요. 분광기는 빛을 직진·좌우 세 방향으로 나눠요.'); return; }
        if (!moves) s.startClock(); past.save(); mask ^= 1 << mirror; moves++; s.changed(); const trace = render(); s.sound(390 + trace.lit.size * 70, .04);
        if (trace.win) {
            ending = true; s.syncTools(); s.message('모든 목표에 빛이 도착했어요!');
            s.later(reducedMotion() ? 0 : .22, () => s.finish({ score: moves, recordText: `${moves}회 회전 · 최소 ${puzzle.par}회`, title: '빛의 길을 찾았어요!', text: `${puzzle.name} · ${moves}회 회전 · 시작 최소 ${puzzle.par}회` }));
        } else s.message(trace.repeated ? '빛이 겹치거나 순환하는 구간이 있어요. 도달하지 못한 목표의 경로를 살펴보세요.' : '거울 클릭 / Space로 방향 전환 · 모든 ◎ 목표를 점등하세요.');
    };
    const grid = s.grid(level.columns, level.rows, rotate, 'laser-board'), { element, cells } = grid, beams = node('div', 'laser-beams'); element.append(beams);
    const glasses = level.mirrors.map((i) => { const glass = node('span','laser-glass'); glass.setAttribute('aria-hidden','true'); cells[i].append(glass); return glass; });
    const undo = () => { if (!ending) past.undo(); }, help = () => {
        if (ending) return; const mirror = level.mirrors.findIndex((_, i) => (mask ^ puzzle.solution) & (1 << i));
        if (mirror >= 0) { s.assist(); rotate(level.mirrors[mirror]); s.message('인증된 해답 경로로 거울 하나를 돌렸어요. 이번 판은 연습 기록이에요.'); }
    };
    s.controls([{ label: '선택 거울 회전 · Space', action: () => rotate(selected), disabled: () => ending || !level.mirrors.includes(selected) }, { label: '되돌리기 · Z', action: undo, disabled: () => ending || !past.available() }, { label: '한 수 힌트 · H', action: help, disabled: () => ending }]);
    s.bindKeys(['Space', 'KeyZ', 'KeyH'], (code) => code === 'Space' ? rotate(selected) : code === 'KeyZ' ? undo() : help());
    s.on(element, 'focusin', (event) => { const cell = event.target.closest('.cell'); if (cell) { selected = Number(cell.dataset.index); if (!ending) render(); } });
    s.on(s.root, 'keydown', (event) => { if (event.target !== s.root || !event.code.startsWith('Arrow') || event.ctrlKey || event.metaKey || event.altKey) return; event.preventDefault(); const dx = { ArrowLeft:-1, ArrowRight:1, ArrowUp:-level.columns, ArrowDown:level.columns }[event.code], next = selected + dx; if (next >= 0 && next < cells.length && (Math.abs(dx) !== 1 || Math.floor(next / level.columns) === Math.floor(selected / level.columns))) { selected = next; grid.focus(next); cells[next].focus({ preventScroll:true }); if (!ending) render(); } });
    s.setRecord(`stage-${index}`, `${index + 1} / ${laserPuzzles.length} · ${puzzle.name}`); render(); s.message('거울을 돌려 모든 ◎ 목표에 빛을 연결하세요. + 분광기는 직진·좌우로 나눠요. 되돌리기는 자유롭게 사용해요.');
};
