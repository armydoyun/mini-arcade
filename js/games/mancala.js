import { node, history, reducedMotion } from '../core.js';
import { mancalaMove } from '../rules.js';

export default (s) => {
    s.pauseOnStall = false;
    const seeds = s.options.mode === 'quick' ? 3 : 4, board = node('div','mancala-board'), buttons = Array(14), flight = node('span','sowing-seed');
    let state = { board:Array.from({ length:14 },(_,i) => i === 6 || i === 13 ? 0 : seeds), turn:1, moves:0 }, selected = 0, locked = false, landing = -1, inHand = 0, captured = [];
    const owner = (i) => i < 6 ? 1 : i > 6 && i < 13 ? 2 : 0;
    board.setAttribute('role','group'); board.setAttribute('aria-label','만칼라. 위 P2, 아래 P1. 각자 자기 칸만 고를 수 있어요.');
    for (const i of [13,12,11,10,9,8,7,0,1,2,3,4,5,6]) {
        const button = node('button',`cell logic-cell mancala-pit ${owner(i) ? `pit-p${owner(i)}` : `mancala-store store-p${i === 6 ? 1 : 2}`}`); button.type = 'button'; button.dataset.index = i; button.tabIndex = -1;
        if (owner(i)) { button.style.gridColumn = i < 6 ? String(i + 2) : String(14 - i); button.style.gridRow = i < 6 ? '2' : '1'; }
        else { button.style.gridColumn = i === 6 ? '8' : '1'; button.style.gridRow = '1 / 3'; }
        buttons[i] = button; board.append(button);
    }
    flight.setAttribute('aria-hidden','true'); board.append(flight); s.root.append(board);
    const render = () => {
        if (state.turn && (!state.board[selected] || owner(selected) !== state.turn)) selected = (state.turn === 1 ? [0,1,2,3,4,5] : [12,11,10,9,8,7]).find((i) => state.board[i]) ?? selected;
        buttons.forEach((button,i) => {
            const player = owner(i), legal = player === state.turn && state.board[i] > 0 && !locked;
            button.classList.toggle('pit-legal',legal); button.classList.toggle('seed-arrival',landing === i); button.classList.toggle('pit-captured',captured.includes(i)); button.tabIndex = selected === i ? 0 : -1;
            button.setAttribute('aria-disabled',!legal); button.setAttribute('aria-label', `${player ? `P${player} ${i < 6 ? i + 1 : 13 - i}번 칸` : `P${i === 6 ? 1 : 2} 저장소`} · 씨앗 ${state.board[i]}개${legal ? ' · 선택 가능' : ''}`);
            button.innerHTML = `<span class="pit-seeds" aria-hidden="true">${Array.from({ length:Math.min(12,state.board[i]) },(_,n) => { const a = n * 2.39996, r = Math.sqrt((n + .5) / 12) * 32; return `<i style="left:${50 + Math.cos(a)*r}%;top:${50 + Math.sin(a)*r}%"></i>`; }).join('')}</span><strong>${state.board[i]}</strong><small>${player ? i < 6 ? i + 1 : 13 - i : `P${i === 6 ? 1 : 2}`}</small>`;
        });
        s.hud([['P1 저장소 · 아래',state.board[6],`p1 ${state.turn === 1 ? 'active' : ''}`],[locked ? '씨앗 배분' : '현재 차례 / 수',locked ? `P${state.turn} · 손에 ${inHand}개` : `${state.turn ? `P${state.turn}` : '종료'} · ${state.moves}수`],['P2 저장소 · 위',state.board[13],`p2 ${state.turn === 2 ? 'active' : ''}`]]);
    };
    const past = history(() => state,(saved) => { state = saved; landing = -1; captured = []; s.releaseKeys(); render(); s.message('씨앗·차례·저장소를 모두 되돌렸어요.'); },Infinity);
    const fly = (to) => { const parent = board.getBoundingClientRect(), target = buttons[to].getBoundingClientRect(); flight.style.left = `${target.left - parent.left + target.width / 2}px`; flight.style.top = `${target.top - parent.top + target.height / 2}px`; };
    const choose = (pit) => {
        if (!s.active() || locked) return;
        const result = mancalaMove(state,pit); if (!result) { s.message('자기 줄에서 씨앗이 남은 칸을 고르세요. 숫자 1~6은 자기 줄의 왼쪽부터예요.'); return; }
        past.save(); s.changed(); locked = true; selected = pit; captured = []; const player = state.turn;
        const finishMove = () => {
            state = result.state; locked = false; landing = -1; inHand = 0; captured = result.capture ? [result.capture.own,result.capture.opposite,player === 1 ? 6 : 13] : []; flight.classList.remove('in-flight'); render();
            s.message(result.finished ? '한쪽 줄이 비어 남은 씨앗을 각자의 저장소에 모았어요.' : `${result.capture ? `${result.capture.count}개 포획! ` : ''}${result.extra ? `P${player} 저장소에서 끝나 한 번 더!` : `이제 P${state.turn} 차례예요.`}`);
            if (result.capture) s.sound(600,.07); else if (result.extra) s.sound(510,.06);
            if (result.finished) s.finish({ winner:result.winner, title:result.winner ? `P${result.winner} 만칼라 승리!` : '만칼라 무승부!', text:`P1 ${state.board[6]}개 : P2 ${state.board[13]}개 · ${state.moves}수 · 모든 씨앗을 정산했어요.` });
        };
        if (reducedMotion()) { finishMove(); return; }
        state = { ...state, board:[...state.board] }; state.board[pit] = 0; inHand = result.steps.length; const interval = Math.min(.085,.95 / result.steps.length), start = s.time; board.style.setProperty('--sow-duration',`${interval}s`); fly(pit); flight.classList.add('in-flight'); render();
        s.message(`P${player} · 씨앗 ${result.steps.length}개를 나눠 담아요. 상대 저장소는 건너뛰어요.`);
        const sow = (n) => { if (n === result.steps.length) { s.later(.15,finishMove); return; } const at = result.steps[n]; state.board[at]++; inHand--; landing = at; fly(at); render(); s.later(Math.max(0,start + interval * (n + 2) - s.time),() => sow(n + 1)); };
        s.later(interval,() => sow(0));
    };
    s.on(board,'click',(event) => { const button = event.target.closest('.cell'); if (button) { choose(Number(button.dataset.index)); if (s.active()) s.focus(); } });
    const undo = () => { if (!locked) past.undo(); };
    s.controls([{ label:'한 수 되돌리기 · Z', action:undo, disabled:() => locked || !past.available() }]);
    s.bindKeys(['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Space','KeyZ'],(code) => { if (code === 'KeyZ') undo(); else if (code === 'Space') choose(selected); else choose(state.turn === 1 ? Number(code.slice(-1)) - 1 : 13 - Number(code.slice(-1))); });
    s.on(s.root,'keydown',(event) => {
        if (!['ArrowLeft','ArrowRight','Enter'].includes(event.code) || event.ctrlKey || event.metaKey || event.altKey) return;
        const cell = event.target.closest('.cell'); if (!cell && event.target !== s.root) return; event.preventDefault(); event.stopPropagation(); if (locked || !s.active()) return;
        if (event.code === 'Enter') { if (!event.repeat) choose(cell ? Number(cell.dataset.index) : selected); return; }
        const choices = (state.turn === 1 ? [0,1,2,3,4,5] : [12,11,10,9,8,7]).filter((i) => state.board[i]), at = Math.max(0,choices.indexOf(cell ? Number(cell.dataset.index) : selected)), next = choices[Math.max(0,Math.min(choices.length - 1,at + (event.code === 'ArrowRight' ? 1 : -1)))];
        if (next !== undefined) { selected = next; render(); buttons[next].focus({ preventScroll:true }); }
    });
    render(); s.message('아래 P1이 먼저! 1~6으로 자기 줄의 왼쪽부터 선택해요. 자기 저장소에서 끝나면 한 번 더, 빈 자기 칸에서 끝나면 맞은편을 포획해요.');
};
