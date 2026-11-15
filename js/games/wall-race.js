import { node, history, clamp, reducedMotion } from '../core.js';
import { raceMoves, raceWallError, raceBlocked, gridNeighbors } from '../rules.js';

export default (s) => {
    const size = 9;
    let walls = [], players = [76, 4], stock = [10, 10], turn = 1, turns = 0, mode = 'move', cursor = 76, candidate = null, busyUntil = 0, ending = false, winner = 0;
    const goal = node('div', 'race-goals'); goal.append(node('span', '', 'P1 ↑ 위쪽으로'), node('span', '', 'P2 ↓ 아래쪽으로')); s.root.append(goal);
    const wallStyle = (bar, wall) => {
        bar.className = `race-wall ${wall.dir === 'h' ? 'horizontal' : 'vertical'} p${wall.owner || turn}`;
        bar.style.left = wall.dir === 'h' ? `calc(${wall.x / size * 100}% + 3px)` : `calc(${(wall.x + 1) / size * 100}% - 3px)`;
        bar.style.top = wall.dir === 'h' ? `calc(${(wall.y + 1) / size * 100}% - 3px)` : `calc(${wall.y / size * 100}% + 3px)`;
        bar.style.width = wall.dir === 'h' ? `calc(${200 / size}% - 6px)` : '6px'; bar.style.height = wall.dir === 'h' ? '6px' : `calc(${200 / size}% - 6px)`;
    };
    const drawWalls = () => {
        wallLayer.replaceChildren(...walls.map((wall, i) => { const bar = node('span'); wallStyle(bar, wall); if (i === walls.length - 1) bar.classList.add('new-wall'); return bar; }));
    };
    const preview = () => {
        previewBar.hidden = mode === 'move' || !candidate || ending;
        if (previewBar.hidden) return;
        const error = !stock[turn - 1] ? '이번 플레이어의 장벽을 모두 사용했어요.' : raceWallError(walls, candidate, players, size);
        wallStyle(previewBar, { ...candidate, x: clamp(candidate.x, 0, 7), y: clamp(candidate.y, 0, 7) }); previewBar.classList.add('wall-preview'); previewBar.classList.toggle('invalid', !!error);
        s.message(error || `${candidate.y + 1}행 ${candidate.x + 1}열 기준 ${mode === 'h' ? '가로' : '세로'} 장벽 · 클릭 / Enter로 배치.`);
    };
    const render = () => {
        const legal = ending ? [] : raceMoves(walls, players[turn - 1], players[2 - turn], size);
        cells.forEach((cell, i) => {
            const owner = players.indexOf(i) + 1; cell.className = `cell ${legal.includes(i) && mode === 'move' ? 'race-legal' : ''} ${winner && i === players[winner - 1] ? 'win' : ''}`;
            const adjacent = gridNeighbors(i, size, cells.length), blocked = [[-size, '위'], [size, '아래'], [-1, '왼쪽'], [1, '오른쪽']].filter(([d]) => adjacent.includes(i + d) && raceBlocked(walls, i, i + d, size)).map(([, label]) => label);
            cell.setAttribute('aria-label', `${Math.floor(i / size) + 1}행 ${i % size + 1}열 ${owner ? `P${owner}` : legal.includes(i) ? '이동 가능' : '빈칸'}${blocked.length ? `, 막힌 길 ${blocked.join('·')}` : ''}${i < size ? ', P1 도착선' : i >= size * (size - 1) ? ', P2 도착선' : ''}`);
        });
        pawns.forEach((pawn, i) => { pawn.style.transform = `translate(${players[i] % size * 100}%, ${Math.floor(players[i] / size) * 100}%)`; pawn.classList.toggle('current-player', !ending && i + 1 === turn); });
        s.hud([['PLAYER 1 ↑', `장벽 ${stock[0]}`, `p1 ${!ending && turn === 1 ? 'active' : ''}`], ['현재 차례', ending ? '대결 종료' : `P${turn}`], ['PLAYER 2 ↓', `장벽 ${stock[1]}`, `p2 ${!ending && turn === 2 ? 'active' : ''}`], ['수', turns]]);
        modeButtons.forEach((button, i) => { const active = ['move', 'h', 'v'][i] === mode; button.classList.toggle('selected', active); button.setAttribute('aria-pressed', active); }); preview();
    };
    const setMode = (next) => {
        if (ending) return; mode = next;
        if (mode === 'move') { candidate = null; cursor = players[turn - 1]; grid.focus(cursor); s.message(`P${turn} 차례 · 밝은 칸으로 이동하거나 H / V로 장벽을 선택하세요.`); }
        else { cursor = Math.min(Math.floor(cursor / size), 7) * size + Math.min(cursor % size, 7); candidate = { x: cursor % size, y: Math.floor(cursor / size), dir: mode }; grid.focus(cursor); }
        render();
    };
    const past = history(() => ({ walls, players, stock, turn, turns }), (saved) => {
        ({ walls, players, stock, turn, turns } = saved); cursor = players[turn - 1]; busyUntil = s.time + .12; drawWalls(); setMode('move'); s.message(`직전 수를 되돌렸어요. P${turn} 차례예요.`);
    }, 256);
    const completeTurn = () => {
        turns++; busyUntil = s.time + (reducedMotion() ? 0 : .14); s.changed();
        if (Math.floor(players[turn - 1] / size) === (turn === 1 ? 0 : size - 1)) {
            ending = true; winner = turn; candidate = null; mode = 'move'; render(); const seconds = s.elapsed();
            s.later(reducedMotion() ? 0 : .18, () => s.finish({ winner, seconds, title: `P${winner} 승리!`, text: `${turns}수 만에 반대편에 도착했어요. 남은 장벽 P1 ${stock[0]}개 · P2 ${stock[1]}개.` }));
        } else { turn = 3 - turn; setMode('move'); s.focus(); }
    };
    const move = (i) => {
        if (!s.active() || ending || s.time < busyUntil) return;
        if (!raceMoves(walls, players[turn - 1], players[2 - turn], size).includes(i)) { s.message('밝게 표시한 칸으로 이동하세요. 상대와 마주 보면 뛰어넘을 수 있어요.'); return; }
        past.save(); players[turn - 1] = i; s.sound(340 + turn * 100, .055); completeTurn();
    };
    const placeWall = (wall) => {
        if (!s.active() || ending || s.time < busyUntil) return;
        const error = !stock[turn - 1] ? '이번 플레이어의 장벽을 모두 사용했어요.' : raceWallError(walls, wall, players, size);
        if (error) { s.message(error); previewBar.classList.add('wall-denied'); s.later(.22, () => previewBar.classList.remove('wall-denied')); return; }
        past.save(); walls = [...walls, { ...wall, owner: turn }]; stock[turn - 1]--; drawWalls(); s.sound(220, .06); completeTurn();
    };
    const grid = s.grid(size, size, (i, event) => {
        cursor = i;
        if (mode === 'move') move(i);
        else if (!event.detail) placeWall({ x: i % size, y: Math.floor(i / size), dir: mode });
    }, 'race-board', false), { element, cells } = grid;
    const wallLayer = node('div', 'race-walls'), previewBar = node('span'), pawns = [node('span', 'race-pawn p1', '1'), node('span', 'race-pawn p2', '2')];
    for (const item of [wallLayer, previewBar, ...pawns]) { item.setAttribute('aria-hidden', 'true'); element.append(item); } previewBar.hidden = true;
    const atPointer = (event) => { const r = element.getBoundingClientRect(), bx = element.clientLeft || 0, by = element.clientTop || 0; return { x: clamp(Math.round((event.clientX - r.left - bx) / (r.width - bx * 2) * size + 1e-7) - 1, 0, 7), y: clamp(Math.round((event.clientY - r.top - by) / (r.height - by * 2) * size + 1e-7) - 1, 0, 7), dir: mode }; };
    s.on(element, 'pointermove', (event) => {
        if (!s.active() || mode === 'move' || ending) return; const wall = atPointer(event);
        if (wall.x !== candidate?.x || wall.y !== candidate?.y || wall.dir !== candidate?.dir) { candidate = wall; preview(); }
    });
    s.on(element, 'click', (event) => { if (mode !== 'move' && event.detail) placeWall(atPointer(event)); });
    s.on(element, 'focusin', (event) => { const cell = event.target.closest('.cell'); if (!cell || !s.active()) return; cursor = Number(cell.dataset.index); if (mode !== 'move') { candidate = { x: cursor % size, y: Math.floor(cursor / size), dir: mode }; preview(); } });
    const undo = () => { if (!ending) past.undo(); };
    const tools = s.controls([{ label: '말 이동 · M', action: () => setMode('move'), disabled: () => ending }, { label: '가로 장벽 · H', action: () => setMode('h'), disabled: () => ending }, { label: '세로 장벽 · V', action: () => setMode('v'), disabled: () => ending }, { label: '한 수 되돌리기 · Z', action: undo, disabled: () => ending || !past.available() }]), modeButtons = [...tools.children].slice(0, 3);
    const navigate = (code) => {
        const max = mode === 'move' ? 8 : 7, x = cursor % size, y = Math.floor(cursor / size), dx = code === 'ArrowLeft' ? -1 : code === 'ArrowRight' ? 1 : 0, dy = code === 'ArrowUp' ? -1 : code === 'ArrowDown' ? 1 : 0;
        cursor = clamp(y + dy, 0, max) * size + clamp(x + dx, 0, max); grid.focus(cursor); cells[cursor].focus({ preventScroll: true });
        if (mode !== 'move') { candidate = { x: cursor % size, y: Math.floor(cursor / size), dir: mode }; preview(); }
    };
    s.bindKeys(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Space', 'KeyM', 'KeyH', 'KeyV', 'KeyZ'], (code) => {
        if (code.startsWith('Arrow')) navigate(code);
        else if (code === 'KeyZ') undo();
        else if (['KeyM', 'KeyH', 'KeyV'].includes(code)) setMode(code === 'KeyM' ? 'move' : code === 'KeyH' ? 'h' : 'v');
        else if (mode === 'move') move(cursor); else placeWall(candidate || { x: cursor % size, y: Math.floor(cursor / size), dir: mode });
    });
    s.on(element, 'keydown', (event) => { if (s.over && event.code.startsWith('Arrow')) { event.preventDefault(); event.stopPropagation(); navigate(event.code); } });
    grid.focus(cursor); render(); s.message('먼저 반대편에 도착하세요. 말 이동 또는 장벽 하나를 선택해 번갈아 둬요. H 가로 · V 세로 · M 이동.');
};
