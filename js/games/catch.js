import { random, clamp, background, palette, circleBox, text } from '../core.js';
import { effects } from '../effects.js';

export default (s) => {
    const width = 600, height = 450, { ctx, canvas, point } = s.canvas(width, height), objects = [], fx = effects(s); let x = 300, score = 0, lives = 5, timer = .6, combo = 0, bestCombo = 0, targetX = null;
    const hud = () => s.hud([['SCORE', score], ['LIVES', '♥'.repeat(Math.max(0, lives))], ['COMBO', `${combo} · ×${Math.min(4, 1 + Math.floor(combo / 5))}`], ['남은 시간', `${Math.max(0, Math.ceil(60 - s.time))}초`]]);
    s.bindKeys(['ArrowLeft', 'ArrowRight']); const move = (event) => { if (s.active()) targetX = clamp(point(event).x, 39, width - 39); }; s.on(canvas, 'pointermove', move); s.on(canvas, 'pointerdown', (event) => { if (s.active()) { canvas.setPointerCapture(event.pointerId); move(event); } });
    s.run((dt) => {
        fx.update(dt); const direction = (s.down('ArrowRight') ? 1 : 0) - (s.down('ArrowLeft') ? 1 : 0);
        if (direction) { x = clamp(x + direction * 430 * dt, 39, width - 39); targetX = null; }
        else if (targetX !== null) x += clamp(targetX - x, -430 * dt, 430 * dt);
        timer -= dt;
        if (timer <= 0) { const roll = Math.random(), type = lives < 4 && roll < .06 ? 'heart' : roll < .29 ? 'bomb' : roll < .41 ? 'gold' : 'star'; objects.push({ x: random(20, width - 20), y: -20, type, speed: random(115, 170) + s.time * 1.5, rotation: Math.random() * 6 }); timer = Math.max(.34, .62 - s.time * .0035); }
        for (let i = objects.length - 1; i >= 0; i--) {
            const object = objects[i];
            object.y += object.speed * dt;
            object.rotation += dt;
            if (circleBox(object, 11, { x: x - 38, y: 395, w: 76, h: 25 })) {
                if (object.type === 'bomb') {
                    lives--;
                    combo = 0;
                    fx.burst(x, 400, palette.coral, 18);
                    s.sound(140, .08);
                } else if (object.type === 'heart') {
                    lives = Math.min(5, lives + 1);
                    fx.label(x, 383, '+1 LIFE', palette.green);
                    s.sound(750);
                } else {
                    combo++;
                    bestCombo = Math.max(bestCombo, combo);
                    const gain = (object.type === 'gold' ? 30 : 10) * Math.min(4, 1 + Math.floor(combo / 5));
                    score += gain;
                    fx.label(x, 382, `+${gain}`, palette.yellow);
                    fx.burst(object.x, object.y, palette.yellow, 7, 60);
                    s.sound(480 + Math.min(combo, 10) * 30, .035);
                }
                objects.splice(i, 1);
            }
            else if (object.y > height + 18) { if (object.type === 'star' || object.type === 'gold') { combo = 0; fx.label(object.x, 418, 'COMBO LOST', palette.coral); } objects.splice(i, 1); }
        }
        hud(); if (lives <= 0 || s.time >= 60) s.finish({ score, win: lives > 0, title: lives <= 0 ? '별빛을 많이 모았어요!' : '60초 도전 완료!', text: `${score}점 · 최대 ${bestCombo}콤보 · 금빛 큰 별은 3배 점수예요.` });
    }, () => {
        background(ctx, width, height);
        objects.forEach((object) => {
            ctx.save();
            ctx.translate(object.x, object.y);
            ctx.rotate(object.rotation);
            const bomb = object.type === 'bomb', heart = object.type === 'heart';
            ctx.fillStyle = bomb ? palette.coral : heart ? palette.green : object.type === 'gold' ? '#ffe7a3' : palette.yellow;
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const radius = i % 2 ? bomb ? 8 : 5 : object.type === 'gold' ? 16 : 12, angle = i / 10 * Math.PI * 2 - Math.PI / 2;
                if (!i) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
                else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            if (heart) text(ctx, '+', object.x, object.y, 14, '#203922');
        });
        ctx.strokeStyle = combo >= 15 ? palette.yellow : palette.blue;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x - 38, 394);
        ctx.lineTo(x - 29, 420);
        ctx.lineTo(x + 29, 420);
        ctx.lineTo(x + 38, 394);
        ctx.stroke();
        fx.draw(ctx);
    }); hud(); s.message('별을 놓치면 콤보가 끊겨요. 생명은 붉은 가시에만 잃어요 · 초록 + 생명 회복.'); s.ready('Catch Game', '60초 동안 별을 모아요. 연속으로 받으면 최대 4배, 큰 금빛 별은 기본 점수가 3배예요. 놓친 별은 콤보만 끊어요.');
};
