import { formatTime, reducedMotion } from '../core.js';
import { mineNeighbors, minesNoGuess } from '../rules.js';

export default (s) => {
    const [columns, rows, total] = s.options.mode === 'hard' ? [24, 16, 99] : s.options.mode === 'medium' ? [16, 16, 40] : [9, 9, 10];
    const mines = new Set(), open = new Set(), flags = new Set(); let planted = false, flagMode = false, exploded = -1, lastSecond = -1, wave = new Map();
    const near = (i) => mineNeighbors(i, columns, rows), count = (i) => near(i).filter((n) => mines.has(n)).length;
    const hud = () => s.hud([['남은 깃발', total - flags.size], ['안전 칸', `${open.size} / ${columns * rows - total}`], ['TIME', planted ? formatTime(s.elapsed()) : '0:00']]);
    const render = (reveal = false) => {
        cells.forEach((cell, i) => {
            const number = open.has(i) ? count(i) : 0, wrong = reveal && flags.has(i) && !mines.has(i);
            cell.className = `cell ${open.has(i) ? 'open' : ''} ${flags.has(i) ? 'flagged' : ''} ${reveal && mines.has(i) ? 'mine' : ''} ${i === exploded ? 'exploded' : ''} ${wrong ? 'wrong' : ''}`;
            cell.textContent = wrong ? '×' : flags.has(i) ? '⚑' : reveal && mines.has(i) ? '✹' : number || '';
            cell.dataset.number = number;
            // 이번 입력으로 새로 열린 칸은 누른 곳에서 퍼져 나가는 물결처럼 차례로 열린다(움직임 줄이기에서는 즉시).
            if (wave.has(i)) { cell.classList.add(reveal && mines.has(i) ? 'boom' : 'wave'); cell.style.setProperty('--delay', `${wave.get(i)}ms`); }
            cell.setAttribute('aria-label', `${Math.floor(i / columns) + 1}행 ${i % columns + 1}열 ${wrong ? '잘못된 깃발' : flags.has(i) ? '깃발' : reveal && mines.has(i) ? '지뢰' : open.has(i) ? `주변 지뢰 ${number}개` : '닫힘'}`);
        });
        hud(); wave = new Map();
    };
    const ripple = (from, list) => { if (reducedMotion()) return; const fx = from % columns, fy = Math.floor(from / columns); for (const i of list) wave.set(i, Math.min(420, Math.hypot(i % columns - fx, Math.floor(i / columns) - fy) * 28)); };
    const mark = (i) => { if (open.has(i)) return; if (flags.has(i)) flags.delete(i); else if (flags.size < total) flags.add(i); else { s.message('깃발을 모두 썼어요. 잘못된 깃발을 먼저 회수하세요.'); return; } s.changed(); render(); s.sound(330, .035); };
    const reveal = (i) => {
        if (flags.has(i)) return;
        s.changed(); if (!planted) { s.startClock(); minesNoGuess(columns, rows, total, i).mines.forEach((n) => mines.add(n)); planted = true; s.run(() => { const second = Math.floor(s.elapsed()); if (second !== lastSecond) { lastSecond = second; hud(); } }); }
        let targets = [i]; if (open.has(i)) { const adjacent = near(i); if (!count(i) || adjacent.filter((n) => flags.has(n)).length !== count(i)) { s.message('숫자만큼 깃발을 세운 뒤 숫자를 누르면 주변 칸을 한 번에 열어요.'); return; } targets = adjacent.filter((n) => !flags.has(n) && !open.has(n)); }
        const before = new Set(open), queue = [...targets]; for (let head = 0; head < queue.length; head++) { const at = queue[head]; if (open.has(at) || flags.has(at)) continue; if (mines.has(at)) { exploded = at; ripple(at, [...mines].filter((m) => m !== at && !flags.has(m))); render(true); if (!reducedMotion()) element.animate?.([{ transform: 'translate(0,0)' }, { transform: 'translate(-6px,3px)' }, { transform: 'translate(5px,-4px)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(0,0)' }], { duration: 320, easing: 'ease-out' }); s.sound(110, .25); s.finish({ score: 0, win: false, title: '깃발 위치를 다시 살펴봐요', text: `${open.size}개의 안전 칸을 찾았어요. 붉은 칸이 밟은 지뢰예요.` }); return; } open.add(at); if (!count(at)) queue.push(...near(at).filter((next) => !open.has(next))); }
        ripple(i, [...open].filter((n) => !before.has(n))); render(); s.sound(open.size - before.size > 8 ? 560 : 470, .035); if (open.size === columns * rows - total) { mines.forEach((at) => flags.add(at)); render(true); const seconds = Math.max(1, Math.floor(s.elapsed() + 1e-7)); s.finish({ seconds, score: seconds, recordText: `${seconds}초`, title: '모든 칸이 안전해요!', text: `${total}개의 지뢰를 피해 ${seconds}초 만에 완성했어요.` }); }
    };
    const { cells, element } = s.grid(columns, rows, (i) => flagMode ? mark(i) : reveal(i), 'compact mines'); element.style.setProperty('--board-max', columns > 9 ? '680px' : '440px');
    s.on(element, 'contextmenu', (event) => { event.preventDefault(); const cell = event.target.closest('.cell'); if (cell && s.active()) mark(Number(cell.dataset.index)); });
    const toggle = () => { flagMode = !flagMode; button.textContent = flagMode ? '⚑ 깃발 모드 · M' : '칸 열기 모드 · M'; button.classList.toggle('selected', flagMode); button.setAttribute('aria-pressed', flagMode); button.title = button.textContent; };
    const controls = s.controls([{ label: '칸 열기 모드 · M', action: toggle }]), button = controls.children[0]; button.setAttribute('aria-pressed', false); s.bindKeys(['KeyM'], toggle); render(); s.message('추측 없이 풀리는 판이에요. 막히면 숫자를 다시 읽어 보세요 · 우클릭 깃발 · 숫자 클릭으로 주변 동시 열기.');
};
