import { node, duelHud, duelFinish, history } from '../core.js';

export default (s) => {
    let horizontal = Array(20).fill(0), vertical = Array(20).fill(0), owners = Array(16).fill(0), turn = 1, last = '', focused = 0;
    const boxes = [], edges = [], element = node('div', 'dots-board'); element.setAttribute('role', 'group'); element.setAttribute('aria-label', '점과 상자, 방향키로 선 선택');
    const scores = () => [owners.filter((value) => value === 1).length, owners.filter((value) => value === 2).length];
    const render = () => {
        element.dataset.turn = turn;
        edges.forEach((edge) => {
            const type = edge.dataset.kind, i = Number(edge.dataset.index), owner = (type === 'h' ? horizontal : vertical)[i];
            edge.className = `edge ${type === 'v' ? 'vertical' : ''} ${owner ? `p${owner}` : ''} ${last === type + i ? 'last-edge' : ''}`;
            edge.setAttribute('aria-label', `${type === 'h' ? '가로' : '세로'} ${Math.floor(Number(edge.dataset.y) / 2) + 1}행 ${Math.floor(Number(edge.dataset.x) / 2) + 1}열, ${owner ? `P${owner}의 선` : '빈 선'}`);
        });
        boxes.forEach((box, i) => {
            const x = i % 4, y = Math.floor(i / 4), sides = [horizontal[y * 4 + x], horizontal[(y + 1) * 4 + x], vertical[y * 5 + x], vertical[y * 5 + x + 1]].filter(Boolean).length;
            box.className = `box-owner ${owners[i] ? `p${owners[i]}` : sides === 3 ? 'nearly' : ''}`; box.textContent = owners[i] ? `P${owners[i]}` : sides === 3 ? '·' : '';
        });
        const [a, b] = scores(); duelHud(s, turn, `${a} 상자`, `${b} 상자`);
    };
    const past = history(() => ({ horizontal, vertical, owners, turn, last }), (state) => { ({ horizontal, vertical, owners, turn, last } = state); render(); s.message(`선과 점수를 함께 되돌렸어요. P${turn} 차례예요.`); });
    for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
        if (!(x % 2) && !(y % 2)) element.append(node('div', 'dot'));
        else if (x % 2 && y % 2) { const box = node('div', 'box-owner'); boxes.push(box); element.append(box); }
        else {
            const h = y % 2 === 0, index = h ? y / 2 * 4 + (x - 1) / 2 : (y - 1) / 2 * 5 + x / 2, edge = node('button', 'edge');
            edge.type = 'button'; edge.dataset.kind = h ? 'h' : 'v'; edge.dataset.index = index; edge.dataset.x = x; edge.dataset.y = y; edge.tabIndex = edges.length ? -1 : 0;
            edges.push(edge); element.append(edge);
        }
    }
    const focus = (index, move = false) => { edges[focused].tabIndex = -1; focused = index; edges[index].tabIndex = 0; if (move) edges[index].focus({ preventScroll: true }); };
    s.root.append(element);
    s.on(element, 'click', (event) => {
        const edge = event.target.closest('.edge'); if (!edge || !s.active()) return; focus(edges.indexOf(edge));
        const type = edge.dataset.kind, lines = type === 'h' ? horizontal : vertical, i = Number(edge.dataset.index); if (lines[i]) return;
        s.changed(); past.save(); lines[i] = turn; last = type + i; let gained = 0;
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
            const at = y * 4 + x;
            if (!owners[at] && horizontal[y * 4 + x] && horizontal[(y + 1) * 4 + x] && vertical[y * 5 + x] && vertical[y * 5 + x + 1]) { owners[at] = turn; gained++; }
        }
        s.sound(gained ? 650 + gained * 70 : 380, .06);
        if (owners.every(Boolean)) { turn = 0; render(); const [a, b] = scores(); duelFinish(s, a === b ? 0 : a > b ? 1 : 2, `P1 ${a}상자 · P2 ${b}상자`); }
        else { if (!gained) turn = 3 - turn; render(); s.message(gained ? `+${gained} 상자! P${turn}이 한 번 더 둬요.` : `P${turn} 차례 · 가운데 점이 보이는 상자는 변이 하나 남았어요.`); }
    });
    s.on(element, 'keydown', (event) => {
        const edge = event.target.closest('.edge'); if (!edge || (!s.active() && !s.over)) return;
        const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.code]; if (!direction) return;
        const x = Number(edge.dataset.x), y = Number(edge.dataset.y); let best = -1, cost = Infinity;
        edges.forEach((candidate, i) => {
            const dx = Number(candidate.dataset.x) - x, dy = Number(candidate.dataset.y) - y, forward = dx * direction[0] + dy * direction[1];
            if (forward <= 0) return; const cross = dx * direction[1] - dy * direction[0], nextCost = forward * forward + cross * cross * 1.5;
            if (nextCost < cost) { cost = nextCost; best = i; }
        });
        event.preventDefault(); event.stopPropagation(); if (best >= 0) focus(best, true);
    });
    const undo = () => past.undo(); s.controls([{ label: '한 수 되돌리기 · Z', action: undo, disabled: () => !past.available() }]); s.bindKeys(['KeyZ'], undo);
    render(); s.message('네 번째 선을 그으면 내 상자! 방향키로 선을 고르고 Enter로 그을 수 있어요.');
};
