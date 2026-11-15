import { circle, palette, reducedMotion } from './core.js';

// Bounded particles; gameplay collision never depends on visual effects.
export const effects = (session) => {
    const particles = [], labels = [], quiet = reducedMotion;
    const feedback = {
        burst: (x, y, color = palette.green, count = 12, force = 100) => { if (quiet()) return; for (let n = 0; n < count && particles.length < 180; n++) { const angle = Math.random() * Math.PI * 2, speed = force * (.25 + Math.random()); particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .35 + Math.random() * .35, age: 0, color, size: 1.5 + Math.random() * 2 }); } },
        label: (x, y, value, color = palette.green) => { if (quiet()) return; if (labels.length < 10) labels.push({ x, y, value, color, age: 0 }); },
        update: (dt) => { if (quiet()) { particles.length = labels.length = 0; return; } for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.exp(-2.5 * dt); p.vy *= Math.exp(-2.5 * dt); if (p.age >= p.life) particles.splice(i, 1); } for (let i = labels.length - 1; i >= 0; i--) { labels[i].age += dt; if (labels[i].age > .9) labels.splice(i, 1); } },
        draw: (ctx) => { for (const p of particles) { ctx.globalAlpha = Math.max(0, 1 - p.age / p.life); circle(ctx, p.x, p.y, p.size, p.color); } ctx.font = '700 17px system-ui'; ctx.textAlign = 'center'; for (const label of labels) { ctx.globalAlpha = 1 - label.age / .9; ctx.fillStyle = label.color; ctx.fillText(label.value, label.x, label.y - label.age * 35); } ctx.globalAlpha = 1; }
    };
    session?.afterFinish?.((dt) => feedback.update(dt), .22); return feedback;
};
