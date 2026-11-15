import assert from 'node:assert/strict';
import { games } from '../js/catalog.js';
import { formatTime } from '../js/core.js';
import { lightsSolution, shortestMazePath, hexLayout, hexPath } from '../js/rules.js';
import { nonograms } from '../js/puzzles.js';
import { Element, win, frames, tick, advance, key, mount, check, counts } from './harness.mjs';

const rng = Math.random;
let t;
for (const fps of [60, 30, 15, 10]) {
    t = mount('tetris'); tick(); const before = t.s.elapsed();
    for (let n = 0; n < fps * 3; n++) tick(1 / fps);
    check(Math.abs(t.s.elapsed() - before - 3) < 1e-8, `${fps}fps preserves three active seconds`);
    check(Math.abs(t.s.time - t.s.elapsed()) < 1e-8, 'Physics and elapsed time share a clock'); t.destroy();
}
t = mount('snake'); tick(); advance(.3); const prior = t.s.elapsed(); tick(1);
check(t.s.paused && t.s.elapsed() === prior, 'A long rendering interruption pauses without recording lost time');
t.s.pause(false); tick(); tick(.1); check(Math.abs(t.s.elapsed() - prior - .1) < 1e-8, 'Resume starts a fresh frame interval'); t.destroy();
check(formatTime(59.9999999999, true) === '1:00.0', 'Tenths and minutes roll over together');

t = mount('cycles'); advance(4); const roundTime = t.s.elapsed();
check(t.s.waiting && roundTime > 1, 'The first Cycles round reaches its intermission');
advance(2); check(t.s.elapsed() === roundTime, 'Intermission is excluded from active match time');
t.s.begin(); tick(); advance(.3); check(t.s.elapsed() > roundTime, 'The second round preserves the first round time'); t.destroy();

Math.random = () => .99;
t = mount('tetris'); const canvas = t.root.children.find((element) => element.tagName === 'CANVAS'); let opaque = 0, activeColor;
canvas.paint = (name, args, context) => {
    if (name === 'fillRect' && args[0] === 0 && args[1] === 0 && args[2] === 400 && args[3] === 560) opaque = 0;
    if (name === 'roundRect' && args[2] === 22 && args[3] === 22 && context.globalAlpha === 1) { opaque++; activeColor = context.fillStyle; }
};
tick(); const originalColor = activeColor; key('KeyC'); tick(); const heldColor = activeColor; key('KeyC'); tick();
check(originalColor !== heldColor && activeColor === heldColor, 'Hold swaps once and cannot be reused before locking'); t.destroy();
t = mount('tetris'); const falling = t.root.children.find((element) => element.tagName === 'CANVAS'); opaque = 0;
falling.paint = (name, args, context) => {
    if (name === 'fillRect' && args[2] === 400 && args[3] === 560) opaque = 0;
    if (name === 'roundRect' && args[2] === 22 && args[3] === 22 && context.globalAlpha === 1) opaque++;
};
tick(); win.emit('keydown', { code: 'ArrowDown' }); advance(.8); win.emit('keyup', { code: 'ArrowDown' });
for (let n = 0; n < 100 && !t.s.over; n++) { key('KeyX'); advance(.1); }
check(opaque > 4, 'Repeated floor rotation eventually locks a piece after the reset limit'); t.destroy();

// A known bag opens with J, L and I. They fill exactly one row through public input.
let calls = 0; const bagRandom = [.5, .75, .01, .99, .99, .99]; Math.random = () => bagRandom[calls++] ?? .99;
t = mount('tetris'); for (let n = 0; n < 3; n++) key('ArrowLeft'); key('Space'); key('Space');
for (let n = 0; n < 3; n++) key('ArrowRight'); key('Space');
check(t.state.hud[1][1] === 1 && t.state.hud[0][1] === 210, 'J/L/I placements clear one row and award exact drop plus line points'); t.destroy();
Math.random = rng;
t = mount('tetris', { mode: 'sprint' }); advance(1.2);
check(t.state.hud[0][0] === 'TIME' && t.state.hud[0][1] !== '0:00.0', 'Sprint shows an advancing tenths timer'); t.destroy();

t = mount('memory', { mode: 'challenge' }, false);
check(!t.cells().some((cell) => cell.classList.contains('revealed')), 'Every card starts concealed behind the ready screen');
check(!t.cells().some((cell) => /[◆●▲✦○■✚◇★⬟]/u.test(cell.getAttribute('aria-label'))), 'Ready accessibility names contain no answer symbols');
t.s.begin(); check(t.cells().every((cell) => cell.classList.contains('revealed')), 'Preview begins only after Start');
t.s.pause(true); check(!t.cells().some((cell) => cell.classList.contains('revealed')), 'Pause conceals the entire preview');
const pausedTime = t.s.time; advance(2); check(t.s.time === pausedTime, 'Paused preview consumes no time');
t.s.pause(false); check(t.cells().every((cell) => cell.classList.contains('revealed')), 'Resume restores the remaining preview');
advance(1.7); check(!t.cells().some((cell) => cell.classList.contains('revealed')), 'Preview ends after its active duration'); t.destroy();

t = mount('nonogram', { mode: 'puzzle-0' });
const filled = [...nonograms[0].pattern.replaceAll('/', '')].flatMap((value, i) => value === '1' ? [i] : []), last = filled.pop(); filled.forEach(t.click);
const lastCell = t.cells()[last]; lastCell.parent.emit('pointerdown', { target: lastCell, button: 0 });
check(!t.state.results.length, 'Finishing a drag does not open the result during pointerdown');
win.emit('pointerup'); check(t.state.results.length === 1, 'The complete drag commits a result at pointerup'); check(t.state.results[0].seconds === t.state.results[0].score, 'Timed puzzle result uses the same displayed seconds as its record'); t.destroy();


t = mount('nonogram', { mode: 'puzzle-0' });
const completeCells = [...nonograms[0].pattern.replaceAll('/', '')].flatMap((value, i) => value === '1' ? [i] : []), finalCell = completeCells.pop();
completeCells.forEach(t.click); t.cells()[finalCell].parent.emit('pointerdown', { target: t.cells()[finalCell], button: 0 });
t.s.pause(true); check(!t.state.results.length, 'Interrupted final drag does not finish while paused');
t.s.pause(false); check(t.state.results.length === 1, 'Resuming commits a completed interrupted drag'); t.destroy();

t = mount('connect-four'); const columnBar = t.root.all((element) => element.classList.contains('connect-column-bar'))[0];
columnBar.parent.emit('focusin', { target: columnBar.children[2] });
check(t.cells().filter((cell) => cell.classList.contains('preview')).length === 1, 'Keyboard focus previews a Connect Four landing');
for (const x of [0, 1, 0, 1, 0, 1]) columnBar.children[x].emit('click');
const focusBeforeWin = t.s.focus;
t.s.focus = () => { if (t.s.over) throw new Error('Game focus stole the finished result focus'); focusBeforeWin(); };
columnBar.children[0].emit('click');
check(t.state.results[0]?.winner === 1 && !t.cells().some((cell) => cell.classList.contains('preview')), 'Final column button keeps result focus and removes landing previews'); t.destroy();

for (const id of ['sliding', 'lights', 'flood']) {
    const board = (seed) => { const sample = mount(id, { seed }); const value = sample.cells().map((cell) => [cell.textContent, cell.classList.contains('lit'), cell.style.background]); sample.destroy(); return value; };
    assert.deepEqual(board(5731), board(5731)); check(true, `${id} can replay the same seed`);
    check(JSON.stringify(board(5731)) !== JSON.stringify(board(993137)), `${id} generates a different new problem`);
}
t = mount('lights', { seed: 77191 }); const lightBoard = t.cells().map((cell) => cell.classList.contains('lit')), solution = lightsSolution(lightBoard, 5);
t.click(0); t.click(0); solution.forEach(t.click);
check(t.state.results[0]?.score === 2, 'Lights records excess moves above the starting optimum'); t.destroy();
t = mount('flood', { seed: 194 });
const color = t.cells()[0].textContent, symbols = ['●', '◆', '▲', '■', '✦', '○'], choice = (symbols.indexOf(color) + 1) % 6;
key(`Numpad${choice + 1}`); check(t.state.hud[2][1] === 1, 'Numeric keypad performs the same color choice as the number row'); t.destroy();

// Recover the visible walls, then navigate that drawing to verify movement and efficiency scoring.
const visibleMaze = (seed) => {
    const sample = mount('maze', { seed }), size = 15, walls = Array.from({ length: size * size }, () => [false, false, false, false]); let from;
    sample.root.children.find((element) => element.tagName === 'CANVAS').paint = (name, args) => {
        if (name === 'moveTo') from = args;
        if (name !== 'lineTo' || !from) return;
        const [x1, y1] = from.map((value) => Math.round((value - 15) / 30)), [x2, y2] = args.map((value) => Math.round((value - 15) / 30));
        if (x1 === x2) { const y = Math.min(y1, y2); if (y >= 0 && y < size) { if (x1 < size) walls[y * size + x1][3] = true; if (x1 > 0) walls[y * size + x1 - 1][1] = true; } }
        if (y1 === y2) { const x = Math.min(x1, x2); if (x >= 0 && x < size) { if (y1 < size) walls[y1 * size + x][0] = true; if (y1 > 0) walls[(y1 - 1) * size + x][2] = true; } }
    };
    tick(); return { ...sample, walls };
};
t = visibleMaze(891); const route = shortestMazePath(t.walls, 15), direction = (a, b) => b - a === 1 ? 'ArrowRight' : b - a === -1 ? 'ArrowLeft' : b > a ? 'ArrowDown' : 'ArrowUp';
key(direction(route[0], route[1])); key(direction(route[1], route[0]));
for (let i = 1; i < route.length; i++) key(direction(route[i - 1], route[i]));
check(t.state.results[0]?.score === Math.round((route.length - 1) / (route.length + 1) * 1000) / 10 && t.state.results[0]?.order === 'high', 'Maze completion ranks path efficiency after a real detour'); t.destroy();
for (let seed = 1; seed < 200; seed++) {
    t = visibleMaze(seed);
    if (!t.walls[0][1] && !t.walls[1][1]) {
        win.emit('keydown', { code: 'ArrowUp' }); win.emit('keydown', { code: 'ArrowRight' }); advance(.5);
        check(t.state.hud[0][1] > 1, 'A held blocked Up key cannot suppress the newer Right key'); t.destroy(); break;
    }
    t.destroy();
}

const pongBounce = (release) => {
    let call = 0; Math.random = () => call++ === 0 ? .1 : .999;
    const sample = mount('pong'); let ball, previous, paddle;
    sample.root.children.find((element) => element.tagName === 'CANVAS').paint = (name, args) => {
        if (name === 'roundRect' && args[2] === 11 && args[3] === 88) paddle = args[1];
        if (name === 'arc' && args[2] === 7) ball = { x: args[0], y: args[1] };
    };
    win.emit('keydown', { code: 'ArrowUp' }); let outcome;
    for (let n = 0; n < 360; n++) {
        if (release && sample.s.time > .6) win.emit('keyup', { code: 'ArrowUp' });
        tick(1 / 120);
        if (previous && previous.x > 570 && ball.x < previous.x) { outcome = { dy: ball.y - previous.y, paddle }; break; }
        previous = ball;
    }
    sample.destroy(); Math.random = rng; return outcome;
};
const held = pongBounce(false), released = pongBounce(true);
check(held?.paddle === 6 && released?.paddle === 6 && Math.abs(held.dy - released.dy) < 1e-8, 'A stopped paddle has identical spin whether Up is held or released');

t = mount('breakout'); tick(); const endTime = t.s.elapsed(); t.s.later(.05, () => { throw new Error('Late gameplay after finish'); }); t.s.finish({ score: 0, win: false });
check(t.s.over && !t.state.results.length, 'End feedback runs with gameplay already blocked'); advance(.4);
check(t.state.results.length === 1 && t.state.results[0].seconds === endTime && frames.size === 0, 'Feedback completes once without adding gameplay time or retaining a frame'); t.destroy();

for (const size of [3, 7, 9]) {
    const layout = hexLayout(size); check(layout.cells.length === size * size && layout.goals.length === 4, 'Hex layout includes every cell and all goal borders');
    for (const cell of layout.cells) check(cell.x >= 0 && cell.y >= 0 && cell.x + 1 <= layout.width && cell.y + layout.unitHeight <= layout.height + 1e-8, 'Hex cell remains inside the shared geometry');
    const b = Array(size * size).fill(0); for (let y = 0; y < size; y++) b[y * size] = 1;
    check(hexPath(b, size, 1).length === size, 'The rendered column corresponds to a top-to-bottom winning connection');
}
t = mount('dots'); const edges = t.root.all((element) => element.classList.contains('edge'));
check(edges.filter((edge) => edge.tabIndex === 0).length === 1, 'Dots board has one tab entry');
edges[0].parent.emit('keydown', { target: edges[0], code: 'ArrowRight' });
check(document.activeElement !== edges[0] && edges.includes(document.activeElement), 'Arrow navigation reaches another real edge'); t.destroy();
t = mount('hex'); const hexCells = t.root.all((element) => element.classList.contains('hex-cell'));
hexCells[12].parent.emit('click', { target: hexCells[12] }); check(hexCells[12].tabIndex === 0 && hexCells[0].tabIndex === -1, 'Mouse-selected Hex cell becomes the keyboard entry'); t.destroy();

// App-level ranking and persistence use the real finish callback; only browser surfaces are adapted.
const merge = games.find((game) => game.id === 'merge'), originalMerge = merge.create;
for (const [name, saved] of [['denied', { records: { 'merge:v3:classic': { plays: 1, best: 200, bestText: '200점' } } }], ['broken', { records: { 'merge:v3:classic': 1 } }], ['arrays', { records: [], modes: [], latest: [], seeds: [], completed: [] }], ['resume-end', {}]]) {
    const elements = new Map(), filters = ['all', '1', '2', 'favorite'].map((value) => { const item = new Element('button'); item.dataset.player = value; return item; });
    const element = (id) => { if (!elements.has(id)) { const item = new Element(id === 'game-search' ? 'input' : 'div'); item.value = ''; elements.set(id, item); } return elements.get(id); };
    const doc = new Element('document'); doc.body = new Element('body'); doc.activeElement = doc.body; doc.createElement = (tag) => new Element(tag); doc.getElementById = element;
    doc.querySelectorAll = () => filters; doc.querySelector = (selector) => selector === '[data-player="favorite"]' ? filters[3] : null;
    globalThis.document = doc; globalThis.window = new Element('window'); window.scrollTo = () => {}; globalThis.location = { hash: '#merge', protocol: 'http:' }; let persisted, active;
    globalThis.localStorage = { getItem: () => JSON.stringify(saved), setItem: (_, value) => { if (name === 'denied') throw new Error('Storage denied'); persisted = JSON.parse(value); } };
    merge.create = (s) => { active = s; const finish = () => s.finish({ score: 100, title: '완료' }); s.on(s.root, 'test-finish', finish); if (name === 'resume-end') s.on(s.root, 'gameresume', finish); };
    try {
        await import(`../js/app.js?regression=${name}`);
        if (name === 'resume-end') { element('pause').emit('click'); element('pause').emit('click'); }
        else element('game-root').emit('test-finish');
    } finally { merge.create = originalMerge; }
    if (name === 'denied') check(element('overlay-stats').textContent.includes('이번 실행 중') && !element('overlay-stats').textContent.includes('저장 완료'), 'Denied storage never claims a successful save');
    else check(persisted.records['merge:v3:classic'].plays === 1 && persisted.records['merge:v3:classic'].best === 100, 'Malformed nested data is repaired without breaking finish');
    if (name === 'resume-end') check(!element('game-overlay').hidden && element('game-root').inert && doc.activeElement === element('overlay-action'), 'A completion during resume keeps the result visible and focused');
    active.destroy();
}
console.log(`PASS: ${counts().assertions} targeted regression conditions`);
