import assert from 'node:assert/strict';
import { seededRandom } from '../js/core.js';
import { parseSokoban, sokobanStep, sokobanWalk, sameGroup, collapseSame, raceMoves, racePath, raceWallError, raceBlocked, traceRicochet, sweepBox, sweepCircle } from '../js/rules.js';
import { sokobanLevels } from '../js/puzzles.js';
import { tankArenas } from '../js/games/tanks.js';
import { games } from '../js/catalog.js';
import { Element, mount, key, advance, tick, win, check, counts } from './harness.mjs';

// Solutions certified by a separate push-space solver; replayed through real input.
const solutions = ["R", "RU", "RR", "LLL", "UDLL", "UDRRR", "RLDDL", "LLULDDD", "LLDLUUU", "UDLLLUDL", "LLRRDLRDD", "UUUDDRLDRRR", "RRRLLLDRRURDDD", "LLLRRRDLLLRRDLDLUU", "LLLRRRDDDLURULDDLLDLUU", "LUUULURDDDLRDLLUUU", "URULDDRDRULURLDDDLLURRDRUUULUR", "LLUURULURRLLDDDDRULURRRRURDLDDLLULUR", "RRRULDLURULDDLLLDDRULURRRRLLDLDRRR", "RUULDDLURULLLRRDDLLULDRRRRDRDLL"];
const minimumPushes = (map) => {
    const rows = map.split('/'), width = rows[0].length, floor = new Set(), goals = new Set(), boxes = []; let player;
    rows.forEach((row, y) => [...row].forEach((c, x) => { const i = y * width + x; if (c !== '#') floor.add(i); if ('.*+'.includes(c)) goals.add(i); if ('$*'.includes(c)) boxes.push(i); if ('@+'.includes(c)) player = i; }));
    const reachable = (from, crates) => { const seen = new Set([from]), q = [from]; for (let head = 0; head < q.length; head++) for (const d of [-1, 1, -width, width]) { const i = q[head] + d; if (floor.has(i) && !crates.includes(i) && !seen.has(i)) { seen.add(i); q.push(i); } } return seen; };
    const code = (crates, from) => `${[...crates].sort((a, b) => a - b)}|${Math.min(...reachable(from, crates))}`, first = { boxes, player, pushes: 0 }, q = [first], seen = new Set([code(boxes, player)]);
    for (let head = 0; head < q.length; head++) {
        const state = q[head]; if (state.boxes.every((i) => goals.has(i))) return state.pushes;
        const walk = reachable(state.player, state.boxes);
        for (const box of state.boxes) for (const d of [-1, 1, -width, width]) {
            if (!walk.has(box - d) || !floor.has(box + d) || state.boxes.includes(box + d)) continue;
            const crates = state.boxes.map((i) => i === box ? box + d : i), key = code(crates, box);
            if (!seen.has(key)) { seen.add(key); q.push({ boxes: crates, player: box, pushes: state.pushes + 1 }); }
        }
    }
    return null;
};
const keyFor = { U: 'ArrowUp', D: 'ArrowDown', L: 'ArrowLeft', R: 'ArrowRight' };
for (let level = 0; level < sokobanLevels.length; level++) {
    const puzzle = sokobanLevels[level], layout = parseSokoban(puzzle.map), rows = puzzle.map.split('/');
    check(rows[0].split('').every((c) => c === '#') && rows.at(-1).split('').every((c) => c === '#') && rows.every((row) => row.startsWith('#') && row.endsWith('#')), `Warehouse ${level + 1} has closed boundaries`);
    check(minimumPushes(puzzle.map) === puzzle.par, `Warehouse ${level + 1} minimum pushes match an independent breadth-first solver`);
    check(rows.every((row) => row.length === layout.columns), `Warehouse ${level + 1} is rectangular`);
    check(layout.goals.size === layout.boxes.length && layout.goals.size > 0, `Warehouse ${level + 1} has one target per box`);
    const t = mount('sokoban', { mode: `stage-${level}` });
    for (const move of solutions[level]) { key(keyFor[move]); advance(.12); }
    advance(.3);
    check(t.state.results.length === 1, `Warehouse ${level + 1} completes through keyboard input`);
    check(t.state.results[0].score === puzzle.par && t.state.results[0].tieScore === solutions[level].length, `Warehouse ${level + 1} records certified pushes and exact moves`);
    check(!t.state.results[0].practice, 'Sokoban remains ranked without a separate assisted mode'); t.destroy();
}
let t = mount('sokoban');
const playerPosition = () => t.root.all((e) => e.classList.contains('warehouse-player'))[0].style.transform;
const originalPlayer = playerPosition(); key('ArrowLeft'); key('ArrowUp'); advance(.3);
check(t.state.hud[2][1] === 2, 'One rapid direction input is buffered behind the current movement'); key('KeyZ'); advance(.12); key('KeyZ');
check(playerPosition() === originalPlayer && t.state.hud[2][1] === 0 && !t.s.practice, 'Sokoban undo restores position, counters and ranked eligibility'); t.destroy();
t = mount('sokoban');
for (const code of ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowLeft']) { key(code); advance(.12); }
check(t.root.all((e) => e.classList.contains('corner-warning')).length === 1 && t.state.message.includes('모서리'), 'An off-target corner gives a recoverable warning');
key('KeyZ'); check(t.root.all((e) => e.classList.contains('corner-warning')).length === 0, 'Undo removes the deadlock warning'); t.destroy();
t = mount('sokoban'); t.click(26); advance(.14); const walkingPosition = playerPosition(); t.s.pause(true); advance(1); t.s.pause(false); advance(.5);
check(playerPosition() === walkingPosition, 'Pause cancels automatic walking without a delayed extra step'); t.destroy();
t = mount('sokoban');
for (let n = 0; n < 1502; n++) { key(n % 2 ? 'ArrowRight' : 'ArrowLeft'); advance(.12); }
for (let n = 0; n < 1502; n++) key('KeyZ');
check(t.state.hud[2][1] === 0 && t.state.hud[1][1] === 0 && !t.s.practice, 'Sokoban undo has no history cap or record penalty'); t.destroy();
const tiny = parseSokoban('#####/#@$$#/#..-#/#####');
check(sokobanStep(tiny, { player: tiny.player, boxes: tiny.boxes, moves: 0, pushes: 0 }, tiny.player + 1) === null, 'Sokoban cannot push two boxes');
check(sokobanWalk(tiny, { player: tiny.player, boxes: tiny.boxes }, tiny.player + 2).length === 0, 'Automatic walking never walks through a box');

assert.deepEqual([...sameGroup([1, 1, 2, 3, 2, 2, 3, 4, 4], 3, 2)].sort(), [2, 4, 5]); check(true, 'SameGame groups use edge adjacency');
assert.deepEqual(collapseSame([1, 2, 3, 1, 2, 3], 3, [0, 3]).board, [2, 3, 0, 2, 3, 0]); check(true, 'Empty columns collapse toward the left after gravity');
const originalBoard = [1, 2, 3, 1, 2, 3], collapsed = collapseSame(originalBoard, 3, [4]);
check(originalBoard.join() === '1,2,3,1,2,3' && new Set(collapsed.moves.map((m) => m.to)).size === 5, 'Collapse preserves the input and maps every survivor once');
const readSame = (sample, columns, rows) => {
    const b = Array(columns * rows).fill(0), symbols = ['●', '◆', '▲', '■', '✦'];
    sample.cells().forEach((cell) => { b[Number(cell.dataset.index)] = symbols.indexOf(cell.textContent) + 1; }); return b;
};
t = mount('samegame', { mode: 'easy', seed: 11 }); key('ArrowRight');
check(Number(document.activeElement.dataset.index) === 1, 'SameGame arrows work directly after entering the game');
const keyboardTile = t.cells().find((cell) => Number(cell.dataset.index) === 21); keyboardTile.parent.emit('focusin', { target: keyboardTile }); key('Enter');
check(String(t.state.hud[2][1]).includes(`${sameGroup(readSame(t, 10, 8), 10, 21).length}개`), 'Native focus and Enter select the same visible group'); t.destroy();
t = mount('samegame', { mode: 'easy', seed: 11 }); let sameBefore = readSame(t, 10, 8), group = sameGroup(sameBefore, 10, 21);
t.click(21); check(String(t.state.hud[2][1]).includes(`${group.length}개`), 'Selecting a group previews its size and exact points');
t.click(21); t.s.pause(true); const tileCount = t.cells().length; advance(1);
check(t.cells().length === tileCount, 'Paused removal cannot collapse or score an extra turn'); t.s.pause(false); advance(.6);
check(t.cells().length === 80 - group.length && t.state.hud[0][1] === (group.length - 1) ** 2, 'Removal, gravity and points commit exactly once');
check(t.cells().filter((cell) => cell.tabIndex === 0).length === 1, 'Collapsed board retains one keyboard entry');
key('KeyZ'); assert.deepEqual(readSame(t, 10, 8), sameBefore); check(t.state.hud[0][1] === 0 && t.s.practice, 'SameGame undo restores the board and score as practice'); t.destroy();
t = mount('samegame', { mode: 'easy', seed: 11 }); let expectedScore = 1000;
for (const index of [21, 33, 51, 47, 30, 57, 64, 64, 64, 73, 70, 70]) {
    const b = readSame(t, 10, 8); expectedScore += (sameGroup(b, 10, index).length - 1) ** 2; const cell = t.cells().find((e) => Number(e.dataset.index) === index);
    cell.parent.emit('click', { target: cell }); cell.parent.emit('click', { target: cell }); advance(.6);
}
check(t.state.results.length === 1 && t.state.results[0].win && t.state.results[0].score === expectedScore, 'A complete clear awards the 1,000-point bonus once'); t.destroy();

check(raceMoves([], 40, 31).includes(22) && !raceMoves([], 40, 31).includes(30), 'A clear forward jump excludes diagonal alternatives');
const blockedJump = [{ x: 3, y: 2, dir: 'h' }];
check(raceMoves(blockedJump, 40, 31).includes(30) && raceMoves(blockedJump, 40, 31).includes(32) && !raceMoves(blockedJump, 40, 31).includes(22), 'Blocked jump allows both legal side steps');
check(raceMoves([], 13, 4).includes(3) && raceMoves([], 13, 4).includes(5), 'Board edge has the same jump behavior as a wall');
check(raceBlocked([{ x: 3, y: 7, dir: 'h' }], 76, 67), 'Horizontal wall blocks both covered lanes');
check(!!raceWallError([{ x: 3, y: 3, dir: 'h' }], { x: 4, y: 3, dir: 'h' }, [76, 4]), 'Partly overlapping walls are rejected');
check(!!raceWallError([{ x: 3, y: 3, dir: 'h' }], { x: 3, y: 3, dir: 'v' }, [76, 4]), 'Crossing walls are rejected');
const barrier = [{ x: 0, y: 0, dir: 'h' }, { x: 2, y: 0, dir: 'h' }];
check(raceWallError(barrier, { x: 3, y: 0, dir: 'v' }, [22, 2], 5).includes('길'), 'A non-overlapping wall that seals a goal route is still rejected');
const rng = seededRandom(9103); let validWalls = [];
for (let n = 0; n < 180; n++) {
    const wall = { x: Math.floor(rng() * 8), y: Math.floor(rng() * 8), dir: rng() < .5 ? 'h' : 'v' };
    if (!raceWallError(validWalls, wall, [76, 4])) { validWalls.push(wall); check(racePath(validWalls, 76, 0).length > 0 && racePath(validWalls, 4, 8).length > 0, 'Every accepted fence sequence preserves both goal routes'); }
}
t = mount('wall-race'); key('ArrowUp'); key('Enter'); advance(.18); key('ArrowDown'); key('Enter'); advance(.18); key('KeyH'); key('Enter'); advance(.18);
check(t.root.all((e) => e.classList.contains('race-wall') && !e.classList.contains('wall-preview')).length === 1 && String(t.state.hud[0][1]).includes('9'), 'Keyboard fence placement consumes one wall and changes turn');
key('KeyZ'); check(t.root.all((e) => e.classList.contains('race-wall') && !e.classList.contains('wall-preview')).length === 0 && String(t.state.hud[0][1]).includes('10'), 'Undo restores the fence, stock and player turn'); t.destroy();
t = mount('wall-race');
for (let n = 0; n < 30 && !t.state.results.length; n++) {
    const legal = t.cells().filter((cell) => cell.classList.contains('race-legal')).map((cell) => Number(cell.dataset.index)); if (!legal.length) { advance(.3); break; }
    const turn = t.state.hud[1][1], i = legal.sort((a, b) => turn === 'P1' ? a - b : b - a)[0]; t.click(i); advance(.2);
}
check(t.state.results.length === 1 && t.state.results[0].winner === 2, 'A complete two-player race reaches the correct goal and finishes once'); t.destroy();

const hit = sweepBox({ x: 100, y: 100 }, { x: 250, y: 0 }, { x: 200, y: 0, w: 20, h: 400 }, 3);
check(Math.abs(hit.t - 97 / 250) < 1e-9 && hit.nx === -1, 'Swept bullet contact uses the leading radius');
const reflected = traceRicochet({ x: 100, y: 100, vx: 500, vy: 0 }, .5, [{ x: 200, y: 0, w: 20, h: 400 }]);
check(reflected.vx === -500 && reflected.bounces === 1 && Math.abs(reflected.x - 43.98) < 1e-8 && reflected.segments.length === 2, 'Reflection consumes the remaining time after wall contact');
const corner = traceRicochet({ x: 100, y: 100, vx: 500, vy: 500 }, .3, [{ x: 200, y: 0, w: 20, h: 400 }, { x: 0, y: 200, w: 400, h: 20 }]);
check(corner.vx === -500 && corner.vy === -500 && corner.bounces === 1, 'Simultaneous corner contact reflects both axes once');
check(Math.abs(sweepCircle({ x: -100, y: 0 }, { x: 100, y: 0 }, 21) - .395) < 1e-9 && sweepCircle({ x: -100, y: 22 }, { x: 100, y: 22 }, 21) === null, 'Swept tank collision distinguishes crossing from a near miss');
const boundary = [{ x: 0, y: 0, w: 600, h: 14 }, { x: 0, y: 426, w: 600, h: 14 }, { x: 0, y: 14, w: 14, h: 412 }, { x: 586, y: 14, w: 14, h: 412 }];
for (const arena of Object.values(tankArenas)) {
    let bullet = { x: 66, y: 220, vx: 631, vy: 418 }; const energy = bullet.vx ** 2 + bullet.vy ** 2;
    for (let n = 0; n < 200; n++) { bullet = traceRicochet(bullet, .06, [...boundary, ...arena]); check(bullet.x >= 17 - 1e-7 && bullet.x <= 583 + 1e-7 && bullet.y >= 17 - 1e-7 && bullet.y <= 423 + 1e-7 && bullet.vx ** 2 + bullet.vy ** 2 === energy, 'Long ricochet simulation remains inside the arena with constant speed'); }
}
t = mount('tanks', { mode: 'open' }); advance(1.1); win.emit('keydown', { code: 'KeyW' }); advance(.35); win.emit('keyup', { code: 'KeyW' }); advance(.3); win.emit('keydown', { code: 'KeyD' }); advance(.35); win.emit('keyup', { code: 'KeyD' });
for (let n = 0; n < 3; n++) { key('Space'); advance(.31); }
check(String(t.state.hud[0][1]).includes('재장전'), 'Empty magazine triggers automatic reload');
t.s.pause(true); const ammunition = t.state.hud[0][1]; advance(2); check(t.state.hud[0][1] === ammunition, 'Pause freezes reload and bullets'); t.s.pause(false); advance(1.3);
check(String(t.state.hud[0][1]).includes('●●●'), 'Reload restores all three rounds'); t.destroy();
t = mount('tanks', { mode: 'open' }); advance(1.1); key('Space'); key('Enter'); advance(3);
check(t.s.waiting && String(t.state.hud[0][1]).startsWith('0승') && String(t.state.hud[2][1]).startsWith('0승'), 'Simultaneous projectiles award a drawn round'); t.destroy();
t = mount('tanks', { mode: 'open' });
for (let round = 0; round < 3; round++) { if (t.s.waiting) t.s.begin(); advance(1.1); key('Space'); advance(3); }
check(t.state.results.length === 1 && t.state.results[0].winner === 1 && String(t.state.hud[0][1]).startsWith('3승'), 'Three actual projectile victories finish the match for P1'); t.destroy();
t = mount('tanks', { mode: 'open' }); advance(1.1); win.emit('keydown', { code: 'KeyW' }); advance(.35); win.emit('keyup', { code: 'KeyW' }); advance(.3); key('Space'); advance(2);
check(t.s.waiting && String(t.state.hud[2][1]).startsWith('1승'), 'A reflected own projectile can lose the round'); t.destroy();
t = mount('tanks', { mode: 'open' }); advance(1.1); win.emit('keydown', { code: 'KeyW' }); advance(2); win.emit('keyup', { code: 'KeyW' }); key('Space');
check(String(t.state.hud[0][1]).includes('●●●') && t.state.message.includes('포구'), 'Blocked muzzle cannot spawn a projectile through a wall'); t.destroy();

let referencePosition;
for (const fps of [60, 30, 15, 10]) {
    t = mount('tanks', { mode: 'open' }); const poses = [], canvas = t.root.children.find((e) => e.tagName === 'CANVAS');
    canvas.paint = (name, args) => { if (name === 'translate') { poses.push(args.slice(0, 2)); if (poses.length > 2) poses.shift(); } };
    tick(); win.emit('keydown', { code: 'KeyW' }); for (let n = 0; n < fps * 2; n++) tick(1 / fps); win.emit('keyup', { code: 'KeyW' });
    if (!referencePosition) referencePosition = poses[0];
    check(Math.abs(poses[0][0] - referencePosition[0]) < 1e-7 && Math.abs(poses[0][1] - referencePosition[1]) < 1e-7 && Math.abs(t.s.elapsed() - 2) < 1e-7, `${fps}fps preserves tank acceleration, travel and active time`); t.destroy();
}

const previousBody = document.body; document.body = new Element('body'); document.body.classList.add('reduce-motion');
t = mount('samegame', { mode: 'easy', seed: 11 }); t.click(21); t.click(21); tick();
check(t.cells().length < 80 && !t.controls.children[2].disabled, 'Reduced motion skips removal and settling waits'); t.destroy();
t = mount('sokoban'); key('ArrowRight'); tick(); check(t.state.results.length === 1, 'Reduced motion completes Sokoban without an animation wait'); t.destroy();
document.body = previousBody;

// The real app owns progress namespaces, ranking ties and result focus.
let persisted = { completed: { 'puzzle-0': 'clean', 'sokoban:stage-0': 'invalid' }, records: { 'merge:v3:classic': { plays: 1, best: 100, bestTie: -1, bestText: 'invalid tie' } }, sound: false }, appCase = 0;
const appFinish = async (id, result) => {
    const elements = new Map(), filters = ['all', '1', '2', 'new', 'favorite'].map((value) => { const item = new Element('button'); item.dataset.player = value; return item; });
    const element = (name) => { if (!elements.has(name)) { const item = new Element(name === 'game-search' ? 'input' : 'div'); item.value = ''; elements.set(name, item); } return elements.get(name); };
    const doc = new Element('document'); doc.body = new Element('body'); doc.activeElement = doc.body; doc.createElement = (tag) => new Element(tag); doc.getElementById = element; doc.querySelectorAll = () => filters; doc.querySelector = (selector) => selector === '[data-player="favorite"]' ? filters[4] : null;
    globalThis.document = doc; globalThis.window = new Element('window'); window.scrollTo = () => {}; globalThis.location = { hash: `#${id}`, protocol: 'http:' };
    globalThis.localStorage = { getItem: () => JSON.stringify(persisted), setItem: (_, value) => { persisted = JSON.parse(value); } };
    const game = games.find((g) => g.id === id), original = game.create; let active;
    game.create = (s) => { active = s; s.on(s.root, 'test-finish', () => s.finish(result)); };
    try { await import(`../js/app.js?new-games=${appCase++}`); element('game-root').emit('test-finish'); } finally { game.create = original; }
    active.destroy(); return { element, doc, filters };
};
let app = await appFinish('sokoban', { score: 1, tieScore: 1, recordText: '1회 밀기 · 1회 이동', title: '완료' });
check(persisted.completed['sokoban:stage-0'] === 'clean' && persisted.completed['puzzle-0'] === 'clean', 'Sokoban progress has its own namespace and preserves Nonogram progress');
check(!app.element('overlay-next').hidden && app.doc.activeElement === app.element('overlay-next'), 'Sokoban completion focuses the next unfinished stage');
check(app.element('game-mode').children[0].textContent.startsWith('✓'), 'Completed Sokoban stage receives its completion mark');
app.filters[3].emit('click'); check(app.element('game-grid').children.length === 4, 'New-game filter contains exactly the four additions');
await appFinish('merge', { score: 100, tieScore: 40, recordText: 'A' });
await appFinish('merge', { score: 100, tieScore: 30, recordText: 'B' });
await appFinish('merge', { score: 100, tieScore: 50, recordText: 'C' });
check(persisted.records['merge:v3:classic'].bestText === 'B' && persisted.records['merge:v3:classic'].bestTie === 30, 'Equal primary scores prefer the lower secondary move count');
console.log(`PASS: ${counts().assertions} new-game rule / input / completion conditions`);

