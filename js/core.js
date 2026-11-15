export const palette = { bg: '#151b23', grid: '#26303d', ink: '#edf0f4', muted: '#8a96a7', green: '#b9f86b', blue: '#82b6ff', coral: '#ff8e7a', yellow: '#f5d47d', purple: '#c1a0ff' };
export const reducedMotion = () => !!(document.body?.classList.contains('reduce-motion') || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const shuffle = (items) => { const result = [...items]; for (let i = result.length - 1; i > 0; i--) { const j = random(0, i); [result[i], result[j]] = [result[j], result[i]]; } return result; };
export const node = (tag, className = '', text = '') => { const element = document.createElement(tag); element.className = className; element.textContent = text; return element; };
export const circle = (ctx, x, y, radius, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); };
export const text = (ctx, value, x, y, size = 20, color = palette.ink) => { ctx.fillStyle = color; ctx.font = `600 ${size}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(value, x, y); };
export const background = (ctx, width, height, spacing = 30) => { ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, width, height); ctx.fillStyle = palette.grid; for (let x = 15; x < width; x += spacing) for (let y = 15; y < height; y += spacing) ctx.fillRect(x, y, 1.5, 1.5); };
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const intersects = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export const circleBox = (ball, radius, box) => {
    const dx = ball.x - clamp(ball.x, box.x, box.x + box.w), dy = ball.y - clamp(ball.y, box.y, box.y + box.h), length = Math.hypot(dx, dy);
    if (length >= radius) return null; if (length > .000001) return { x: dx / length, y: dy / length, depth: radius - length };
    const edges = [[ball.x - box.x, -1, 0], [box.x + box.w - ball.x, 1, 0], [ball.y - box.y, 0, -1], [box.y + box.h - ball.y, 0, 1]].sort((a, b) => a[0] - b[0]); return { x: edges[0][1], y: edges[0][2], depth: radius + edges[0][0] };
};
export const seededRandom = (seed) => { let value = seed >>> 0; return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; }; };
export const keyCode = (code) => code === 'NumpadEnter' ? 'Enter' : code.replace(/^Numpad([1-9])$/, 'Digit$1');
export const formatTime = (seconds, precise = false) => {
    const units = Math.max(0, Math.floor(seconds * (precise ? 10 : 1) + 1e-7)), whole = precise ? Math.floor(units / 10) : units;
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}${precise ? `.${units % 10}` : ''}`;
};
export const rounded = (ctx, x, y, width, height, color, radius = 5) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, Math.max(0, width), Math.max(0, height), radius); ctx.fill(); };
export const history = (capture, restore, limit = 80) => {
    const entries = [];
    return { save: () => { entries.push(structuredClone(capture())); if (entries.length > limit) entries.shift(); }, undo: () => { if (!entries.length) return false; restore(entries.pop()); return true; }, available: () => entries.length > 0 };
};

let audio;
export const tone = (frequency = 440, duration = 0.07) => {
    try { audio ??= new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); const oscillator = audio.createOscillator(), gain = audio.createGain(); oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, audio.currentTime); gain.gain.setValueAtTime(0.045, audio.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration); oscillator.connect(gain); gain.connect(audio.destination); oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); }; oscillator.start(); oscillator.stop(audio.currentTime + duration); } catch { /* Sound is optional. */ }
};

// A session owns input, one active clock, rendering, delayed work and cleanup.
// finish: score/order/recordText describe ranking; practice excludes ranked updates.
export const createSession = (root, hooks) => {
    const controller = new AbortController(), keys = new Set(), cleanups = [], tasks = [];
    let frame = 0, previous = 0, clock = 0, started = 0, update = null, draw = null, beginReady = null, begun = false;
    let toolItems = [], ending = null, endStep = null, endDuration = 0, endRemaining = 0;
    const s = { root, signal: controller.signal, paused: false, over: false, destroyed: false, waiting: false, dirty: false, time: 0, pauseOnStall: true, options: hooks.options || {}, practice: false, recordKey: hooks.options?.mode || 'classic' };
    const schedule = () => { if (!frame && !s.destroyed && (s.active() || ending)) frame = requestAnimationFrame(animate); };
    s.on = (target, type, handler, options = {}) => target.addEventListener(type, handler, { ...options, signal: controller.signal });
    s.active = () => !s.paused && !s.over && !s.destroyed && !s.waiting;
    s.focus = () => root.focus({ preventScroll: true });
    s.changed = () => { s.dirty = true; };
    s.elapsed = () => Math.max(0, clock - started);
    s.startClock = () => { started = clock; };
    s.sound = (frequency, duration) => { if (hooks.sound()) tone(frequency, duration); };
    s.syncTools = () => toolItems.forEach(([button, definition]) => { button.disabled = !s.active() || !!definition.disabled?.(); });
    s.hud = (items) => { hooks.hud(items); s.syncTools(); };
    s.message = (message) => hooks.message(message);
    s.assist = () => { s.practice = true; hooks.assist?.(); };
    s.setRecord = (key, label = '') => { s.recordKey = key; hooks.variant?.(key, label); };
    s.afterFinish = (step, seconds = .22) => { endStep = step; endDuration = seconds; };
    s.finish = (result) => {
        if (!s.active()) return;
        s.over = true; keys.clear(); tasks.length = 0; cancelAnimationFrame(frame); frame = 0;
        root.inert = true; root.setAttribute('aria-disabled', 'true'); s.syncTools(); hooks.ended?.();
        const outcome = { ...result, seconds: Number.isFinite(result.seconds) ? result.seconds : s.elapsed(), practice: s.practice, recordKey: s.recordKey };
        s.sound(result.win === false ? 150 : 660, .15);
        const quiet = reducedMotion();
        if (endStep && !quiet) { ending = outcome; endRemaining = endDuration; previous = 0; schedule(); }
        else { draw?.(); hooks.finish(outcome); }
    };
    s.down = (code) => keys.has(keyCode(code));
    s.releaseKeys = () => keys.clear();
    s.bindKeys = (codes, handler) => {
        const allowed = new Set(codes);
        s.on(window, 'keydown', (event) => {
            const code = keyCode(event.code), focus = document.activeElement;
            if (!s.active() || document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT/.test(focus?.tagName) || event.ctrlKey || event.metaKey || event.altKey || !allowed.has(code)) return;
            if (focus?.tagName === 'A' || (focus?.tagName === 'BUTTON' && !['cell', 'edge', 'hex-cell'].some((name) => focus.classList.contains(name)))) return;
            event.preventDefault(); if (event.repeat && !keys.has(code)) return;
            keys.add(code); if (!event.repeat) handler?.(code);
        });
        s.on(window, 'keyup', (event) => { keys.delete(keyCode(event.code)); });
    };
    s.controls = (definitions) => {
        const bar = hooks.controls(); bar.replaceChildren(); toolItems = [];
        for (const definition of definitions) {
            const button = node('button', `control-button ${definition.className || ''}`, definition.label); button.type = 'button';
            if (definition.title) button.setAttribute('aria-label', definition.title);
            button.title = definition.title || definition.label; bar.append(button); toolItems.push([button, definition]);
            s.on(button, 'click', () => {
                if (!s.active() || button.disabled) return;
                definition.action?.(button); s.syncTools(); if (s.active()) s.focus();
            });
        }
        return bar;
    };
    s.grid = (columns, rows, handler, className = '', navigation = true) => {
        const element = node('div', `board-grid ${className}`), cells = []; element.style.setProperty('--columns', columns);
        element.style.setProperty('--board-ratio', columns / rows); element.style.aspectRatio = `${columns} / ${rows}`; element.setAttribute('role', 'group');
        for (let i = 0; i < columns * rows; i++) {
            const cell = node('button', 'cell'); cell.type = 'button'; cell.setAttribute('aria-label', `${Math.floor(i / columns) + 1}행 ${i % columns + 1}열`);
            cell.dataset.index = i; cell.tabIndex = i ? -1 : 0; cells.push(cell); element.append(cell);
        }
        let focused = 0;
        const focus = (index) => { cells[focused].tabIndex = -1; focused = index; cells[index].tabIndex = 0; };
        s.on(element, 'click', (event) => {
            const cell = event.target.closest('.cell'); if (!cell || !s.active()) return;
            const i = Number(cell.dataset.index); focus(i); handler(i, event);
        });
        if (navigation) s.on(element, 'keydown', (event) => {
            const cell = event.target.closest('.cell'); if (!cell || (!s.active() && !s.over)) return;
            const i = Number(cell.dataset.index), x = i % columns;
            const next = { ArrowLeft: x ? i - 1 : i, ArrowRight: x < columns - 1 ? i + 1 : i, ArrowUp: i >= columns ? i - columns : i, ArrowDown: i + columns < cells.length ? i + columns : i, Home: i - x, End: i - x + columns - 1 }[event.code];
            if (next !== undefined) { event.preventDefault(); event.stopPropagation(); focus(next); cells[next].focus({ preventScroll: true }); }
        });
        root.append(element); return { element, cells, focus };
    };
    s.canvas = (width, height) => {
        const canvas = node('canvas', 'game-canvas'); canvas.width = width; canvas.height = height; canvas.style.aspectRatio = `${width} / ${height}`;
        canvas.style.setProperty('--native-width', `${width}px`); canvas.style.setProperty('--canvas-ratio', width / height);
        canvas.setAttribute('aria-label', '게임 화면. 안내된 키보드 또는 마우스 조작을 사용하세요.'); root.append(canvas);
        const ctx = canvas.getContext('2d');
        const resize = () => {
            const ratio = Math.min(window.devicePixelRatio || 1, 2), display = canvas.getBoundingClientRect();
            canvas.width = Math.max(1, Math.round(display.width * ratio)); canvas.height = Math.max(1, Math.round(display.height * ratio));
            ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0); draw?.();
        };
        const observer = new ResizeObserver(resize); observer.observe(canvas); cleanups.push(() => observer.disconnect()); resize();
        const point = (event) => { const bounds = canvas.getBoundingClientRect(); return { x: (event.clientX - bounds.left) / bounds.width * width, y: (event.clientY - bounds.top) / bounds.height * height }; };
        return { canvas, ctx, point, width, height };
    };
    const advance = (dt) => {
        clock += dt; s.time = clock;
        while (tasks.length && tasks[0].at <= clock + 1e-9 && s.active()) tasks.shift().action();
        if (s.active()) update?.(dt);
    };
    const animate = (stamp) => {
        frame = 0; if (s.destroyed) return;
        const dt = previous ? Math.max(0, (stamp - previous) / 1000) : 0; previous = stamp;
        if (ending) {
            const visualStep = Math.min(dt, .05); endStep?.(visualStep); endRemaining -= visualStep; draw?.();
            if (endRemaining <= 0) { const outcome = ending; ending = null; hooks.finish(outcome); } else schedule();
            return;
        }
        if (!s.active()) return;
        if (dt > .75 && s.pauseOnStall) { hooks.autopause(); s.message('화면이 오래 멈춰 일시정지했어요. 준비되면 계속하세요.'); return; }
        let remaining = dt;
        if (!remaining) advance(0);
        while (remaining > 1e-9 && s.active()) { const slice = Math.min(remaining, 1 / 60); advance(slice); remaining -= slice; }
        draw?.(); schedule();
    };
    s.run = (step, render) => { update = step; draw = render; draw?.(); schedule(); };
    s.later = (seconds, action) => { tasks.push({ at: clock + seconds, action }); tasks.sort((a, b) => a.at - b.at); schedule(); };
    s.begin = () => beginReady?.();
    s.ready = (title, description, action) => {
        s.waiting = true; cancelAnimationFrame(frame); frame = 0; previous = 0; keys.clear(); s.syncTools(); hooks.ready?.(true);
        const covered = [...root.children]; covered.forEach((child) => { child.inert = true; });
        const overlay = node('div', 'ready-screen'), card = node('div', 'ready-card'), button = node('button', 'primary', '플레이 시작  ↵'), heading = node('h2', '', title);
        heading.id = 'session-ready-title'; overlay.setAttribute('role', 'group'); overlay.setAttribute('aria-labelledby', heading.id);
        button.type = 'button'; card.append(node('span', 'eyebrow', 'READY WHEN YOU ARE'), heading, node('p', '', description), button, node('small', '', 'Enter / Space 또는 시작 버튼')); overlay.append(card); root.append(overlay);
        beginReady = () => {
            if (!s.waiting || s.destroyed) return;
            s.waiting = false; overlay.remove(); covered.forEach((child) => { child.inert = false; });
            if (!begun) { s.startClock(); begun = true; }
            action?.(); previous = 0; s.syncTools(); hooks.ready?.(false); s.focus(); draw?.(); schedule();
        };
        s.on(button, 'click', () => beginReady?.());
    };
    s.on(window, 'keydown', (event) => {
        const focus = document.activeElement, nativeControl = focus?.tagName === 'A' || (focus?.tagName === 'BUTTON' && !focus.closest('.ready-screen'));
        if (!s.waiting || s.paused || nativeControl || document.querySelector('dialog[open]') || event.ctrlKey || event.metaKey || event.altKey || /INPUT|SELECT|TEXTAREA/.test(focus?.tagName)) return;
        if (['Space', 'Enter'].includes(keyCode(event.code))) { event.preventDefault(); event.stopImmediatePropagation(); s.begin(); }
    });
    s.pause = (value) => {
        if (s.over || s.destroyed || s.paused === value) return;
        s.paused = value; keys.clear(); previous = 0;
        if (value) { cancelAnimationFrame(frame); frame = 0; root.dispatchEvent(new Event('gamepause')); }
        else { root.dispatchEvent(new Event('gameresume')); schedule(); }
        s.syncTools();
    };
    s.destroy = () => {
        s.destroyed = true; ending = null; controller.abort(); cancelAnimationFrame(frame); keys.clear(); tasks.length = 0;
        cleanups.forEach((cleanup) => cleanup()); root.replaceChildren();
    };
    s.on(window, 'blur', () => { keys.clear(); hooks.autopause(); }); schedule();
    return s;
};

export const duelHud = (s, turn, p1 = 'P1', p2 = 'P2') => s.hud([['PLAYER 1', p1, `p1 ${turn === 1 ? 'active' : ''}`], ['현재 차례', turn ? `P${turn}` : '대결 종료'], ['PLAYER 2', p2, `p2 ${turn === 2 ? 'active' : ''}`]]);
export const duelFinish = (s, winner, detail = '') => s.finish({ winner, title: winner ? `P${winner} 승리!` : '무승부!', text: detail || (winner ? '좋은 승부였어요. 한 판 더 겨뤄 볼까요?' : '팽팽한 대결이었어요. 다시 도전해요.') });
