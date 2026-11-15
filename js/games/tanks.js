import { background, circle, rounded, text, palette, circleBox, formatTime } from '../core.js';
import { traceRicochet, sweepBox, sweepCircle } from '../rules.js';
import { effects } from '../effects.js';

const tickTimer = (value, dt) => value <= dt + 1e-9 ? 0 : value - dt;
export const tankShotStep = (bullet, dt, walls) => {
    const alive = Math.min(dt, Math.max(0, 4.5 - bullet.age)), trace = traceRicochet(bullet, alive, walls);
    const segments = trace.segments.filter((part) => part.bounces <= 5).map((part) => ({ ...part, t0: part.t0 * alive / dt, t1: part.t1 * alive / dt }));
    return { ...trace, segments, age: bullet.age + dt, expired: bullet.age + dt >= 4.5 - 1e-9 || trace.bounces > 5 };
};
export const tankArenas = {
    cross: [{ x: 156, y: 88, w: 104, h: 18 }, { x: 340, y: 334, w: 104, h: 18 }, { x: 210, y: 170, w: 18, h: 100 }, { x: 372, y: 170, w: 18, h: 100 }, { x: 282, y: 106, w: 36, h: 18 }, { x: 282, y: 316, w: 36, h: 18 }],
    pillars: [{ x: 182, y: 100, w: 36, h: 36 }, { x: 382, y: 304, w: 36, h: 36 }, { x: 182, y: 304, w: 36, h: 36 }, { x: 382, y: 100, w: 36, h: 36 }, { x: 282, y: 202, w: 36, h: 36 }],
    open: [{ x: 266, y: 96, w: 68, h: 16 }, { x: 266, y: 328, w: 68, h: 16 }]
};
export default (s) => {
    const width = 600, height = 440, { ctx } = s.canvas(width, height), fx = effects(s), radius = 18, colors = [palette.coral, palette.blue];
    const boundary = [{ x: 0, y: 0, w: 600, h: 14 }, { x: 0, y: 426, w: 600, h: 14 }, { x: 0, y: 14, w: 14, h: 412 }, { x: 586, y: 14, w: 14, h: 412 }];
    const controls = [['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space'], ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter']];
    let players = [], bullets = [], walls = [], cover = [], round = 1, scores = [0, 0], countdown = .95, roundTime = 0, outro = null, go = 0, hudKey = '', arenaName = '';
    const ammoText = (p) => p.reload > 0 ? `재장전 ${p.reload.toFixed(1)}` : '●'.repeat(p.ammo) + '○'.repeat(3 - p.ammo);
    const hud = () => {
        const key = `${scores}:${Math.ceil(roundTime * 10)}:${players.map(ammoText)}:${countdown > 0}:${!!outro}`; if (key === hudKey) return; hudKey = key;
        s.hud([['PLAYER 1', `${scores[0]}승 · ${ammoText(players[0])}`, 'p1'], [`ROUND ${round} · 먼저 3승`, countdown > 0 ? 'READY' : outro ? '라운드 종료' : formatTime(Math.ceil(Math.max(0, 60 - roundTime)))], ['PLAYER 2', `${scores[1]}승 · ${ammoText(players[1])}`, 'p2']]);
    };
    const resetRound = () => {
        const key = s.options.mode === 'open' ? 'open' : s.options.mode === 'pillars' ? 'pillars' : ['cross', 'pillars', 'open'][(round - 1) % 3];
        arenaName = { cross: '교차 엄폐', pillars: '기둥 경기장', open: '중앙 통로' }[key]; cover = tankArenas[key]; walls = [...boundary, ...cover]; bullets = []; countdown = .95; roundTime = 0; outro = null; go = 0; hudKey = '';
        players = [66, 534].map((x, i) => ({ x, y: 220, previousX: x, previousY: 220, vx: 0, vy: 0, angle: i ? Math.PI : 0, target: i ? Math.PI : 0, ammo: 3, reload: 0, cooldown: 0, recoil: 0, blocked: 0, alive: true })); hud();
        s.message('P1 WASD + Space · P2 방향키 + Enter · 이동 방향으로 조준 · 반사탄은 자신도 맞아요.');
    };
    const fire = (index) => {
        const p = players[index]; if (countdown > 0 || outro || !p.alive || p.cooldown > 0 || p.reload > 0 || !p.ammo) return;
        const direction = { x: Math.cos(p.angle), y: Math.sin(p.angle) }, muzzle = { x: direction.x * 26, y: direction.y * 26 };
        if (walls.some((wall) => sweepBox(p, muzzle, wall, 3))) { p.blocked = .16; p.cooldown = .12; s.message(`P${index + 1} 포구가 막혔어요. 벽에서 조금 떨어져 발사하세요.`); return; }
        bullets.push({ x: p.x + muzzle.x, y: p.y + muzzle.y, vx: direction.x * 310, vy: direction.y * 310, owner: index, bounces: 0, age: 0, trail: [] });
        p.ammo--; p.cooldown = .3; p.recoil = .09; if (!p.ammo) p.reload = 1.25;
        fx.burst(p.x + muzzle.x, p.y + muzzle.y, colors[index], 4, 55); s.sound(index ? 390 : 310, .04); hud();
    };
    const resolveCover = (p) => {
        for (const wall of walls) { const hit = circleBox(p, radius, wall); if (!hit) continue; p.x += hit.x * (hit.depth + .001); p.y += hit.y * (hit.depth + .001); if (Math.abs(hit.x) > .2) p.vx = 0; if (Math.abs(hit.y) > .2) p.vy = 0; }
    };
    const endRound = (deaths) => {
        const winner = deaths.size === 1 ? 2 - [...deaths][0] : 0;
        deaths.forEach((i) => { players[i].alive = false; fx.burst(players[i].x, players[i].y, colors[i], 28, 150); });
        s.sound(deaths.size ? 160 : 260, .12);
        if (winner) scores[winner - 1]++; bullets = []; hudKey = '';
        if (winner && scores[winner - 1] === 3) { hud(); s.finish({ winner, title: `P${winner} 승리!`, text: `${scores[0]} : ${scores[1]} · ${round}라운드의 반사탄 승부를 마쳤어요.` }); return; }
        outro = { winner, left: .65, timeout: !deaths.size }; hud(); s.message(!deaths.size ? '60초 시간 초과 · 이번 라운드는 무승부예요.' : winner ? `P${winner} 라운드 승리!` : '동시 격파 · 무승부!');
    };
    s.bindKeys(controls.flat(), (code) => { if (code === 'Space') fire(0); else if (code === 'Enter') fire(1); });
    resetRound();
    s.run((dt) => {
        fx.update(dt);
        if (outro) {
            outro.left = tickTimer(outro.left, dt);
            if (outro.left <= 0) { const title = outro.winner ? `P${outro.winner} 라운드 승리` : '이번 라운드는 무승부'; s.ready(title, `현재 ${scores[0]} : ${scores[1]} · 두 플레이어가 준비되면 다음 라운드를 시작하세요.`, () => { round++; resetRound(); }); }
            return;
        }
        if (countdown > 0) {
            const used = Math.min(dt, countdown); countdown = tickTimer(countdown, dt); dt -= used;
            if (countdown) return; go = .35; hudKey = ''; hud(); if (dt < 1e-9) return;
        }
        roundTime += dt; go = tickTimer(go, dt);
        players.forEach((p, index) => {
            p.previousX = p.x; p.previousY = p.y; p.cooldown = tickTimer(p.cooldown, dt); p.recoil = tickTimer(p.recoil, dt); p.blocked = tickTimer(p.blocked, dt);
            if (p.reload > 0) { p.reload = tickTimer(p.reload, dt); if (!p.reload) { p.ammo = 3; fx.label(p.x, p.y - 28, 'READY', colors[index]); } }
            const [up, down, left, right] = controls[index], dx = Number(s.down(right)) - Number(s.down(left)), dy = Number(s.down(down)) - Number(s.down(up)), length = Math.hypot(dx, dy), blend = 1 - Math.exp(-dt * (length ? 16 : 22));
            if (length) p.target = Math.atan2(dy, dx);
            p.angle += Math.atan2(Math.sin(p.target - p.angle), Math.cos(p.target - p.angle)) * (1 - Math.exp(-dt * 18));
            p.vx += ((length ? dx / length * 175 : 0) - p.vx) * blend; p.vy += ((length ? dy / length * 175 : 0) - p.vy) * blend;
            p.x += p.vx * dt; resolveCover(p); p.y += p.vy * dt; resolveCover(p);
        });
        const dx = players[1].x - players[0].x, dy = players[1].y - players[0].y, separation = Math.hypot(dx, dy);
        if (separation < radius * 2) {
            const nx = separation > .0001 ? dx / separation : 1, ny = separation > .0001 ? dy / separation : 0, depth = (radius * 2 - separation) / 2;
            players.forEach((p, i) => { const sign = i ? 1 : -1; p.x += nx * depth * sign; p.y += ny * depth * sign; resolveCover(p); });
        }
        const deaths = new Set(), remaining = [];
        for (const bullet of bullets) {
            const trace = tankShotStep(bullet, dt, walls); let impact = null;
            for (const segment of trace.segments) for (let i = 0; i < players.length; i++) {
                if (i === bullet.owner && !segment.bounces) continue;
                const p = players[i], from = { x: segment.x1 - (p.previousX + (p.x - p.previousX) * segment.t0), y: segment.y1 - (p.previousY + (p.y - p.previousY) * segment.t0) }, to = { x: segment.x2 - (p.previousX + (p.x - p.previousX) * segment.t1), y: segment.y2 - (p.previousY + (p.y - p.previousY) * segment.t1) }, contact = sweepCircle(from, to, radius + 3);
                if (contact !== null) { const time = segment.t0 + (segment.t1 - segment.t0) * contact; if (!impact || time < impact.time) impact = { player: i, time }; }
            }
            if (impact) { deaths.add(impact.player); continue; }
            if (trace.bounces > bullet.bounces && trace.segments.length) fx.burst(trace.segments[0].x2, trace.segments[0].y2, colors[bullet.owner], 4, 45);
            const trail = [...bullet.trail, ...trace.segments.map((part) => ({ x: part.x2, y: part.y2 }))].slice(-9), next = { ...trace, age: bullet.age + dt, trail };
            if (!trace.expired) remaining.push(next);
        }
        bullets = remaining;
        if (deaths.size) { endRound(deaths); return; }
        if (roundTime + 1e-9 >= 60) { endRound(new Set()); return; }
        players.forEach((_, i) => { if (s.down(controls[i][4])) fire(i); }); hud();
    }, () => {
        background(ctx, width, height, 28);
        ctx.strokeStyle = '#40566c'; ctx.lineWidth = 2; ctx.strokeRect(14, 14, width - 28, height - 28);
        text(ctx, arenaName, 300, 36, 12, '#91a6bc');
        for (const wall of cover) {
            rounded(ctx, wall.x, wall.y + 3, wall.w, wall.h, '#0b141d', 4); rounded(ctx, wall.x, wall.y, wall.w, wall.h, '#2d4053', 4);
            ctx.strokeStyle = '#607a92'; ctx.lineWidth = 1; ctx.strokeRect(wall.x + 2, wall.y + 2, wall.w - 4, wall.h - 4);
        }
        bullets.forEach((bullet) => {
            bullet.trail.forEach((point, i) => { ctx.globalAlpha = i / bullet.trail.length * .25; circle(ctx, point.x, point.y, 2.5, colors[bullet.owner]); }); ctx.globalAlpha = 1;
            circle(ctx, bullet.x, bullet.y, 5, `${colors[bullet.owner]}35`); circle(ctx, bullet.x, bullet.y, 3, colors[bullet.owner]); if (bullet.bounces) circle(ctx, bullet.x, bullet.y, 1.2, '#fff3de');
        });
        players.forEach((p, i) => {
            if (!p.alive) return;
            if (!countdown && !outro) {
                const aim = traceRicochet({ x: p.x, y: p.y, vx: Math.cos(p.angle) * 130, vy: Math.sin(p.angle) * 130 }, 1, walls, 3);
                ctx.globalAlpha = .22; ctx.strokeStyle = colors[i]; ctx.lineWidth = 1; ctx.setLineDash([3, 6]); ctx.beginPath();
                aim.segments.slice(0, 2).forEach((part) => { ctx.moveTo(part.x1, part.y1); ctx.lineTo(part.x2, part.y2); }); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
            }
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
            rounded(ctx, -12, -13, 24, 6, '#101923', 2); rounded(ctx, -12, 7, 24, 6, '#101923', 2);
            for (const x of [-8, -2, 4, 10]) { rounded(ctx, x, -12, 2, 4, '#678095', 1); rounded(ctx, x, 8, 2, 4, '#678095', 1); }
            rounded(ctx, -13, -9, 26, 18, colors[i], 5); rounded(ctx, -10, -6, 16, 12, '#17263244', 3); circle(ctx, 0, 0, 7, colors[i]);
            let barrel = 25;
            for (const wall of walls) { const hit = sweepBox(p, { x: Math.cos(p.angle) * 28, y: Math.sin(p.angle) * 28 }, wall, 2); if (hit) barrel = Math.min(barrel, Math.max(9, hit.t * 28 - 3)); }
            barrel -= p.recoil / .09 * 3; rounded(ctx, 4, -3, Math.max(4, barrel - 4), 6, p.blocked ? '#f7e8cc' : colors[i], 2); circle(ctx, -5, 0, 2, '#14212b');
            if (p.recoil > .05) circle(ctx, barrel + 4, 0, 3 + p.recoil * 20, '#ffeebd'); ctx.restore();
            if (p.reload > 0) { ctx.strokeStyle = colors[i]; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 24, -Math.PI / 2, -Math.PI / 2 + (1 - p.reload / 1.25) * Math.PI * 2); ctx.stroke(); }
            text(ctx, `P${i + 1}`, p.x, p.y + 32, 10, colors[i]);
        });
        if (countdown > 0) { text(ctx, 'READY', 300, 202, 30, palette.ink); rounded(ctx, 260, 234, 80 * (1 - countdown / .95), 3, palette.green, 1); }
        else if (go > 0) { ctx.globalAlpha = Math.min(1, go * 4); text(ctx, 'GO', 300, 202, 30, palette.green); ctx.globalAlpha = 1; }
        if (outro) text(ctx, outro.winner ? `P${outro.winner} +1` : 'DRAW', 300, 202, 30, outro.winner ? colors[outro.winner - 1] : palette.ink);
        fx.draw(ctx);
    });
    s.ready('반사 탄환 탱크 대전', '이동 방향으로 포탑이 돌아가요. 3발을 쏘면 자동 재장전! 벽에 반사된 탄환은 자신도 맞으니 궤적을 읽고 움직이세요. 먼저 3승하면 승리해요.', resetRound);
};
