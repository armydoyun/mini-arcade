import { node, history, reducedMotion } from '../core.js';
import { parseDuo, duoDoors, duoStep, gridNeighbors } from '../rules.js';
import { duoLevels } from '../puzzles.js';

export default (s) => {
    const index = Math.max(0, Math.min(duoLevels.length - 1, Number(s.options.mode?.split('-')[1]) || 0)), puzzle = duoLevels[index], level = parseDuo(puzzle.map), names = { '#': '벽', '1': '1번 발판', '2': '2번 발판', a: '1번 스위치', b: '2번 스위치', I: '1번 문', J: '2번 문', r: 'P1 전용 바닥', u: 'P2 전용 바닥', X: 'P1 출구', Y: 'P2 출구' };
    let state = { players: [...level.players], bits: 0, moves: 0 }, selected = 0, queued = [null, null], repeat = [0, 0], busyUntil = 0, ending = false;
    const codes = [['KeyW', 'KeyS', 'KeyA', 'KeyD'], ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']], delta = [-level.columns, level.columns, -1, 1];
    const render = () => {
        const open = duoDoors(level, state);
        cells.forEach((cell, i) => {
            const tile = level.tiles[i], door = 'IJ'.indexOf(tile), plate = '12'.indexOf(tile), toggle = 'ab'.indexOf(tile), active = plate >= 0 ? state.players.includes(i) : toggle >= 0 ? !!(state.bits & (1 << toggle)) : false;
            cell.className = `cell duo-tile ${tile === '#' ? 'duo-wall' : 'duo-floor'} ${tile === 'r' || tile === 'X' ? 'duo-p1' : tile === 'u' || tile === 'Y' ? 'duo-p2' : ''} ${door >= 0 ? `duo-door ${open[door] ? 'door-open' : ''}` : ''} ${plate >= 0 ? 'duo-plate' : ''} ${toggle >= 0 ? 'duo-switch' : ''} ${active ? 'circuit-active' : ''} ${'XY'.includes(tile) ? 'duo-exit' : ''}`;
            cell.textContent = door >= 0 ? `${door + 1}` : plate >= 0 ? `${plate + 1}` : toggle >= 0 ? `${toggle + 1}↺` : tile === 'X' ? '1' : tile === 'Y' ? '2' : tile === 'r' ? '1·' : tile === 'u' ? '2·' : '';
            cell.disabled = tile === '#'; cell.setAttribute('aria-label', `${Math.floor(i / level.columns) + 1}행 ${i % level.columns + 1}열 ${names[tile] || '바닥'}${door >= 0 ? open[door] ? ' 열림' : ' 닫힘' : ''}${active ? ' 작동 중' : ''}${state.players.includes(i) ? ` P${state.players.indexOf(i) + 1}` : ''}`);
        });
        players.forEach((sprite, p) => { sprite.style.transform = `translate(${state.players[p] % level.columns * 100}%, ${Math.floor(state.players[p] / level.columns) * 100}%)`; sprite.classList.toggle('at-exit', state.players[p] === level.exits[p]); });
        grid.focus(state.players[selected]); bar.children[0].setAttribute('aria-pressed', selected === 0); bar.children[1].setAttribute('aria-pressed', selected === 1);
        const channels = [0, 1].filter((i) => level.tiles.includes('IJ'[i]));
        s.hud([['P1 · WASD', state.players[0] === level.exits[0] ? '출구 도착 ✓' : '출구 1로!', 'p1'], ['개별 걸음 합', state.moves], ['P2 · 방향키', state.players[1] === level.exits[1] ? '출구 도착 ✓' : '출구 2로!', 'p2'], ['마우스 선택', `P${selected + 1} · ${channels.length ? `문 ${channels.map((i) => `${i + 1}${open[i] ? '○' : '●'}`).join(' ')}` : '문 없음'}`]]);
    };
    const past = history(() => state, (saved) => { state = saved; queued = [null, null]; s.releaseKeys(); busyUntil = s.time + .11; render(); s.message('두 플레이어와 회로, 걸음 수를 함께 되돌렸어요.'); }, Infinity);
    const step = (intents) => {
        if (ending || !s.active()) return;
        const next = duoStep(level, state, intents); if (!next) { s.message('벽·닫힌 문·친구의 위치를 확인하세요. 같은 칸으로 동시에 갈 수는 없어요.'); return; }
        if (!state.moves) s.startClock(); past.save(); state = next; s.changed(); busyUntil = s.time + .11; render(); s.sound(280, .03);
        if (state.players.every((at, p) => at === level.exits[p])) { ending = true; s.releaseKeys(); s.syncTools(); s.later(reducedMotion() ? 0 : .24, () => s.finish({ score: state.moves, recordText: `${state.moves}걸음 · 협동 완료`, title: '둘이 함께 도착했어요!', text: `${puzzle.name} · 두 플레이어 합계 ${state.moves}걸음`, nextLabel: '다음 미완료 협동 스테이지 →' })); }
        else s.message('발판은 밟고 있는 동안, ↺ 스위치는 들어설 때마다 회로를 바꿔요. 색 바닥은 해당 플레이어만 지나가요.');
    };
    const select = (p) => { selected = p; render(); }, undo = () => { if (!ending) past.undo(); };
    const grid = s.grid(level.columns, level.rows, (i) => { if (!ending && s.time >= busyUntil) { const intents = [null, null]; intents[selected] = i; step(intents); } }, 'duo-board', false), { element, cells } = grid;
    element.style.setProperty('--rows', level.rows); element.style.setProperty('--sprite-columns', level.columns);
    const players = [0, 1].map((p) => { const sprite = node('span', `duo-player duo-player-${p + 1}`, String(p + 1)); sprite.setAttribute('aria-hidden', 'true'); element.append(sprite); return sprite; });
    const bar = s.controls([{ label: 'P1 선택 · 1', action: () => select(0), disabled: () => ending }, { label: 'P2 선택 · 2', action: () => select(1), disabled: () => ending }, { label: '함께 되돌리기 · Z', action: undo, disabled: () => ending || !past.available() }]);
    s.bindKeys([...codes.flat(), 'Digit1', 'Digit2', 'KeyZ'], (code) => {
        if (code === 'KeyZ') { undo(); return; } if (code === 'Digit1' || code === 'Digit2') { select(code === 'Digit1' ? 0 : 1); return; }
        const p = codes[0].includes(code) ? 0 : 1; queued[p] = code; repeat[p] = s.time + .22;
    });
    s.on(s.root, 'gamepause', () => { queued = [null, null]; });
    s.on(element, 'keydown', (event) => {
        if (!s.over || !codes[1].includes(event.code)) return;
        const cell = event.target.closest('.cell'); if (!cell) return;
        const at = Number(cell.dataset.index), to = at + delta[codes[1].indexOf(event.code)];
        if (gridNeighbors(at, level.columns, level.tiles.length).includes(to) && level.tiles[to] !== '#') { event.preventDefault(); event.stopPropagation(); grid.focus(to); cells[to].focus({ preventScroll: true }); }
    });
    s.run(() => {
        if (ending || s.time < busyUntil) return;
        const intents = state.players.map((at, p) => { const code = queued[p] || (s.time >= repeat[p] ? codes[p].find((key) => s.down(key)) : null); if (!code) return null; queued[p] = null; repeat[p] = s.time + .11; return at + delta[codes[p].indexOf(code)]; });
        if (intents.some((i) => i !== null)) step(intents);
    });
    s.setRecord(`stage-${index}`, `${index + 1} / ${duoLevels.length} · ${puzzle.name}`); render(); s.message('각자 같은 번호의 출구에 함께 서면 성공! 발판과 문, 스위치를 둘이 나눠 맡으세요.');
    s.ready('Switch Duo · 협동 퍼즐', `P1은 WASD, P2는 방향키로 이동해요. 서로 다른 출구에 동시에 도착하세요. ${puzzle.name} · 마우스는 1 / 2로 조작할 플레이어를 선택해요.`, () => {});
};
