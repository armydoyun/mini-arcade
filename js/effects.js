import { circle, palette, reducedMotion } from './core.js';

// Bounded particles; gameplay collision never depends on visual effects.
// burst: 흩어지는 입자 · label: 떠오르는 글자 · ring: 얇게 퍼지는 고리 · shake: 아주 작은 흔들림(최대 3px)
// 장식이 아니라 '방금 무슨 일이 있었는지'를 알려 주는 최소한의 반응만 둔다.
export const effects = (session) => {
    const particles = [], labels = [], rings = [], quiet = reducedMotion;
    const canvas = () => session?.root?.querySelector?.('canvas');
    const feedback = {
        burst: (x, y, color = palette.green, count = 12, force = 100, gravity = 0) => { if (quiet()) return; for (let n = 0; n < count && particles.length < 220; n++) { const angle = Math.random() * Math.PI * 2, speed = force * (.25 + Math.random()); particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .35 + Math.random() * .35, age: 0, color, size: 1.5 + Math.random() * 2, gravity }); } },
        label: (x, y, value, color = palette.green) => { if (quiet()) return; if (labels.length < 10) labels.push({ x, y, value, color, age: 0 }); },
        ring: (x, y, color = palette.green, radius = 46, life = .45) => { if (quiet() || rings.length > 12) return; rings.push({ x, y, color, radius, life, age: 0 }); },
        shake: (power = 6, duration = 260) => {
            const element = canvas(); if (quiet() || !element?.animate) return;
            const p = Math.min(3, power * .4), frames = [[0, 0], [-p, p * .4], [p * .6, -p * .3], [-p * .25, p * .15], [0, 0]];
            element.animate(frames.map(([x, y]) => ({ transform: `translate(${x}px, ${y}px)` })), { duration: Math.min(220, duration), easing: 'cubic-bezier(.2,.7,.3,1)' });
        },
        update: (dt) => {
            if (quiet()) { particles.length = labels.length = rings.length = 0; return; }
            for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.age += dt; p.vy += p.gravity * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.exp(-2.5 * dt); p.vy *= Math.exp(-(p.gravity ? .4 : 2.5) * dt); if (p.age >= p.life) particles.splice(i, 1); }
            for (let i = labels.length - 1; i >= 0; i--) { labels[i].age += dt; if (labels[i].age > .9) labels.splice(i, 1); }
            for (let i = rings.length - 1; i >= 0; i--) { rings[i].age += dt; if (rings[i].age > rings[i].life) rings.splice(i, 1); }
        },
        draw: (ctx) => {
            for (const r of rings) { const t = r.age / r.life; const e = 1 - (1 - t) ** 3; ctx.globalAlpha = (1 - t) * .55; ctx.strokeStyle = r.color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(r.x, r.y, r.radius * (.3 + e * .7), 0, Math.PI * 2); ctx.stroke(); }
            for (const p of particles) { ctx.globalAlpha = Math.max(0, 1 - p.age / p.life); circle(ctx, p.x, p.y, p.size, p.color); }
            ctx.font = '700 17px system-ui'; ctx.textAlign = 'center'; for (const label of labels) { ctx.globalAlpha = 1 - label.age / .9; ctx.fillStyle = label.color; ctx.fillText(label.value, label.x, label.y - label.age * 35); }
            ctx.globalAlpha = 1; ctx.lineWidth = 1;
        }
    };
    session?.afterFinish?.((dt) => feedback.update(dt), .22); return feedback;
};
