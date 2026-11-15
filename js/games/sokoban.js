import { node, history, reducedMotion } from '../core.js';
import { parseSokoban, sokobanStep, sokobanWalk, sokobanCorners, gridNeighbors } from '../rules.js';
import { sokobanLevels } from '../puzzles.js';

export default (s) => {
    const index = Math.max(0, Math.min(sokobanLevels.length - 1, Number(s.options.mode?.split('-')[1]) || 0)), puzzle = sokobanLevels[index], level = parseSokoban(puzzle.map), corners = new Set(sokobanCorners(level));
    let state = { player: level.player, boxes: [...level.boxes], moves: 0, pushes: 0 }, busyUntil = 0, repeatAt = 0, queued = null, lastKey = null, ending = false, walking = [];
    const delta = (code) => ({ ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1, ArrowUp: -level.columns, KeyW: -level.columns, ArrowDown: level.columns, KeyS: level.columns })[code];
    const placeSprite = (sprite, at) => { sprite.style.transform = `translate(${at % level.columns * 100}%, ${Math.floor(at / level.columns) * 100}%)`; };
    const render = () => {
        cells.forEach((cell, i) => {
            const floor = level.floor.has(i), goal = level.goals.has(i), box = state.boxes.includes(i);
            cell.className = `cell ${floor ? 'warehouse-floor' : 'warehouse-wall'} ${goal ? 'warehouse-goal' : ''} ${goal && box ? 'goal-filled' : ''}`; cell.disabled = !floor;
            cell.setAttribute('aria-label', `${Math.floor(i / level.columns) + 1}행 ${i % level.columns + 1}열 ${!floor ? '벽' : `${goal ? '목표 ' : ''}${box ? '상자' : i === state.player ? '플레이어' : '빈 바닥'}`}`);
        });
        state.boxes.forEach((at, i) => { placeSprite(boxes[i], at); boxes[i].classList.toggle('on-goal', level.goals.has(at)); boxes[i].classList.toggle('corner-warning', corners.has(at)); });
        placeSprite(player, state.player); grid.focus(state.player);
        s.hud([['목표', `${state.boxes.filter((at) => level.goals.has(at)).length} / ${state.boxes.length}`], ['밀기', state.pushes], ['이동', state.moves], ['최소 밀기', puzzle.par]]);
    };
    const past = history(() => state, (saved) => { state = saved; queued = null; walking = []; lastKey = null; s.releaseKeys(); busyUntil = s.time + .06; render(); s.message('한 수를 되돌렸어요. 밀기와 이동 기록도 함께 복원해요.'); }, Infinity);
    const step = (next) => {
        if (!s.active() || ending) return false;
        const result = sokobanStep(level, state, next);
        if (!result) { s.message('벽이나 상자 뒤의 공간을 확인하세요. Z로 한 수를 되돌릴 수 있어요.'); return false; }
        if (!state.moves) s.startClock(); past.save(); s.changed(); const pushed = result.pushes !== state.pushes, goalHit = result.boxes.filter((at) => level.goals.has(at)).length > state.boxes.filter((at) => level.goals.has(at)).length; state = result; busyUntil = s.time + .105; render();
        s.sound(goalHit ? 590 : pushed ? 330 : 210, pushed ? .045 : .02);
        if (state.boxes.every((at) => level.goals.has(at))) {
            ending = true; walking = []; s.syncTools(); s.message('모든 상자가 제자리에 도착했어요!');
            s.later(reducedMotion() ? 0 : .22, () => s.finish({ score: state.pushes, tieScore: state.moves, recordText: `${state.pushes}회 밀기 · ${state.moves}회 이동`, title: `${puzzle.name} 완료!`, text: `${state.pushes}회 밀기 · 최소 ${puzzle.par}회 · ${state.moves}회 이동`, nextLabel: '다음 미완료 스테이지 →' }));
        } else s.message(pushed && state.boxes.some((at) => corners.has(at)) ? '목표가 아닌 모서리에 상자가 있어요. Z로 되돌려 다른 방향을 찾아보세요.' : '방향키 / WASD로 이동 · 바닥을 클릭하면 걸어가요 · Z 되돌리기.');
        return true;
    };
    const click = (i) => {
        if (ending) return;
        walking = []; queued = null;
        if (state.boxes.includes(i)) {
            if (s.time >= busyUntil && gridNeighbors(state.player, level.columns, cells.length).includes(i)) step(i);
            else s.message('상자 옆에 서서 밀 방향을 선택하세요. 바닥 클릭으로 먼저 이동할 수 있어요.');
        } else if (level.floor.has(i)) { walking = sokobanWalk(level, state, i); if (!walking.length && i !== state.player) s.message('상자에 막혀 걸어갈 수 없는 위치예요.'); }
    };
    const grid = s.grid(level.columns, level.rows, click, 'sokoban-board', false), { element, cells } = grid;
    element.style.setProperty('--rows', level.rows); element.style.setProperty('--sprite-columns', level.columns);
    const player = node('span', 'warehouse-player'), boxes = level.boxes.map(() => node('span', 'warehouse-box'));
    for (const sprite of [player, ...boxes]) { sprite.setAttribute('aria-hidden', 'true'); element.append(sprite); }
    const undo = () => { if (!ending && past.undo()) s.sound(270, .04); };
    s.controls([{ label: '한 수 되돌리기 · Z', action: undo, disabled: () => ending || !past.available() }]);
    s.bindKeys(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyZ'], (code) => {
        if (code === 'KeyZ') { undo(); return; }
        walking = []; lastKey = code; repeatAt = s.time + .21;
        if (s.time >= busyUntil) step(state.player + delta(code)); else queued = code;
    });
    s.on(element, 'keydown', (event) => {
        if (!s.over || delta(event.code) === undefined) return;
        const cell = event.target.closest('.cell'), next = Number(cell?.dataset.index) + delta(event.code);
        if (cell && gridNeighbors(Number(cell.dataset.index), level.columns, cells.length).includes(next) && level.floor.has(next)) { event.preventDefault(); event.stopPropagation(); grid.focus(next); cells[next].focus({ preventScroll: true }); }
    });
    s.on(s.root, 'gamepause', () => { walking = []; queued = null; lastKey = null; });
    s.run(() => {
        if (ending || s.time < busyUntil) return;
        if (queued) { const code = queued; queued = null; step(state.player + delta(code)); return; }
        if (walking.length) { step(walking.shift()); return; }
        const held = lastKey && s.down(lastKey) ? lastKey : ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].find((code) => s.down(code));
        if (held && s.time >= repeatAt) { step(state.player + delta(held)); repeatAt = s.time + .105; }
    });
    s.setRecord(`stage-${index}`, `${index + 1} / ${sokobanLevels.length} · ${puzzle.name}`); render();
    s.message('상자를 목표 테두리 안으로 밀어 넣으세요. 같은 밀기 수에서는 이동이 적은 기록이 앞서요. 되돌리기는 자유롭게 사용할 수 있어요.');
};
