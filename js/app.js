import { games } from './catalog.js';
import { createSession, node, formatTime, random } from './core.js';
import { icon, gameArt } from './icons.js';

const $ = (id) => document.getElementById(id), storageKey = 'mini-arcade-v1';
const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
let data, storageOK = true;
try { data = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { data = {}; }
data = { sound: true, motion: false, favorites: [], records: {}, modes: {}, latest: {}, seeds: {}, completed: {}, ...(object(data) ? data : {}) };
for (const field of ['records', 'modes', 'latest', 'seeds', 'completed']) if (!object(data[field])) data[field] = {};
data.sound = data.sound !== false; data.motion = data.motion === true;
data.favorites = Array.isArray(data.favorites) ? [...new Set(data.favorites)].filter((id) => games.some((game) => game.id === id)) : [];
const cleanRecord = (record) => {
    const next = { ...(object(record) ? record : {}) };
    for (const field of ['plays', 'p1', 'p2', 'draws']) next[field] = Number.isSafeInteger(next[field]) && next[field] >= 0 ? next[field] : 0;
    if (!Number.isSafeInteger(next.bestTie) || next.bestTie < 0) delete next.bestTie;
    if (!Number.isFinite(next.best)) { delete next.best; delete next.bestText; }
    for (const field of ['bestText', 'lastDate', 'modeLabel']) if (typeof next[field] !== 'string') delete next[field];
    return next;
};
for (const key of Object.keys(data.records)) data.records[key] = cleanRecord(data.records[key]);
for (const mode of games.find((game) => game.id === 'nonogram').modes) {
    const legacy = data.records[`nonogram:quality:${mode.id}`];
    if (data.completed[mode.id] !== 'clean' && data.completed[mode.id] !== 'assisted') {
        if (legacy?.plays) data.completed[mode.id] = legacy.best !== undefined ? 'clean' : 'assisted'; else delete data.completed[mode.id];
    }
}
let filter = 'all', category = '전체', session = null, current = null, returnFocus = null, toastTimer, navigation = null, activeHash = '';
let runningOptions = {}, recordVariant = 'classic', nextOptions = null, lastResult = null, fittedHeight = -1, playPlayers = 1, recordType = 'high';
const supports = (game, players) => game.players === players || game.modes?.some((mode) => mode.players === players);
const protectedGame = (game) => game.protectProgress || ['퍼즐', '기억·탐색', '턴제 대전'].includes(game.category);
const toast = (message) => {
    $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2600);
};
const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); storageOK = true; } catch { storageOK = false; }
    $('storage-status').hidden = storageOK; $('storage-status').textContent = '이번 실행 중에만 기록';
    return storageOK;
};
const recordKey = (game, variant = data.modes[game.id] || game.modes?.[0]?.id || 'classic') => `${game.id}:v3:${variant}`;
const recordText = (game, key) => {
    const recent = data.latest[game.id]; key ||= recent?.startsWith(`${game.id}:v3:`) ? recent : recordKey(game);
    const record = cleanRecord(data.records[key]);
    if (!record.plays) return '첫 기록에 도전 ↗';
    const kind = game.modes?.find((mode) => mode.id === key.split(':')[2])?.record || game.record;
    return kind === 'duel' ? `${record.plays}번의 대결` : record.bestText || `${record.plays}번 플레이`;
};
const completionKey = (game, mode) => game.id === 'nonogram' ? mode : `${game.id}:${mode}`;
for (const game of games.filter((item) => item.progress)) for (const mode of game.modes) { const key = completionKey(game, mode.id); if (!['clean', 'assisted'].includes(data.completed[key])) delete data.completed[key]; }
const completedCount = (game) => game.modes.filter((mode) => ['clean', 'assisted'].includes(data.completed[completionKey(game, mode.id)])).length;
const filtered = () => games.filter((game) => {
    const player = filter === 'all' || (filter === 'favorite' ? data.favorites.includes(game.id) : filter === 'new' ? game.fresh : supports(game, Number(filter)));
    return player && (category === '전체' || game.category === category) && `${game.name} ${game.id} ${game.category}`.toLowerCase().includes($('game-search').value.trim().toLowerCase());
}).sort((a, b) => Number(b.fresh) - Number(a.fresh));
const renderCards = () => {
    const list = filtered(); $('game-grid').replaceChildren(); $('game-count').textContent = list.length; $('no-games').hidden = list.length > 0;
    for (const game of list) {
        const card = node('article', 'game-card'); card.style.setProperty('--game-color', game.color);
        const link = node('a', 'game-link'); link.href = `#${game.id}`; link.dataset.game = game.id;
        const art = node('div', 'game-art'); art.innerHTML = gameArt(game.id); art.append(node('span', 'card-number', String(games.indexOf(game) + 1).padStart(2, '0')));
        if (game.fresh) art.append(node('span', 'card-new', 'NEW'));
        const copy = node('div', 'card-copy'), row = node('div', 'card-title-row');
        const mixed = supports(game, 1) && supports(game, 2), together = supports(game, 2);
        row.append(node('h3', '', game.name), node('span', `player-badge ${together ? 'duo' : ''}`, mixed ? '1–2P' : `${game.players}P${game.coop ? ' · CO-OP' : together ? ' · LOCAL' : ''}`));
        copy.append(row, node('p', '', game.description));
        const bottom = node('div', 'card-bottom'); bottom.append(node('span', '', game.category), node('span', '', game.progress ? `완료 ${completedCount(game)} / ${game.modes.length}` : recordText(game)));
        copy.append(bottom); link.append(art, copy);
        const favorite = node('button', 'favorite-button'); favorite.type = 'button'; favorite.innerHTML = icon('heart');
        favorite.setAttribute('aria-label', `${game.name} 즐겨찾기`); favorite.setAttribute('aria-pressed', data.favorites.includes(game.id)); favorite.title = `${game.name} 즐겨찾기`; favorite.dataset.favorite = game.id;
        card.append(link, favorite); $('game-grid').append(card);
    }
};
const updateRecord = () => {
    const key = recordKey(current, recordVariant), record = cleanRecord(data.records[key]); $('record-value').textContent = recordText(current, key);
    $('record-detail').textContent = !record.plays ? '첫 번째 한 판을 시작해 보세요.' : recordType === 'duel' ? `P1 ${record.p1}승 · P2 ${record.p2}승 · 무승부 ${record.draws}` : `${record.plays}회 플레이 · ${storageOK ? `마지막 ${record.lastDate || ''}` : '이번 실행 중 기록'}`;
};
const setIcon = (id, name, label) => { const button = $(id); button.innerHTML = icon(name); button.title = label; button.setAttribute('aria-label', label); };
const fitFrame = () => {
    if (!current || !window.innerHeight) return;
    const panel = $('game-panel').getBoundingClientRect(), frame = $('game-frame').getBoundingClientRect();
    const height = Math.max(190, Math.floor(window.innerHeight - frame.top - (window.scrollY || 0) - (panel.bottom - frame.bottom) - 10));
    if (height !== fittedHeight) { fittedHeight = height; $('game-frame').style.setProperty('--surface-height', `${height - 2}px`); }
};
const setPause = (value) => {
    if (!session || session.over || session.waiting || session.paused === value) return;
    session.pause(value); if (session.over) return;
    $('game-root').inert = value; setIcon('pause', value ? 'play' : 'pause', value ? '계속하기 · P' : '일시정지 · P');
    if (!value) { $('game-overlay').hidden = true; session.focus(); return; }
    $('overlay-inspect').hidden = true; $('overlay-next').hidden = true; $('overlay-stats').replaceChildren(); $('game-overlay').classList.remove('result');
    $('overlay-tag').textContent = 'TAKE A BREATH'; $('overlay-title').textContent = '잠시 쉬는 중'; $('overlay-text').textContent = '준비되면 이어서 플레이하세요.';
    $('overlay-action').textContent = '계속하기'; $('overlay-action').classList.add('primary'); $('overlay-action').classList.remove('secondary'); $('game-overlay').hidden = false;
    if (!$('settings-dialog').open && !$('leave-dialog').open) $('overlay-action').focus({ preventScroll: true });
};
const requestLeave = (action, label = '진행 끝내기') => {
    if (!session || session.over || !session.dirty || !protectedGame(current)) { action(); return; }
    navigation = { action, wasPaused: session.paused }; setPause(true);
    $('leave-text').textContent = `${current.name}의 현재 진행은 초기화돼요. 이 판을 계속하거나, 진행을 끝내고 이동할 수 있어요.`;
    $('leave-confirm').textContent = label; $('leave-dialog').returnValue = 'cancel'; $('leave-dialog').showModal();
};
const renderModes = () => {
    $('game-mode').replaceChildren(...(current.modes || []).map((mode) => {
        const complete = data.completed[completionKey(current, mode.id)], mark = current.progress ? complete === 'clean' ? '✓ ' : complete === 'assisted' ? '◐ ' : '' : '';
        const option = node('option', '', `${mark}${mode.name}`); option.value = mode.id; return option;
    }));
    $('game-mode').value = runningOptions.mode;
};
const showResult = (show) => {
    if (!lastResult) return;
    $('game-overlay').hidden = !show; $('game-root').inert = show; $('result-open').hidden = show;
    if (show) (nextOptions ? $('overlay-next') : $('overlay-action')).focus({ preventScroll: true }); else session.focus();
};
const finish = (result) => {
    const key = recordKey(current, result.recordKey), record = cleanRecord(data.records[key]), order = result.order || recordType;
    let improved = false; record.plays++; record.lastDate = new Date().toLocaleDateString('ko-KR'); record.modeLabel = $('record-mode').textContent;
    if (recordType === 'duel') {
        if (result.winner) record[`p${result.winner}`]++; else record.draws++;
    } else if (!result.practice && Number.isFinite(result.score) && (order !== 'low' || result.win !== false)) {
        if (record.best === undefined || (order === 'low' ? result.score < record.best : result.score > record.best) || (result.score === record.best && Number.isFinite(result.tieScore) && result.tieScore < (record.bestTie ?? Infinity))) {
            improved = true; record.best = result.score; record.bestTie = Number.isFinite(result.tieScore) ? result.tieScore : undefined; record.bestText = result.recordText || `${result.score.toLocaleString()}점`;
        }
    }
    data.records[key] = record; data.latest[current.id] = key;
    if (current.progress && result.win !== false) {
        const complete = completionKey(current, runningOptions.mode);
        if (!result.practice || data.completed[complete] !== 'clean') data.completed[complete] = result.practice ? 'assisted' : 'clean';
        renderModes();
    }
    const saved = save(); updateRecord(); lastResult = result;
    $('game-overlay').classList.add('result'); $('overlay-tag').textContent = result.practice ? 'PRACTICE COMPLETE' : improved ? 'NEW PERSONAL BEST' : 'WELL PLAYED';
    $('overlay-title').textContent = result.title || '한 판 완료!'; $('overlay-text').textContent = result.text || `${result.score || 0}점`;
    const recordStatus = !saved ? '이번 실행 중' : result.practice ? '연습' : improved ? '최고 기록!' : '저장 완료';
    $('overlay-stats').replaceChildren(...[['플레이 시간', formatTime(result.seconds, current.id === 'tetris' && runningOptions.mode === 'sprint')], ['기록', recordStatus]].map(([label, value]) => {
        const item = node('div'); item.append(node('small', '', label), node('strong', '', value)); return item;
    }));
    nextOptions = result.next || null;
    if (current.progress) {
        const index = current.modes.findIndex((mode) => mode.id === runningOptions.mode), next = [...current.modes.slice(index + 1), ...current.modes.slice(0, index + 1)].find((mode) => !data.completed[completionKey(current, mode.id)]);
        nextOptions = next ? { mode: next.id } : null;
    }
    $('overlay-next').hidden = !nextOptions; $('overlay-next').textContent = result.nextLabel || '다음 미완료 퍼즐 →';
    $('overlay-action').textContent = current.coop ? '함께 다시 · R' : playPlayers === 2 ? '다시 대결 · R' : current.seeded ? '같은 문제 다시 · R' : '다시 도전 · R';
    $('overlay-action').classList.toggle('primary', !nextOptions); $('overlay-action').classList.toggle('secondary', !!nextOptions);
    $('overlay-inspect').hidden = false; $('pause').disabled = true; $('game-message').textContent = result.title || '한 판 완료'; showResult(true);
};
const start = (game, extra = {}) => {
    const same = current?.id === game.id, previous = same ? runningOptions : {};
    let mode = extra.mode || previous.mode || game.modes?.find((item) => item.id === data.modes[game.id])?.id || game.modes?.[0]?.id || 'classic';
    if (game.progress && !same && !extra.mode && data.completed[completionKey(game, mode)]) mode = game.modes.find((item) => !data.completed[completionKey(game, item.id)])?.id || mode;
    runningOptions = { mode };
    const modeInfo = game.modes?.find((item) => item.id === mode); playPlayers = modeInfo?.players || game.players; recordType = modeInfo?.record || game.record;
    if (game.seeded) {
        const key = `${game.id}:${mode}`, remembered = extra.seed ?? (same && previous.mode === mode ? previous.seed : data.seeds[key]);
        runningOptions.seed = !extra.fresh && Number.isInteger(remembered) && remembered > 0 && remembered <= 0xffffffff ? remembered : random(1, 0xffffffff);
        data.seeds[key] = runningOptions.seed;
    }
    data.modes[game.id] = mode; save(); recordVariant = mode; nextOptions = lastResult = null;
    session?.destroy(); current = game; document.body.classList.add('playing');
    $('game-root').dataset.game = game.id; $('game-root').style.setProperty('--game-color', game.color); $('game-root').setAttribute('aria-label', `${game.name} 게임 화면`);
    $('game-root').setAttribute('aria-disabled', 'false'); $('game-root').inert = false; $('practice-badge').hidden = true;
    $('game-mode-wrap').hidden = !game.modes; renderModes(); $('record-mode').textContent = game.modes?.find((item) => item.id === mode)?.name || '클래식';
    $('home').hidden = true; $('play').hidden = false; $('game-overlay').hidden = true; $('result-open').hidden = true; $('new-puzzle').hidden = !game.seeded;
    $('game-hud').replaceChildren(); $('game-tools').replaceChildren(); $('game-message').textContent = ''; $('play-title').textContent = game.name;
    $('play-category').textContent = `${playPlayers} PLAYER${playPlayers === 2 ? `S · 한 기기 ${game.coop ? '협동' : '로컬'}` : ''} / ${game.category}`;
    $('game-description').textContent = game.description; $('game-rules').replaceChildren(...game.rules.map((rule) => node('p', '', rule)));
    $('game-controls').replaceChildren(...[...game.controls, ...(game.seeded ? ['R 같은 문제', 'N 새 문제'] : [])].map((control) => node('span', '', control)));
    setIcon('restart', 'restart', game.seeded ? '같은 문제 다시 · R' : '처음부터 다시 · R');
    $('pause').disabled = false; setIcon('pause', 'pause', '일시정지 · P'); updateRecord();
    session = createSession($('game-root'), {
        options: runningOptions, ready: (value) => { $('pause').disabled = value; }, ended: () => { $('pause').disabled = true; },
        assist: () => { $('practice-badge').hidden = false; }, variant: (key, label) => { recordVariant = key; if (label) $('record-mode').textContent = label; updateRecord(); },
        hud: (items) => {
            if ($('game-hud').children.length !== items.length) $('game-hud').replaceChildren(...items.map(() => { const item = node('div', 'hud-item'); item.append(node('small'), node('strong')); return item; }));
            items.forEach(([label, value, style = ''], index) => {
                const item = $('game-hud').children[index]; item.className = `hud-item ${style}`;
                if (item.children[0].textContent !== String(label)) item.children[0].textContent = label;
                if (item.children[1].textContent !== String(value)) item.children[1].textContent = String(value);
            });
        },
        message: (value) => { if ($('game-message').textContent !== value) $('game-message').textContent = value; },
        controls: () => $('game-tools'), finish, sound: () => data.sound, autopause: () => setPause(true)
    });
    try { game.create(session); } catch (error) { console.error(error); session.destroy(); toast('게임을 시작하지 못했어요. 목록에서 다시 선택해 주세요.'); }
    fittedHeight = -1; fitFrame(); session.focus();
};
const applyRoute = (game) => {
    if (game) { if (current?.id !== game.id) { start(game); window.scrollTo(0, 0); } }
    else {
        session?.destroy(); session = null; current = null; lastResult = null; document.body.classList.remove('cinema', 'playing'); $('focus-mode').setAttribute('aria-pressed', 'false');
        $('play').hidden = true; $('home').hidden = false; renderCards();
        if (returnFocus) { const target = document.querySelector(`[data-game="${returnFocus}"]`); target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'nearest' }); returnFocus = null; }
    }
};
const route = () => {
    const targetHash = location.hash, game = games.find((item) => item.id === targetHash.slice(1));
    if (current && game?.id !== current.id && session?.dirty && !session.over && protectedGame(current)) {
        window.history.replaceState(null, '', activeHash || '#');
        requestLeave(() => { window.history.replaceState(null, '', targetHash || '#'); activeHash = targetHash; applyRoute(game); }, '진행 끝내고 이동');
    } else { activeHash = targetHash; applyRoute(game); }
};
$('leave-dialog').addEventListener('close', () => {
    const pending = navigation; navigation = null; if (!pending) return;
    if ($('leave-dialog').returnValue === 'leave') { session.dirty = false; pending.action(); }
    else { $('game-mode').value = runningOptions.mode; if (session.waiting) session.focus(); else if (!pending.wasPaused) setPause(false); else $('overlay-action').focus({ preventScroll: true }); }
});
$('game-grid').addEventListener('click', (event) => {
    const favorite = event.target.closest('[data-favorite]');
    if (favorite) {
        const id = favorite.dataset.favorite; data.favorites = data.favorites.includes(id) ? data.favorites.filter((item) => item !== id) : [...data.favorites, id]; save(); renderCards();
        const next = document.querySelector(`[data-favorite="${id}"]`) || $('game-grid').querySelector('a') || $('game-search'); next.focus({ preventScroll: true });
    }
    const link = event.target.closest('[data-game]'); if (link) returnFocus = link.dataset.game;
});
document.querySelectorAll('[data-player]').forEach((button) => button.addEventListener('click', () => {
    filter = button.dataset.player; document.querySelectorAll('[data-player]').forEach((item) => { item.classList.toggle('selected', item === button); item.setAttribute('aria-pressed', item === button); }); renderCards();
}));
for (const name of ['전체', ...new Set(games.map((game) => game.category))]) {
    const button = node('button', name === category ? 'selected' : '', name); button.setAttribute('aria-pressed', name === category);
    button.addEventListener('click', () => { category = name; [...$('category-filters').children].forEach((item) => { item.classList.toggle('selected', item === button); item.setAttribute('aria-pressed', item === button); }); renderCards(); });
    $('category-filters').append(button);
}
$('game-search').addEventListener('input', renderCards);
$('random-game').addEventListener('click', () => { const list = filtered(); if (list.length) location.hash = list[random(0, list.length - 1)].id; else toast('필터를 바꾸면 새로운 한 판을 찾을 수 있어요.'); });
$('browse-games').addEventListener('click', () => { $('game-search').focus({ preventScroll: true }); document.querySelector('.collection').scrollIntoView({ block: 'start' }); });
$('back-home').addEventListener('click', () => { location.hash = ''; });
$('restart').addEventListener('click', () => { if (current) requestLeave(() => start(current), current.seeded ? '같은 문제 다시' : '처음부터 다시'); });
const newPuzzle = () => { if (current?.seeded) requestLeave(() => start(current, { fresh: true }), '새 문제 시작'); };
$('new-puzzle').addEventListener('click', newPuzzle);
$('pause').addEventListener('click', () => setPause(!session?.paused));
$('overlay-action').addEventListener('click', () => { if (session?.over) start(current); else setPause(false); });
$('overlay-next').addEventListener('click', () => { if (nextOptions) start(current, nextOptions); });
$('overlay-inspect').addEventListener('click', () => showResult(false)); $('result-open').addEventListener('click', () => showResult(true));
$('overlay-home').addEventListener('click', () => { location.hash = ''; });
$('game-mode').addEventListener('change', (event) => { const mode = event.target.value; $('game-mode').value = runningOptions.mode; requestLeave(() => start(current, { mode }), '모드 바꾸고 새 판'); });
const toggleFocus = () => {
    const value = !document.body.classList.contains('cinema'); document.body.classList.toggle('cinema', value); $('focus-mode').setAttribute('aria-pressed', value);
    fittedHeight = -1; fitFrame(); session?.focus();
};
$('focus-mode').addEventListener('click', toggleFocus);
for (const [id, name, label] of [['settings-open', 'settings', '설정'], ['settings-close', 'close', '설정 닫기'], ['restart', 'restart', '처음부터 다시 · R'], ['new-puzzle', 'shuffle', '새 문제 · N'], ['focus-mode', 'focus', '집중 모드 · F'], ['result-open', 'result', '결과 다시 보기 · Esc']]) setIcon(id, name, label);
$('brand-mark').innerHTML = icon('brand'); $('search-icon').innerHTML = icon('search'); $('random-icon').innerHTML = icon('arrow');
$('back-home').innerHTML = `${icon('back')}<span>게임 목록</span>`; document.querySelector('[data-player="favorite"]').innerHTML = icon('heart');
$('hero-art').innerHTML = ['tetris', 'snake', 'tictactoe', 'pong'].map((id) => `<span style="--game-color:${games.find((game) => game.id === id).color}">${gameArt(id)}</span>`).join('');
$('settings-open').addEventListener('click', () => { setPause(true); $('sound-setting').checked = data.sound; $('motion-setting').checked = data.motion; $('settings-dialog').showModal(); });
$('sound-setting').addEventListener('change', (event) => { data.sound = event.target.checked; save(); });
$('motion-setting').addEventListener('change', (event) => { data.motion = event.target.checked; document.body.classList.toggle('reduce-motion', data.motion); save(); });
document.body.classList.toggle('reduce-motion', data.motion);
document.addEventListener('visibilitychange', () => { if (document.hidden) setPause(true); });
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || $('settings-dialog').open || $('leave-dialog').open || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
    if (event.repeat && ['KeyF', 'KeyP', 'KeyR', 'KeyN', 'Escape'].includes(event.code)) return;
    if (session && event.code === 'KeyF') { event.preventDefault(); toggleFocus(); }
    else if (session && event.code === 'KeyR') { event.preventDefault(); requestLeave(() => start(current), current.seeded ? '같은 문제 다시' : '처음부터 다시'); }
    else if (session && event.code === 'KeyN' && current.seeded) { event.preventDefault(); newPuzzle(); }
    else if (session?.over && event.code === 'Escape') { event.preventDefault(); showResult($('game-overlay').hidden); }
    else if (session && ['Escape', 'KeyP'].includes(event.code)) { event.preventDefault(); setPause(!session.paused); }
    else if (!session && event.key === '/') { event.preventDefault(); $('game-search').focus(); }
});
new ResizeObserver(fitFrame).observe($('game-panel')); window.addEventListener('resize', fitFrame);
window.addEventListener('hashchange', route); renderCards(); route();
