import { shuffle } from '../core.js';

export default (s) => {
    const pairs = s.options.mode === 'quick' ? 6 : s.options.mode === 'challenge' ? 10 : 8, symbols = ['◆', '●', '▲', '✦', '○', '■', '✚', '◇', '★', '⬟'].slice(0, pairs), deck = shuffle([...symbols, ...symbols]), matched = new Set(); let first = -1, second = -1, locked = true, attempts = 0, peeking = false, concealed = false, streak = 0, missed = false;
    let justMatched = [];
    const render = () => { cells.forEach((cell, i) => { const visible = !concealed && (peeking || matched.has(i) || i === first || i === second); cell.textContent = visible ? deck[i] : String(i + 1).padStart(2, '0'); cell.className = `cell ${visible ? 'revealed' : ''} ${!concealed && matched.has(i) ? 'matched' : ''} ${missed && (i === first || i === second) ? 'miss' : ''} ${!concealed && justMatched.includes(i) ? 'pair' : ''}`; cell.setAttribute('aria-label', `${i + 1}번 카드 ${visible ? deck[i] : '뒤집힘'}`); }); s.hud([['찾은 쌍', `${matched.size / 2} / ${pairs}`], ['시도', attempts], ['연속 성공', streak]]); };
    const { cells, element } = s.grid(4, deck.length / 4, (i) => {
        if (locked || matched.has(i) || i === first) return; s.changed();
        if (first < 0) { first = i; render(); s.sound(360, .04); return; }
        second = i; attempts++; locked = true; render();
        if (deck[first] === deck[second]) { streak++; s.sound(500 + Math.min(6, streak) * 70); s.later(.24, () => { matched.add(first); matched.add(second); justMatched = [first, second]; first = second = -1; locked = false; render(); if (matched.size === deck.length) s.finish({ score: attempts, recordText: `${attempts}회 시도`, title: '기억이 전부 이어졌어요!', text: `${attempts}번 시도 · 정확도 ${Math.round(pairs / attempts * 100)}% · ${Math.floor(s.elapsed() + 1e-7)}초` }); }); }
        else { streak = 0; s.later(.4, () => { missed = true; render(); s.sound(200, .06); }); s.later(.85, () => { missed = false; first = second = -1; locked = false; render(); }); }
    }, 'memory'); element.style.aspectRatio = `4 / ${deck.length / 4}`;
    const peek = () => { if (locked) return; s.assist(); locked = peeking = true; render(); s.later(1.2, () => { locked = peeking = false; render(); }); };
    s.on(s.root, 'gamepause', () => { concealed = true; render(); });
    s.on(s.root, 'gameresume', () => { concealed = false; render(); });
    s.controls([{ label: '잠깐 둘러보기 · H', action: peek, disabled: () => locked }]); s.bindKeys(['KeyH'], peek); render();
    s.ready('카드 짝맞추기', '시작하면 1.5초 동안 카드를 보여 드려요. 위치를 기억한 뒤 같은 모양을 찾아요.', () => { peeking = true; render(); s.message('위치를 기억하세요…'); s.later(1.5, () => { peeking = locked = false; s.startClock(); render(); s.message('두 장씩 뒤집으세요. H 둘러보기는 연습 기록으로 남아요.'); }); });
};
