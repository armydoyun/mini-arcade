import assert from 'node:assert/strict';
import { games } from '../js/catalog.js';
import { duoLevels, golfCourses, sokobanLevels } from '../js/puzzles.js';
import { captureTerritory, bubblePosition, bubbleNeighbors, bubbleResolve, bubbleTrace, golfStep, parseDuo, duoDoors, duoStep, gridNeighbors, parseSokoban, sokobanStep } from '../js/rules.js';
import { bubbleDescend } from '../js/games/bubbles.js';
import { tankShotStep } from '../js/games/tanks.js';
import { Element, win, tick, advance, key, mount, check, counts } from './harness.mjs';

let t = mount('tanks'); win.emit('keydown', { code: 'KeyD' }); t.s.pause(true); t.s.pause(false); win.emit('keydown', { code: 'KeyD', repeat: true }); check(!t.s.down('KeyD'), 'Auto-repeat cannot revive a key released by pause'); win.emit('keydown', { code: 'KeyD' }); check(t.s.down('KeyD'), 'Fresh keydown resumes normal control'); t.destroy();
const warehouseIndex = sokobanLevels.findIndex((p) => { const l = parseSokoban(p.map); return l.boxes.length > 1 && gridNeighbors(l.player, l.columns, l.rows * l.columns).some((to) => l.floor.has(to) && !l.boxes.includes(to)); });
t = mount('sokoban', { mode: `stage-${warehouseIndex}` });
const warehouse = parseSokoban(sokobanLevels[warehouseIndex].map), initial = { player: warehouse.player, boxes: warehouse.boxes, moves: 0, pushes: 0 }, nextWalk = gridNeighbors(initial.player, warehouse.columns, warehouse.rows * warehouse.columns).find((to) => !initial.boxes.includes(to) && sokobanStep(warehouse, initial, to));
const walkCode = { [-1]: 'ArrowLeft', [1]: 'ArrowRight', [-warehouse.columns]: 'ArrowUp', [warehouse.columns]: 'ArrowDown' }[nextWalk - initial.player];
win.emit('keydown', { code: walkCode }); advance(.15); key('KeyZ'); win.emit('keydown', { code: walkCode, repeat: true }); advance(.5); check(t.state.hud[2][1] === 0 && !t.s.down(walkCode), 'Sokoban undo cancels held and buffered walking'); t.destroy();
const expired = tankShotStep({ x: 20, y: 20, vx: 100, vy: 0, age: 4.49, bounces: 0 }, 1 / 60, []);
check(expired.expired && Math.abs(expired.x - 21) < 1e-8 && Math.abs(expired.segments.at(-1).t1 - .6) < 1e-8, 'Tank collision path ends exactly at the lifetime boundary within a frame');
const bounced = tankShotStep({ x: 10, y: 20, vx: 1000, vy: 0, age: 0, bounces: 5 }, .05, [{ x: 30, y: 0, w: 10, h: 40 }]);
check(bounced.expired && bounced.segments.every((part) => part.bounces <= 5) && bounced.segments.length === 1, 'A sixth reflection cannot produce a later hit on a player');

const field = Array.from({ length: 49 }, (_, i) => i < 7 || i >= 42 || i % 7 === 0 || i % 7 === 6 ? 1 : 0), cut = [10, 17, 24, 31, 38];
const claimed = captureTerritory(field, 7, cut, [16]);
check(claimed[25] === 1 && claimed[16] === 0 && cut.every((i) => claimed[i]), 'A closed cut claims only the component without a hazard');
const divided = captureTerritory(field, 7, cut, [16, 25]); check(divided[16] === 0 && divided[25] === 0, 'Hazards on both sides preserve both components'); assert.deepEqual(field, Array.from({ length: 49 }, (_, i) => i < 7 || i >= 42 || i % 7 === 0 || i % 7 === 6 ? 1 : 0));
t = mount('territory', { seed: 4 });
for (let life = 0; life < 3; life++) { key('Space'); key('ArrowDown'); advance(.13); key('ArrowDown'); advance(.13); key('ArrowUp'); advance(.13); }
advance(.3); check(t.state.results.length === 1 && t.state.results[0].win === false, 'Three actual trail self-collisions consume three lives and finish once'); t.destroy();
t = mount('territory', { mode: 'calm', seed: 2 }); const territoryCanvas = t.root.querySelector('canvas'); let territory = [], pawn = 15;
territoryCanvas.paint = (name, a, style) => { if (name === 'fillRect' && a[0] === 0 && a[1] === 0) territory = Array(720).fill(0); if (name === 'fillRect' && style.fillStyle === '#b9f86b17') territory[Math.round(a[1]/18)*30 + Math.round(a[0]/18)] = 1; if (name === 'arc' && a[2] === 5.5) pawn = Math.floor(a[1]/18)*30 + Math.floor(a[0]/18); }; tick();
const cutKey = (code) => { key(code); advance(.13); };
for (const x of [15,8,22,4,11,18,25,2,6,10,14,18,22,26]) {
    if (t.s.over) break; if (String(t.state.hud[1][1]).startsWith('ON')) cutKey('Space');
    const queue = [pawn], previous = new Map([[pawn,null]]);
    for (let head = 0; head < queue.length && !previous.has(x); head++) for (const at of gridNeighbors(queue[head],30,720)) if (territory[at] && !previous.has(at)) { previous.set(at,queue[head]); queue.push(at); }
    check(previous.has(x), 'Captured area remains connected to the original boundary'); const path = [];
    for (let at=x; at !== pawn; at=previous.get(at)) path.unshift(at);
    for (const at of path) { cutKey({[-1]:'ArrowLeft',[1]:'ArrowRight',[-30]:'ArrowUp',[30]:'ArrowDown'}[at-pawn]); if (t.s.over) break; }
    if (t.s.over) break; const lives = t.state.hud[2][1];
    for (let n=0; n<24 && Math.floor(pawn/30)<23 && !t.s.over; n++) { if (!String(t.state.hud[1][1]).startsWith('ON')) cutKey('Space'); cutKey('ArrowDown'); if (t.state.hud[2][1] !== lives) break; }
}
advance(.3); check(t.state.results.length === 1 && t.state.results[0].win !== false && parseFloat(t.state.hud[0][1]) >= 70 && t.state.results[0].score > 0, 'A full territory match reaches the target through real cuts and survives hazard collisions'); t.destroy();

for (const phase of [0, 1]) {
    for (const i of [0, 1, 11, 12, 37, 83, 167]) {
        const p = bubblePosition(i, phase);
        check(bubbleNeighbors(i, phase).every((j) => { const q = bubblePosition(j, phase); return Math.abs(Math.hypot(p.x - q.x, p.y - q.y) - 36) < 1e-8 && bubbleNeighbors(j, phase).includes(i); }), `Hex adjacency matches drawn positions at ${i}/${phase}`);
    }
    const board = Array(168).fill(0); board[4] = 1; board[16] = 1; board[28] = 2;
    const popped = bubbleResolve(board, bubbleNeighbors(16, phase).find((i) => i > 11 && !board[i] && i !== 28), 1, phase);
    check(popped.popped.length === 3 && popped.dropped.includes(28) && !popped.board.some(Boolean), 'A three-color match drops the disconnected branch');
    check(bubbleResolve(board, 4, 2, phase) === null, 'Attachment never overwrites an occupied bubble');
    const descent = bubbleDescend(board, phase, Array(12).fill(3));
    check([4, 16, 28].every((i) => Math.abs(bubblePosition(i, phase).x - bubblePosition(i + 12, descent.phase).x) < 1e-9), 'Ceiling descent preserves x by flipping row parity');
    const shot = { x: 260, y: 548, vx: Math.cos(-2.8), vy: Math.sin(-2.8) }, forecast = bubbleTrace(shot, 3000, board, phase); let live = shot;
    for (let n = 0; n < 300 && !live.contact; n++) live = bubbleTrace(live, 850 / 60, board, phase);
    check(forecast.contact && live.contact && forecast.slot === live.slot && Math.hypot(forecast.x - live.x, forecast.y - live.y) < 1e-7, 'Preview and incremental projectile agree after wall reflections');
}

// Read the native canvas calls to drive a complete match through pointer inputs.
const bubbleColors = ['#ff8e7a', '#82b6ff', '#b9f86b', '#f5d47d', '#c1a0ff'];
t = mount('bubbles', { mode: 'easy', seed: 28 }); const bubbleCanvas = t.root.querySelector('canvas'); let orbs = [];
bubbleCanvas.paint = (name, a, style) => { if (name === 'fillRect' && a[0] === 0 && a[1] === 0) orbs = []; if (name === 'arc' && a[2] === 17 && bubbleColors.includes(style.fillStyle)) orbs.push({ x: a[0], y: a[1], color: bubbleColors.indexOf(style.fillStyle) + 1 }); }; tick();
key('KeyX'); const swapped = t.controls.children[0].disabled; key('KeyX'); check(swapped && t.controls.children[0].disabled, 'Queue swap is available once per turn');
let bubbleTurns = 0;
while (!t.s.over && bubbleTurns++ < 110) {
    const placed = orbs.filter((p) => p.y < 465), chamber = Array(168).fill(0), first = placed[0]; if (!first) break;
    const row = Math.round((first.y - 42) / (Math.sqrt(3) * 18)), phase = ((Math.round((first.x - 53) / 18) - row) % 2 + 2) % 2;
    placed.forEach((p) => { const y = Math.round((p.y - 42) / (Math.sqrt(3) * 18)), x = Math.round((p.x - 53 - ((y + phase) % 2) * 18) / 36); if (y >= 0 && y < 14 && x >= 0 && x < 12) chamber[y * 12 + x] = p.color; });
    const color = orbs.find((p) => p.y === 548)?.color; let best = null;
    for (let n = 0; n <= 96; n++) {
        const a = -Math.PI + .23 + n * (Math.PI - .46) / 96, trace = bubbleTrace({ x: 260, y: 548, vx: Math.cos(a), vy: Math.sin(a) }, 3000, chamber, phase); if (trace.slot < 0) continue;
        const result = bubbleResolve(chamber, trace.slot, color, phase), friends = bubbleNeighbors(trace.slot, phase).filter((i) => chamber[i] === color).length, value = result.popped.length * 10 + result.dropped.length * 25 + friends * 3 - Math.floor(trace.slot / 12) * .12;
        if (!best || value > best.value) best = { angle: a, value };
    }
    check(!!best, 'Bubble board always provides a legal aimed attachment before danger');
    const length = Math.min(250 / Math.max(.001, Math.abs(Math.cos(best.angle))), 480 / -Math.sin(best.angle));
    bubbleCanvas.emit('pointerdown', { button: 0, clientX: 260 + Math.cos(best.angle) * length, clientY: 548 + Math.sin(best.angle) * length });
    for (let n = 0; n < 260 && !t.s.over && t.controls.children[0].disabled; n++) tick(); advance(.8);
}
advance(.4); check(t.state.results.length === 1 && t.state.results[0].win !== false && t.state.results[0].score > 0, 'A seeded bubble match clears completely through actual aimed shots'); console.log(`Bubble match: ${bubbleTurns} shots`); t.destroy();
t = mount('bubbles', { mode:'hard', seed:28 });
for (let n=0; n<90 && !t.s.over; n++) { key('Space'); advance(3.6); }
advance(.3); check(t.state.results.length===1 && t.state.results[0].win===false, 'Repeated poor shots trigger ceiling descent and one danger-line loss'); t.destroy();

const solveDuo = (level) => {
    const start = { players: level.players, bits: 0, moves: 0 }, code = (s) => (s.players[0] * level.tiles.length + s.players[1]) * 4 + s.bits, queue = [start], seen = new Map([[code(start), null]]);
    for (let head = 0; head < queue.length; head++) {
        const state = queue[head];
        if (state.players.every((at, p) => at === level.exits[p])) { const route = []; for (let at = code(state); seen.get(at);) { const [previous, player, to] = seen.get(at); route.unshift([player, to]); at = previous; } return route; }
        for (let p = 0; p < 2; p++) for (const to of gridNeighbors(state.players[p], level.columns, level.tiles.length)) { const intents = [null, null]; intents[p] = to; const next = duoStep(level, state, intents); if (next && !seen.has(code(next))) { seen.set(code(next), [code(state), p, to]); queue.push(next); } }
    }
    return null;
};
const duel = parseDuo('########/#A..r.X#/#B..u.Y#/########'), state = { players: duel.players, bits: 0, moves: 0 };
check(duoStep(duel, state, [state.players[1], state.players[0]])?.moves === 2, 'Simultaneous player swaps are allowed without input-order bias');
const beside = { players: [9, 11], bits: 0, moves: 0 }; check(duoStep(duel, beside, [10, 10]) === null, 'Simultaneous entry into the same tile cancels both');
check(duoStep(duel, { ...state, players: [11, 19] }, [null, 20])?.players[1] === 20 && duoStep(duel, { ...state, players: [11, 12] }, [12, null]) === null, 'Players cannot enter an occupied stationary tile');
check(duoStep(duel, { ...state, players:[19,11] }, [20,null])===null && duoStep(duel, { ...state, players:[19,11] }, [null,12])===null, 'Each colored floor rejects the other player');
const doorLevel = parseDuo(duoLevels[1].map), doorAt = doorLevel.tiles.indexOf('I');
check(!duoDoors(doorLevel, { players: doorLevel.players, bits: 0 })[0] && duoDoors(doorLevel, { players: [doorAt, doorLevel.players[1]], bits: 0 })[0], 'An occupied door stays open until the player leaves');
t = mount('switch-duo'); key('KeyD'); key('ArrowRight'); advance(.13); check(t.state.hud[1][1]===2, 'Both players move within the same input tick'); key('KeyZ'); check(t.state.hud[1][1]===0, 'One undo restores a simultaneous move for both players'); t.destroy();
for (let i = 0; i < duoLevels.length; i++) {
    const level = parseDuo(duoLevels[i].map), route = solveDuo(level); check(!!route && route.length > 0, `Cooperative stage ${i + 1} has a certified route`); t = mount('switch-duo', { mode: `stage-${i}` }); let positions = [...level.players];
    for (let n = 0; n < route.length; n++) {
        const [p, to] = route[n];
        if (n % 2) { key(`Digit${p + 1}`); t.click(to); } else { const d = to - positions[p], code = (p ? { [-level.columns]: 'ArrowUp', [level.columns]: 'ArrowDown', [-1]: 'ArrowLeft', [1]: 'ArrowRight' } : { [-level.columns]: 'KeyW', [level.columns]: 'KeyS', [-1]: 'KeyA', [1]: 'KeyD' })[d]; key(code); }
        positions[p] = to; advance(.13);
        if (n === 2) { const savedHud = structuredClone(t.state.hud); key('KeyZ'); advance(.13); key(`Digit${p + 1}`); t.click(to); advance(.13); assert.deepEqual(t.state.hud.slice(0, 3), savedHud.slice(0, 3)); check(true, 'Cooperative undo restores and replays the same joint state'); }
    }
    advance(.3); check(t.state.results.length === 1 && t.state.results[0].score === route.length && t.state.results[0].recordKey === `stage-${i}` && !t.state.results[0].practice, `Stage ${i + 1} completes using mixed native keyboard and pointer inputs`); t.destroy();
}

// These are successful shot certificates, not a claim about the fewest possible strokes.
const golfRoutes = [[[0,500]], [[0,580]], [[Math.PI*1.875,580]], [[Math.PI*1.875,580]], [[Math.PI*41/24,610],[Math.PI*5/3,610]], [[0,500]], [[0,580]], [[Math.PI*3/8,610],[Math.PI*39/24,610],[Math.PI*22/24,340]], [[0,580]]];
const playGolf = (mode, fps = 60) => {
    t = mount('golf', { mode }); const canvas = t.root.querySelector('canvas'), strokes = [], players = mode === 'duel' ? 2 : 1; let shotCount = 0;
    for (let h = 0; h < golfCourses.length; h++) {
        if (t.s.waiting) t.s.begin(); const at = Array.from({ length: players }, () => [...golfCourses[h].start]), steps = Array(players).fill(0);
        for (let turn = h % players; !t.s.waiting && !t.s.over;) {
            const [angle, force] = golfRoutes[h][steps[turn]++], [x, y] = at[turn]; let b = { x, y, vx: Math.cos(angle)*force, vy: Math.sin(angle)*force };
            for (let n = 0; n < 600 && (n === 0 || b.status === 'moving'); n++) b = golfStep(b, 1 / fps, golfCourses[h]); at[turn] = b.status === 'hole' ? golfCourses[h].hole : [b.x, b.y];
            canvas.emit('pointerdown', { pointerId: 1, button: 0, clientX: x, clientY: y }); canvas.emit('pointermove', { pointerId: 1, clientX: x - Math.cos(angle) * force / 620 * 120, clientY: y - Math.sin(angle) * force / 620 * 120 }); canvas.emit('pointerup', { pointerId: 1 });
            for (let n = 0; n < fps * 10 && !t.s.waiting && !t.s.over && t.controls.children[0].disabled; n++) tick(1 / fps);
            shotCount++; check(shotCount < 40, 'Golf rounds cannot hang or duplicate a stroke');
            if (players === 2 && !t.s.waiting && !t.s.over) turn = Number(String(t.state.hud[1][0]).slice(1, 2)) - 1;
        }
        strokes.push(...steps); check(steps.every((n) => n === golfRoutes[h].length), `Course ${h + 1} completes with its shot certificate in ${mode}`);
    }
    advance(.4); check(t.state.results.length === 1 && (players === 1 ? t.state.results[0].score === 12 : t.state.results[0].winner === 0), `Full 9-hole ${mode} round records the correct total and result`); t.destroy();
};
playGolf('solo'); playGolf('duel', 30);
for (const fps of [60, 30, 15, 10]) {
    let b = { x: 70, y: 70, vx: 300, vy: 120 }; const c = { walls: [], water: [], hole: [550,350] };
    for (let n = 0; n < fps * 1.2; n++) b = golfStep(b, 1 / fps, c);
    const decay = Math.exp(-1.2 * 1.2); check(Math.abs(b.x - (70 + 300 * (1-decay)/1.2)) < 1e-7 && Math.abs(b.y - (70 + 120 * (1-decay)/1.2)) < 1e-7, `Golf drag integration preserves travel at ${fps} fps`);
}
t = mount('golf'); const golfCanvas = t.root.querySelector('canvas'); golfCanvas.emit('pointerdown', { button: 0, pointerId: 1, clientX: 90, clientY: 200 }); golfCanvas.emit('pointermove', { pointerId: 1, clientX: 20, clientY: 200 }); golfCanvas.emit('pointercancel', { pointerId: 1 }); golfCanvas.emit('pointerup', { pointerId: 1 }); check(t.state.hud[1][1].startsWith('0타'), 'Cancelled drag never fires a shot');
for (let n = 0; n < 2; n++) { t.controls.children[0].emit('click'); t.s.begin(); } const origin = golfCourses[2].start; golfCanvas.emit('pointerdown', { button: 0, pointerId: 2, clientX: origin[0], clientY: origin[1] }); golfCanvas.emit('pointermove', { pointerId: 2, clientX: origin[0]-80, clientY: origin[1]-45 }); golfCanvas.emit('pointerup', { pointerId: 2 }); advance(4); check(t.state.hud[1][1].startsWith('2타'), 'A water landing adds exactly one penalty stroke'); t.destroy();

// Mode-specific records, filters and dirty navigation use the real application shell.
let appCase = 0;
const app = async (mode, winner, id = 'golf') => {
    const elements = new Map(), filters = ['all','1','2','new','favorite'].map((value) => { const el = new Element('button'); el.dataset.player = value; return el; }), el = (id) => { if (!elements.has(id)) { const e = new Element(id === 'game-search' ? 'input' : 'div'); e.value = ''; elements.set(id,e); } return elements.get(id); };
    const saved = { sound:false, modes:{ [id]:mode }, records:{} }, doc = new Element('document'); doc.body = new Element('body'); doc.activeElement = doc.body; doc.createElement = (tag) => new Element(tag); doc.getElementById = el; doc.querySelectorAll = () => filters; doc.querySelector = (selector) => selector === '[data-player="favorite"]' ? filters[4] : null;
    globalThis.document = doc; globalThis.window = new Element('window'); window.scrollTo = () => {}; globalThis.location = { hash:`#${id}` }; let stored;
    globalThis.localStorage = { getItem:()=>JSON.stringify(saved), setItem:(_,value)=>{stored=JSON.parse(value);} };
    const game = games.find((g) => g.id === id), original = game.create;
    game.create = (s) => { s.changed(); s.ready('Ready','Test readiness'); s.on(s.root,'test-begin',()=>s.begin()); s.on(s.root,'test-finish',()=>s.finish({score:25,winner,title:'Finished'})); };
    try { await import(`../js/app.js?expansion=${appCase++}`); } finally { game.create=original; }
    el('restart').emit('click'); check(el('leave-dialog').open, 'Golf and cooperative progress is protected on restart'); el('leave-dialog').close('cancel'); check(doc.activeElement===el('game-root'), 'Cancelling navigation at a between-round ready screen restores focus'); el('game-root').emit('test-begin'); el('game-root').emit('test-finish');
    const r = stored.records[`${id}:v3:${mode}`]; check(mode === 'duel' ? r.p1 === 1 && r.best === undefined : r.best === 25 && r.p1 === 0, `${mode} records use the correct ranking kind`);
    check(el('play-category').textContent.startsWith(mode === 'duel' || id==='switch-duo' ? '2 PLAYERS' : '1 PLAYER'), 'Header reflects the selected player count');
    if(id==='switch-duo') check(stored.completed['switch-duo:stage-0']==='clean' && !el('overlay-next').hidden && el('overlay-action').textContent==='함께 다시 · R', 'Cooperative completion persists, offers a next stage, and uses cooperative result copy');
    filters[1].emit('click'); check(el('game-grid').children.length===32, 'Solo filter includes mixed-player golf and computer-opponent modes'); filters[2].emit('click'); check(el('game-grid').children.length===13, 'Together filter includes golf and cooperation'); filters[3].emit('click'); check(el('game-grid').children.length===4, 'New filter contains exactly this release’s additions');
};
await app('solo'); await app('duel',1); await app('stage-0', undefined, 'switch-duo');
console.log(`PASS: ${counts().assertions} expansion rule / input / completion conditions`);
