import assert from 'node:assert/strict';
import { games } from '../js/catalog.js';
import { lightsSolution, floodGreedy } from '../js/rules.js';
import { nonograms } from '../js/puzzles.js';
import { Element, win, frames, tick, advance, key, mount, check, counts } from './harness.mjs';

for (const game of games) {
    const t = mount(game.id); check(t.root.children.length > 0, `${game.id} mounts a board`); check(t.state.hud.length > 0, `${game.id} initializes its HUD`);
    check(t.controls.children.length === ({ laser: 3, pipes: 4, sudoku: 13, mancala: 1, territory: 1, bubbles: 1, golf: 1, 'switch-duo': 3, sokoban: 1, samegame: 3, 'wall-race': 4, mines: 1, merge: 1, nonogram: 3, sliding: 1, lights: 2, flood: 7, memory: 1, simon: 1, maze: 2, tictactoe: 1, gomoku: 1, 'connect-four': 1, reversi: 1, dots: 1, hex: 1, 'swipe-break': 1 }[game.id] || 0), `${game.id} keeps only desktop game tools`);
    for (let n = 0; n < 240 && !t.s.over; n++) { if (n % 45 === 0) key(game.id === 'cycles' ? 'KeyW' : 'Space'); tick(); }
    if (!t.s.over) { t.s.pause(true); const clock = t.s.time; advance(.5); check(t.s.time === clock, `${game.id} freezes time while paused`); t.s.pause(false); tick(); }
    check(t.state.results.length <= 1, `${game.id} reports its result once`); t.destroy();
}
let t = mount('tictactoe'); [0, 3, 1, 4, 2].forEach(t.click); check(t.state.results[0]?.winner === 1, 'Tic-tac-toe ends with the winning player'); check(t.cells().filter((cell) => cell.classList.contains('win')).length === 3, 'Tic-tac-toe highlights the winning line'); t.click(8); check(t.state.results.length === 1, 'Finished board cannot accept another move'); t.destroy();
t = mount('tictactoe'); [0, 1, 2, 4, 3, 5, 7, 6, 8].forEach(t.click); check(t.state.results[0]?.winner === 0, 'Tic-tac-toe full board draw'); t.destroy();
t = mount('gomoku'); [0, 15, 1, 16, 2, 17, 3, 18, 4].forEach(t.click); check(t.state.results[0]?.winner === 1, 'Gomoku five-in-a-row integration'); t.destroy();
t = mount('connect-four'); [0, 1, 0, 1, 0, 1, 0].forEach(t.click); check(t.state.results[0]?.winner === 1, 'Connect Four gravity and vertical win'); check(t.cells()[35].classList.contains('p1'), 'Connect Four fills the bottom slot first'); t.destroy();
t = mount('reversi'); t.click(0); check(t.cells().filter((cell) => /\bp[12]\b/.test(cell.className)).length === 4, 'Reversi rejects an illegal opening'); let guard = 0; while (!t.s.over && guard++ < 65) { const i = t.cells().findIndex((cell) => cell.classList.contains('legal')); check(i >= 0, 'Reversi gives the active player a legal move'); t.click(i); } check(t.s.over, 'Reversi finishes a complete match including passes'); t.destroy();
t = mount('dots'); const edges = t.root.all((element) => element.classList.contains('edge')); const edge = (kind, index) => { const target = edges.find((element) => element.dataset.kind === kind && Number(element.dataset.index) === index); target.parent.emit('click', { target }); }; edge('h', 0); edge('v', 0); edge('h', 4); edge('v', 1); check(t.state.hud[1][1] === 'P2', 'Dots and Boxes awards an extra turn'); check(t.state.hud[2][1] === '1 상자', 'Dots and Boxes scores the closing player'); for (const target of edges) target.parent.emit('click', { target }); check(t.state.results.length === 1, 'Dots and Boxes completes all 16 boxes'); t.destroy();
t = mount('hex'); const hexCells = t.root.all((element) => element.classList.contains('hex-cell')); for (let y = 0; y < 7; y++) { let target = hexCells[y * 7]; target.closest('.hex-board').emit('click', { target }); if (y < 6) { target = hexCells[y * 7 + 6]; target.closest('.hex-board').emit('click', { target }); } } check(t.state.results[0]?.winner === 1, 'Hex connects top to bottom'); check(hexCells.filter((cell) => cell.classList.contains('win')).length === 7, 'Hex highlights the complete path'); t.destroy();
t = mount('mines'); t.click(40); check(t.cells()[40].classList.contains('open'), 'Mines first click is safe'); check(!t.s.over, 'Mines opening does not lose'); t.destroy();
t = mount('memory'); advance(1.7); t.click(0); t.click(1); t.s.pause(true); const hiddenBefore = t.cells()[0].textContent; advance(2); check(t.cells()[0].textContent === hiddenBefore, 'Memory delay freezes while paused'); t.s.pause(false); advance(1); check(!t.state.results.length, 'Memory delayed action resumes safely'); t.destroy();
t = mount('cycles', { mode: 'sudden' }); advance(4); check(t.state.results[0]?.winner === 0, 'Light Cycles detects simultaneous head-on collision'); t.destroy();
t = mount('pong'); win.emit('keydown', { code: 'KeyW' }); win.emit('keydown', { code: 'ArrowDown' }); check(t.s.down('KeyW') && t.s.down('ArrowDown'), 'Two players can hold keys simultaneously'); t.s.pause(true); check(!t.s.down('KeyW') && !t.s.down('ArrowDown'), 'Pause releases both players'); t.s.pause(false); check(!t.s.down('KeyW'), 'Resume does not retain a stuck key'); document.activeElement = new Element('button'); win.emit('keydown', { code: 'KeyW' }); check(!t.s.down('KeyW'), 'Native toolbar buttons retain keyboard focus'); document.activeElement = new Element('body'); t.destroy();
t = mount('swipe-break'); key('Space'); key('KeyC'); check(t.state.hud[2][1] === 2, 'C recalls the active volley and advances one round'); key('KeyC'); check(t.state.hud[2][1] === 2, 'C does not advance a round before shooting'); t.destroy();


for (const id of ['asteroids', 'invaders', 'runner', 'pong', 'swipe-break']) {
    t = mount(id); if (id === 'asteroids' || id === 'invaders') win.emit('keydown', { code: 'Space' });
    if (id === 'asteroids') { win.emit('keydown', { code: 'ArrowUp' }); win.emit('keydown', { code: 'ArrowRight' }); }
    if (id === 'swipe-break') { key('Space'); key('Space'); }
    for (let n = 0; n < 1800 && !t.s.over; n++) { if (id === 'runner' && n % 36 === 0) key('Space'); if (id === 'invaders' && n % 90 === 0) { win.emit('keyup', { code: 'ArrowLeft' }); win.emit('keyup', { code: 'ArrowRight' }); win.emit('keydown', { code: n % 180 ? 'ArrowLeft' : 'ArrowRight' }); } tick(); }
    check(t.state.results.length <= 1, `${id} long simulation never double-finishes`); t.destroy();
}

// New mechanics are exercised through the same input events used in the browser.
t = mount('tetris', {}, false); check(t.s.waiting && frames.size === 0, 'Ready gate starts with no active frame loop'); advance(2); check(t.s.time === 0, 'Ready time cannot advance gameplay'); document.activeElement = new Element('button'); key('Space'); check(t.s.waiting, 'Ready does not steal Space from native buttons'); document.activeElement = t.root; key('Space'); check(!t.s.waiting && t.state.hud[0][1] === 0, 'First Space starts without also dropping a block'); key('Space'); check(t.state.hud[0][1] > 0, 'Second Space performs a real hard drop'); t.destroy();
t = mount('tictactoe'); t.cells()[1].parent.emit('keydown', { target: t.cells()[1], code: 'ArrowUp' }); check(document.activeElement === t.cells()[1], 'Top-row arrow navigation preserves the column'); t.cells()[7].parent.emit('keydown', { target: t.cells()[7], code: 'ArrowDown' }); check(document.activeElement === t.cells()[7], 'Bottom-row navigation does not jump to the final column'); t.destroy();
t = mount('tictactoe', { mode: 'reverse' }); [0, 3, 1, 4, 2].forEach(t.click); check(t.state.results[0]?.winner === 2, 'Reverse tic-tac-toe awards the opponent of the connecting player'); t.destroy();
for (const id of ['tictactoe', 'gomoku', 'connect-four', 'reversi']) { t = mount(id); t.click(id === 'reversi' ? 19 : 0); key('KeyZ'); check(t.cells().filter((cell) => /\bp[12]\b/.test(cell.className)).length === (id === 'reversi' ? 4 : 0), `${id} undo restores all stones and turn`); t.destroy(); }
for (const game of games) for (const mode of game.modes || []) { t = mount(game.id, { mode: mode.id }); check(t.root.children.length > 0 && t.state.hud.length > 0, `${game.id}/${mode.id} initializes`); advance(.1); t.destroy(); }
for (let level = 0; level < nonograms.length; level++) { t = mount('nonogram', { mode: `puzzle-${level}` }); const pattern = nonograms[level].pattern.replaceAll('/', ''); [...pattern].forEach((value, i) => { if (value === '1') t.click(i); }); check(t.state.results.length === 1, `Nonogram ${level + 1} can be completed`); check(t.state.results[0].recordKey === `puzzle-${level}`, 'Each nonogram has its own record key'); check(!t.state.results[0].practice, 'Unassisted nonogram remains eligible'); if (level + 1 < nonograms.length) check(t.state.results[0].next.mode === `puzzle-${level + 1}`, 'Next puzzle points to the following level'); t.destroy(); }
for (const mode of ['classic', 'easy']) { t = mount('lights', { mode }); const size = mode === 'easy' ? 3 : 5, board = t.cells().map((cell) => cell.classList.contains('lit')), solution = lightsSolution(board, size); solution.forEach(t.click); check(t.state.results[0]?.score === 0, `Lights ${size}×${size} completes using its generated solution`); t.destroy(); }
t = mount('lights'); const lightBefore = t.cells().map((cell) => cell.classList.contains('lit')); t.click(0); key('KeyZ'); assert.deepEqual(t.cells().map((cell) => cell.classList.contains('lit')), lightBefore); check(t.s.practice, 'Puzzle undo marks assisted practice'); key('KeyH'); check(t.cells().some((cell) => cell.classList.contains('hint')), 'Lights hint highlights an actual next move'); t.destroy();
for (const mode of ['classic', 'easy', 'hard']) { t = mount('flood', { mode }); const colors = ['#ff8e7a', '#82b6ff', '#b9f86b', '#f5d47d', '#c1a0ff', '#76d0c5'], board = t.cells().map((cell) => colors.indexOf(cell.style.background)), limit = mode === 'easy' ? 30 : mode === 'hard' ? 22 : 25, solution = floodGreedy(board, 10, limit); check(solution !== null, `Flood ${mode} has a completing route`); solution.forEach((color) => key(`Digit${color + 1}`)); check(t.state.results.length === 1 && t.state.results[0].win !== false, 'Flood can complete within its advertised limit'); check(t.state.results[0].score <= limit, 'Flood victory uses at most the move budget'); t.destroy(); }
t = mount('merge'); const mergeBefore = t.cells().map((cell) => cell.textContent); for (const code of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) { key(code); if (t.state.hud[2][1] > 0) break; } key('KeyZ'); assert.deepEqual(t.cells().map((cell) => cell.textContent), mergeBefore); check(t.state.hud[0][1] === 0 && t.s.practice, '2048 undo restores score, tiles and assistance state'); t.destroy();
for (const mode of ['easy', 'medium', 'hard']) { t = mount('mines', { mode }); const columns = mode === 'hard' ? 24 : mode === 'medium' ? 16 : 9, i = columns + 1; t.click(i); check(t.cells()[i].classList.contains('open') && !t.cells()[i].textContent, `Mines ${mode} first neighborhood is clear`); const number = t.cells().findIndex((cell) => cell.classList.contains('open') && Number(cell.dataset.number) > 0); if (number >= 0 && !t.s.over) { const before = t.cells().filter((cell) => cell.classList.contains('open')).length; t.click(number); check(before === t.cells().filter((cell) => cell.classList.contains('open')).length, 'Mines chord requires the right number of flags'); } t.destroy(); }
t = mount('cycles'); advance(4); check(t.s.waiting && !t.state.results.length, 'Drawn round in a series waits for both players'); t.s.begin(); check(t.state.hud[1][0] === 'ROUND 2', 'Series continues into the next arena'); t.destroy();
t = mount('simon');
const observePattern = () => { const sequence = []; let last = -1; for (let n = 0; n < 1200; n++) { const lit = t.cells().findIndex((cell) => cell.classList.contains('flash')); if (lit >= 0 && lit !== last) sequence.push(lit); last = lit; if (String(t.state.hud[1][1]).includes('/')) return sequence; tick(); } throw new Error('Simon never entered the input phase'); };
for (let level = 1; level <= 3; level++) { const sequence = observePattern(); check(sequence.length === level, 'Simon shows exactly the full current pattern'); sequence.forEach((i) => key(`Digit${i + 1}`)); advance(.3); }
const nextPattern = observePattern(); key(`Digit${(nextPattern[0] + 1) % 4 + 1}`); check(t.state.results[0]?.score === 3, 'Simon advances correct sequences and ends a wrong sequence accurately'); t.destroy();
t = mount('memory', { mode: 'quick' }); advance(1.7); for (let i = 0; i < t.cells().length && !t.s.over; i++) { if (t.cells()[i].classList.contains('matched')) continue; for (let j = i + 1; j < t.cells().length && !t.s.over; j++) { if (t.cells()[j].classList.contains('matched')) continue; t.click(i); t.click(j); advance(.9); if (t.cells()[i].classList.contains('matched')) break; } } check(t.state.results.length === 1, 'Memory can finish a complete match including delayed mismatches'); t.destroy();

for (const [name, stored] of [['blocked', undefined], ['malformed', '{invalid'], ['null', 'null']]) {
    const elements = new Map(), filters = ['all', '1', '2', 'favorite'].map((value) => { const button = new Element('button'); button.dataset.player = value; return button; });
    const element = (id) => { if (!elements.has(id)) { const item = new Element(id === 'game-search' ? 'input' : 'div'); item.value = ''; elements.set(id, item); } return elements.get(id); };
    globalThis.localStorage = { getItem() { if (stored === undefined) throw new Error('Storage denied'); return stored; }, setItem() { throw new Error('Storage denied'); } };
    globalThis.location = { hash: '', protocol: 'http:' };
    const doc = new Element('document'); doc.body = new Element('body'); doc.activeElement = doc.body; doc.createElement = (tag) => new Element(tag); doc.getElementById = element; doc.querySelectorAll = () => filters; doc.querySelector = (selector) => selector === '[data-player="favorite"]' ? filters.find((item) => item.dataset.player === 'favorite') : null;
    globalThis.document = doc; globalThis.window = new Element('window');
    await import(`../js/app.js?storage=${name}`);
    check(element('game-grid').children.length === games.length, `${name} storage still loads all registered games`);
    element('sound-setting').emit('change', { target: { checked: false } }); check(true, `${name} storage write failure does not throw`);
}

let persisted = { sound: false, records: {}, modes: {}, latest: {} }, caseNumber = 0;
const mergeDefinition = games.find((game) => game.id === 'merge'), originalMerge = mergeDefinition.create;
const recordCase = async ({ variant, score, order, practice = false, win = true }) => {
    const elements = new Map(), filters = ['all', '1', '2', 'favorite'].map((value) => { const element = new Element('button'); element.dataset.player = value; return element; });
    const element = (id) => { if (!elements.has(id)) { const item = new Element(id === 'game-search' ? 'input' : 'div'); item.value = ''; elements.set(id, item); } return elements.get(id); };
    const doc = new Element('document'); doc.body = new Element('body'); doc.activeElement = doc.body; doc.createElement = (tag) => new Element(tag); doc.getElementById = element; doc.querySelectorAll = () => filters; doc.querySelector = (selector) => selector === '[data-player="favorite"]' ? filters.find((item) => item.dataset.player === 'favorite') : null;
    globalThis.document = doc; globalThis.window = new Element('window'); window.scrollTo = () => {}; globalThis.location = { hash: '#merge', protocol: 'http:' };
    globalThis.localStorage = { getItem: () => JSON.stringify(persisted), setItem: (_, value) => { persisted = JSON.parse(value); } };
    mergeDefinition.create = (s) => { s.setRecord(variant, variant); if (practice) s.assist(); s.finish({ score, order, win }); };
    try { await import(`../js/app.js?record=${++caseNumber}`); } finally { mergeDefinition.create = originalMerge; }
};
await recordCase({ variant: 'normal', score: 100 }); await recordCase({ variant: 'normal', score: 50 }); check(persisted.records['merge:v3:normal'].best === 100, 'High scores retain the higher result');
await recordCase({ variant: 'other', score: 20 }); check(persisted.records['merge:v3:other'].best === 20 && persisted.records['merge:v3:normal'].best === 100, 'Mode records remain independent');
await recordCase({ variant: 'normal', score: 1000, practice: true }); check(persisted.records['merge:v3:normal'].best === 100, 'Assisted play cannot overwrite a ranked record');
await recordCase({ variant: 'sprint', score: 40, order: 'low' }); await recordCase({ variant: 'sprint', score: 30, order: 'low' }); check(persisted.records['merge:v3:sprint'].best === 30, 'Sprint records keep the lower time');
await recordCase({ variant: 'sprint', score: 0, order: 'low', win: false }); check(persisted.records['merge:v3:sprint'].best === 30, 'A failed timed run cannot overwrite a completed sprint');

const { assertions, draws } = counts();
console.log(`PASS: ${assertions} lifecycle / integration assertions across ${games.length} games; ${draws.toLocaleString()} canvas calls checked`);
