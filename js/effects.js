import { circle, palette, reducedMotion } from './core.js';

// Bounded particles; gameplay collision never depends on visual effects.
// burst: 흩어지는 입자 · label: 떠오르는 글자 · ring: 퍼지는 충격파 · shake: 화면(캔버스) 흔들림 · flash: 화면 전체 번쩍임
export const effects = (session) => {
    const particles = [], labels = [], rings = [], quiet = reducedMotion; let flash = null;
    const canvas = () => session?.root?.querySelector?.('canvas');
    const feedback = {
        burst: (x, y, color = palette.green, count = 12, force = 100, gravity = 0) => { if (quiet()) return; for (let n = 0; n < count && particles.length < 220; n++) { const angle = Math.random() * Math.PI * 2, speed = force * (.25 + Math.random()); particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .35 + Math.random() * .35, age: 0, color, size: 1.5 + Math.random() * 2, gravity }); } },
        label: (x, y, value, color = palette.green) => { if (quiet()) return; if (labels.length < 10) labels.push({ x, y, value, color, age: 0 }); },
        ring: (x, y, color = palette.green, radius = 46, life = .45) => { if (quiet() || rings.length > 12) return; rings.push({ x, y, color, radius, life, age: 0 }); },
        flash: (color = '#ffffff', life = .18) => { if (!quiet()) flash = { color, life, age: 0 }; },
        shake: (power = 6, duration = 260) => {
            const element = canvas(); if (quiet() || !element?.animate) return;
            const p = power, frames = [[0, 0], [-p, p * .5], [p * .8, -p * .6], [-p * .5, p * .3], [p * .25, -p * .2], [0, 0]];
            element.animate(frames.map(([x, y]) => ({ transform: `translate(${x}px, ${y}px)` })), { duration, easing: 'ease-out' });
        },
        update: (dt) => {
            if (quiet()) { particles.length = labels.length = rings.length = 0; flash = null; return; }
            for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.age += dt; p.vy += p.gravity * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.exp(-2.5 * dt); p.vy *= Math.exp(-(p.gravity ? .4 : 2.5) * dt); if (p.age >= p.life) particles.splice(i, 1); }
            for (let i = labels.length - 1; i >= 0; i--) { labels[i].age += dt; if (labels[i].age > .9) labels.splice(i, 1); }
            for (let i = rings.length - 1; i >= 0; i--) { rings[i].age += dt; if (rings[i].age > rings[i].life) rings.splice(i, 1); }
            if (flash && (flash.age += dt) > flash.life) flash = null;
        },
        draw: (ctx) => {
            for (const r of rings) { const t = r.age / r.life; ctx.globalAlpha = (1 - t) * .8; ctx.strokeStyle = r.color; ctx.lineWidth = 3 * (1 - t) + 1; ctx.beginPath(); ctx.arc(r.x, r.y, r.radius * (.2 + t * .8), 0, Math.PI * 2); ctx.stroke(); }
            for (const p of particles) { ctx.globalAlpha = Math.max(0, 1 - p.age / p.life); circle(ctx, p.x, p.y, p.size, p.color); }
            ctx.font = '700 17px system-ui'; ctx.textAlign = 'center'; for (const label of labels) { ctx.globalAlpha = 1 - label.age / .9; ctx.fillStyle = label.color; ctx.fillText(label.value, label.x, label.y - label.age * 35); }
            if (flash) { ctx.globalAlpha = (1 - flash.age / flash.life) * .35; ctx.fillStyle = flash.color; ctx.fillRect(0, 0, ctx.canvas?.width || 2000, ctx.canvas?.height || 2000); }
            ctx.globalAlpha = 1; ctx.lineWidth = 1;
        }
    };
    session?.afterFinish?.((dt) => feedback.update(dt), .22); return feedback;
};
