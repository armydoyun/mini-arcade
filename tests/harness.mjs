import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { createSession } from '../js/core.js';
import { games } from '../js/catalog.js';
setMaxListeners(0);

// Minimal DOM adapter; the actual game modules and lifecycle run unchanged.
let now = 1000, nextFrame = 1, assertions = 0, draws = 0;
const frames = new Map();
class Element {
    constructor(tag = 'div') { this.tagName = tag.toUpperCase(); this.children = []; this.parent = null; this.dataset = {}; this.attributes = {}; this.className = ''; this.listeners = new Map(); this.style = { setProperty(name, value) { this[name] = value; } }; this.classList = { contains: (name) => this.className.split(' ').includes(name), add: (...names) => { this.className = [...new Set([...this.className.split(' '), ...names])].filter(Boolean).join(' '); }, remove: (...names) => { this.className = this.className.split(' ').filter((name) => !names.includes(name)).join(' '); }, toggle: (name, force) => { const value = force ?? !this.classList.contains(name); this.classList[value ? 'add' : 'remove'](name); return value; } }; }
    append(...elements) { for (const element of elements) { if (element.parent) element.parent.children = element.parent.children.filter((item) => item !== element); element.parent = this; this.children.push(element); } }
    replaceChildren(...elements) { this.children.forEach((element) => { element.parent = null; }); this.children = []; this.append(...elements); }
    set textContent(value) { this.ownText = String(value); this.children = []; }
    get textContent() { return this.ownText || this.children.map((element) => element.textContent).join(''); }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    getAttribute(name) { return this.attributes[name] ?? null; }
    closest(selector) { const match = selector[0] === '.' ? this.classList.contains(selector.slice(1)) : selector === '[data-column]' && this.dataset.column !== undefined; return match ? this : this.parent?.closest(selector) || null; }
    addEventListener(type, callback, options = {}) { const set = this.listeners.get(type) || new Set(); set.add(callback); this.listeners.set(type, set); options.signal?.addEventListener('abort', () => set.delete(callback), { once: true }); }
    emit(type, properties = {}) { let stopped = false; const event = { type, target: this, code: '', preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() { stopped = true; }, ...properties }; for (const callback of [...(this.listeners.get(type) || [])]) { if (stopped) break; callback(event); } }
    dispatchEvent(event) { this.emit(event.type); }
    setPointerCapture() {}
    focus() { document.activeElement = this; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter((element) => element !== this); this.parent = null; }
    getBoundingClientRect() { const aspect = (this.style.aspectRatio || '4 / 3').split('/').map(Number), width = Math.min(600, Number(this.width) || 480); return { left: 0, top: 0, width, height: width * aspect[1] / aspect[0] }; }
    getContext() {
        const owner = this;
        this.context ??= new Proxy({}, {
            get(target, name) {
                if (!(name in target)) return (...args) => { draws++; for (const value of args) if (typeof value === 'number') assert.ok(Number.isFinite(value), `${String(name)} received a non-finite coordinate`); owner.paint?.(name, args, target); };
                return target[name];
            },
            set(target, name, value) { target[name] = value; return true; }
        });
        return this.context;
    }
    showModal() { this.open = true; }
    close(value = '') { this.returnValue = value; this.open = false; this.emit('close'); }
    querySelector(selector) { return this.all((element) => selector[0] === '.' ? element.classList.contains(selector.slice(1)) : element.tagName === selector.toUpperCase())[0] || null; }

    all(predicate) { return this.children.flatMap((child) => [...(predicate(child) ? [child] : []), ...child.all(predicate)]); }
}
const win = new Element('window'); win.devicePixelRatio = 1;
globalThis.window = win;
globalThis.document = { createElement: (tag) => new Element(tag), querySelector: () => null, activeElement: new Element('body') };
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
globalThis.requestAnimationFrame = (callback) => { const id = nextFrame++; frames.set(id, callback); return id; };
globalThis.cancelAnimationFrame = (id) => frames.delete(id);
Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => now } });
let seed = 2871;
Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const check = (value, message) => { assert.ok(value, message); assertions++; };
const tick = (seconds = 1 / 60) => { now += seconds * 1000; const pending = [...frames.values()]; frames.clear(); pending.forEach((callback) => callback(now)); };
const advance = (seconds) => { for (let n = 0; n < seconds * 60; n++) tick(); };
const key = (code) => { win.emit('keydown', { code }); win.emit('keyup', { code }); };
const mount = (id, options = {}, begin = true) => {
    const game = games.find((item) => item.id === id), root = new Element(), controls = new Element(), state = { hud: [], results: [], message: '' };
    document.activeElement = root;
    const s = createSession(root, { options: { mode: game.modes?.[0]?.id || 'classic', ...options }, variant: (key) => { state.variant = key; }, hud: (value) => { state.hud = value; }, controls: () => controls, message: (value) => { state.message = value; }, sound: () => false, finish: (value) => state.results.push(value), autopause: () => s.pause(true) });
    game.create(s); if (begin && s.waiting) s.begin(); const cells = () => root.all((element) => element.classList.contains('cell'));
    const click = (index) => { const cell = cells()[index]; cell.parent.emit('click', { target: cell }); };
    return { s, root, controls, state, cells, click, destroy: () => { s.destroy(); check(frames.size === 0, `${id} stops all scheduled frames`); check([...win.listeners.values()].every((set) => set.size === 0), `${id} removes keyboard and blur listeners`); } };
};

export { Element, win, frames, tick, advance, key, mount, check };
export const counts = () => ({ assertions, draws });
