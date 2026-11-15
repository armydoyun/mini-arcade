import { node, history, random, seededRandom, reducedMotion } from '../core.js';
import { sameGroup, collapseSame } from '../rules.js';

export default (s) => {
    const [columns, rows, colors] = s.options.mode === 'easy' ? [10, 8, 3] : s.options.mode === 'hard' ? [14, 10, 5] : [12, 10, 4], seed = s.options.seed ?? random(1, 0xffffffff), rng = seededRandom(seed);
    const palette = ['#ff8e7a', '#82b6ff', '#b9f86b', '#f5d47d', '#c1a0ff'], names = ['코럴', '블루', '라임', '골드', '보라'], symbols = ['●', '◆', '▲', '■', '✦'];
    let board = Array.from({ length: columns * rows }, () => 1 + Math.floor(rng() * colors)), tiles = [], score = 0, moves = 0, selected = [], hovered = [], entry = 0, locked = false;
    const element = node('div', 'same-board'); element.setAttribute('role', 'group'); element.setAttribute('aria-label', '같은 색 블록을 선택하고 한 번 더 눌러 제거하세요.');
    element.style.setProperty('--same-columns', columns); element.style.setProperty('--same-rows', rows); element.style.setProperty('--same-ratio', columns / rows); element.style.aspectRatio = `${columns} / ${rows}`; s.root.append(element);
    const gain = (group) => (group.length - 1) ** 2;
    const setEntry = (index) => { tiles.forEach((tile) => { if (tile) tile.tabIndex = -1; }); entry = index; if (tiles[entry]) tiles[entry].tabIndex = 0; };
    const update = () => {
        element.setAttribute('aria-busy', locked);
        const active = selected.length ? selected : hovered;
        tiles.forEach((tile, i) => {
            if (!tile) return; tile.classList.toggle('selected-group', selected.includes(i)); tile.classList.toggle('hover-group', hovered.includes(i));
            tile.setAttribute('aria-pressed', selected.includes(i)); tile.setAttribute('aria-label', `${Math.floor(i / columns) + 1}행 ${i % columns + 1}열 ${names[board[i] - 1]} 블록${selected.includes(i) ? ', 선택됨' : ''}`);
        });
        s.hud([['SCORE', score], ['남은 블록', board.filter(Boolean).length], ['선택 묶음', active.length >= 2 ? `${active.length}개 · +${gain(active)}` : '2개 이상'], ['제거', moves]]);
    };
    const build = () => {
        element.replaceChildren(); tiles = board.map((color, i) => {
            if (!color) return null;
            const tile = node('button', 'cell same-tile'), face = node('span', 'same-piece', symbols[color - 1]); tile.type = 'button'; tile.dataset.index = i; tile.tabIndex = -1;
            tile.style.setProperty('--tile-color', palette[color - 1]); tile.style.transform = `translate(${i % columns * 100}%, ${Math.floor(i / columns) * 100}%)`; face.setAttribute('aria-hidden', 'true'); tile.append(face); element.append(tile); return tile;
        });
        setEntry(board.findIndex(Boolean)); update();
    };
    const past = history(() => ({ board, score, moves }), (saved) => { ({ board, score, moves } = saved); selected = hovered = []; build(); s.assist(); s.message('제거 전의 판과 점수를 복원했어요. 이번 판은 연습 기록이에요.'); }, 160);
    const remove = () => {
        if (locked || selected.length < 2 || !s.active()) return;
        past.save(); s.changed(); locked = true; const group = [...selected], bonus = gain(group), oldEntry = entry, moving = collapseSame(board, columns, group), slides = moving.moves.some(({ from, to }) => from % columns !== to % columns), quiet = reducedMotion(); score += bonus; moves++;
        group.forEach((i) => { tiles[i].classList.add('leaving'); tiles[i].tabIndex = -1; }); selected = hovered = []; update(); s.sound(360 + Math.min(group.length, 18) * 22, .065);
        s.message(`${group.length}개 제거 · +${bonus.toLocaleString()}점`);
        s.later(quiet ? 0 : .12, () => {
            const lostFocus = group.some((i) => tiles[i] === document.activeElement), nextTiles = Array(board.length).fill(null);
            group.forEach((i) => tiles[i].remove());
            moving.moves.forEach(({ from, to }) => { const tile = tiles[from]; tile.dataset.index = to; tile.style.transform = `translate(${from % columns * 100}%, ${Math.floor(to / columns) * 100}%)`; nextTiles[to] = tile; });
            board = moving.board; tiles = nextTiles;
            const candidates = board.flatMap((color, i) => color ? [i] : []), nearest = candidates.sort((a, b) => Math.abs(a % columns - oldEntry % columns) + Math.abs(Math.floor(a / columns) - Math.floor(oldEntry / columns)) - Math.abs(b % columns - oldEntry % columns) - Math.abs(Math.floor(b / columns) - Math.floor(oldEntry / columns)))[0];
            setEntry(nearest ?? -1); update(); if (lostFocus && tiles[entry]) tiles[entry].focus({ preventScroll: true });
        });
        if (slides) s.later(quiet ? 0 : .30, () => { tiles.forEach((tile, i) => { if (tile) tile.style.transform = `translate(${i % columns * 100}%, ${Math.floor(i / columns) * 100}%)`; }); });
        s.later(quiet ? 0 : slides ? .50 : .33, () => {
            locked = false; const remaining = board.filter(Boolean).length, playable = board.some((color, i) => color && sameGroup(board, columns, i).length >= 2);
            if (!playable) {
                const bonus = remaining ? 0 : 1000; score += bonus; update();
                s.finish({ score, win: !remaining, recordText: `${score.toLocaleString()}점`, title: remaining ? '이번 판 정리 완료!' : '빈칸 하나 없이 깔끔하게!', text: remaining ? `${score.toLocaleString()}점 · ${remaining}개가 남았어요. 같은 판에서 더 큰 묶음을 찾아보세요.` : `${score.toLocaleString()}점 · 완전 제거 보너스 +1,000점!` });
            } else update();
        });
    };
    const choose = (index) => {
        if (locked || !board[index]) return;
        setEntry(index); const group = sameGroup(board, columns, index);
        if (group.length < 2) { selected = []; hovered = group; update(); s.message('혼자 남은 블록은 지울 수 없어요. 같은 색 두 개 이상을 연결하세요.'); return; }
        if (selected.includes(index)) { remove(); return; }
        selected = group; hovered = []; update(); s.message(`${group.length}개 · +${gain(group)}점. 한 번 더 클릭하거나 Space로 제거하세요.`);
    };
    s.on(element, 'click', (event) => { const tile = event.target.closest('.same-tile'); if (tile && s.active()) choose(Number(tile.dataset.index)); });
    const preview = (event) => {
        if (locked || !s.active()) return;
        const tile = event.target.closest('.same-tile'); if (!tile) return; const i = Number(tile.dataset.index); if (event.type === 'focusin') setEntry(i);
        if (!hovered.includes(i)) { hovered = sameGroup(board, columns, i); update(); }
    };
    s.on(element, 'pointerover', preview); s.on(element, 'focusin', preview); s.on(element, 'pointerleave', () => { hovered = []; update(); });
    const navigate = (code) => {
        if (entry < 0 || locked) return false;
        const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }; let next = entry;
        if (directions[code]) {
            const [dx, dy] = directions[code]; let x = next % columns + dx, y = Math.floor(next / columns) + dy;
            while (x >= 0 && y >= 0 && x < columns && y < rows) { if (board[y * columns + x]) { next = y * columns + x; break; } x += dx; y += dy; }
        } else if (code === 'Home') next = board.findIndex(Boolean); else if (code === 'End') next = board.findLastIndex(Boolean); else return false;
        if (next >= 0) { setEntry(next); tiles[next].focus({ preventScroll: true }); if (s.active()) { hovered = sameGroup(board, columns, next); update(); } } return true;
    };
    s.on(element, 'keydown', (event) => { if ((s.active() || s.over) && navigate(event.code)) { event.preventDefault(); event.stopPropagation(); } });
    const undo = () => { if (!locked) past.undo(); }, clear = () => { if (!locked) { selected = hovered = []; update(); } };
    s.controls([{ label: '선택 묶음 제거 · Space', action: remove, disabled: () => locked || selected.length < 2 }, { label: '선택 취소 · C', action: clear, disabled: () => locked || !selected.length }, { label: '되돌리기 · Z', action: undo, disabled: () => locked || !past.available() }]);
    s.bindKeys(['Space', 'Enter', 'KeyZ', 'KeyC', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'], (code) => { if (navigate(code)) return; if (code === 'Space') remove(); else if (code === 'Enter') choose(entry); else if (code === 'KeyZ') undo(); else if (code === 'KeyC') clear(); });
    s.setRecord(`${s.options.mode || 'classic'}:${seed.toString(36)}`, `${colors}색 · 문제 ${seed.toString(36).toUpperCase()}`); build();
    s.message('클릭으로 묶음 선택, 한 번 더 클릭해 제거 · 큰 묶음일수록 높은 점수 · 완전 제거 +1,000점.');
};
