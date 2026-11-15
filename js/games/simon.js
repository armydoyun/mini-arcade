import { random, node } from '../core.js';

export default (s) => {
    const sequence = [], colors = ['#ff8e7a', '#82b6ff', '#b9f86b', '#f5d47d'], symbols = ['●', '◆', '▲', '■'], progress = node('div', 'sequence-progress'); let position = 0, input = false, flash = -1, token = 0, completed = 0, lives = s.options.mode === 'safe' ? 3 : 1;
    const render = () => { cells.forEach((cell, i) => cell.classList.toggle('flash', flash === i)); progress.replaceChildren(...sequence.map((_, i) => node('span', i < position ? 'done' : '', i < position ? '●' : '·'))); s.hud([['완료 단계', completed], ['지금', input ? `${position + 1} / ${sequence.length}` : '패턴 보기'], ['기회', '♥'.repeat(Math.max(0, lives))]]); };
    const light = (i, duration = .22) => { const own = ++token; flash = i; s.sound([330, 440, 550, 660][i], duration); render(); s.later(duration, () => { if (own === token) { flash = -1; render(); } }); };
    const play = (extend = true) => {
        input = false; position = 0; if (extend) sequence.push(random(0, 3)); render(); s.message('빛나는 순서를 기억하세요. 마지막 패드가 꺼진 뒤 입력해요.'); let index = 0; const pace = Math.max(.32, .64 - completed * .012);
        const step = () => { if (index === sequence.length) { input = true; flash = -1; render(); s.message('여러분 차례예요. 1~4 또는 패드를 순서대로 누르세요.'); return; } light(sequence[index++], pace * .55); s.later(pace, step); }; s.later(.45, step);
    };
    const choose = (i) => { if (!input) return; s.changed(); light(i, .16); if (sequence[position] !== i) { lives--; input = false; render(); if (!lives) { s.finish({ score: completed, recordText: `${completed}단계`, win: false, title: '여기까지 기억했어요!', text: `${completed}단계 완료 · ${position + 1}번째 정답은 ${sequence[position] + 1}번이었어요.` }); } else { s.message(`한 번 쉬고 같은 패턴에 다시 도전해요. 남은 기회 ${lives}번.`); s.later(1, () => play(false)); } return; } position++; if (position === sequence.length) { input = false; completed++; s.message('정답! 한 단계 더 길어져요.'); s.later(.75, play); } render(); };
    const { cells } = s.grid(2, 2, choose, 'simon'); cells.forEach((cell, i) => { cell.textContent = `${i + 1} ${symbols[i]}`; cell.style.background = colors[i]; cell.setAttribute('aria-label', `${i + 1}번 패드 ${symbols[i]}`); }); s.root.append(progress);
    const repeat = () => { if (input) { s.assist(); play(false); } }; s.controls([{ label: '패턴 다시 보기 · H', action: repeat, disabled: () => !input }]); s.bindKeys(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'KeyH'], (code) => code === 'KeyH' ? repeat() : choose(Number(code.slice(-1)) - 1)); render(); s.ready('Simon Says', '숫자·모양·빛을 함께 기억해요. 패턴은 매번 한 개씩 길어지고 조금씩 빨라져요.', play);
};
