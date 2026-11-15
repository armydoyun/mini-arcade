import { hexLayout } from './rules.js';

const p1 = '#ff8e7a', p2 = '#82b6ff', surface = '#17212b';
const rect = (x, y, width, height, opacity = 1, color = 'currentColor', radius = 4) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${color}" opacity="${opacity}"/>`;
const path = (d, opacity = 1, color = 'currentColor', width = 2.5) => `<path d="${d}" stroke="${color}" stroke-width="${width}" opacity="${opacity}"/>`;
const dot = (x, y, radius = 5, opacity = 1, color = 'currentColor') => `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" opacity="${opacity}"/>`;
const number = (value, x, y, size = 16, color = 'currentColor') => `<text x="${x}" y="${y}" fill="${color}" stroke="none" text-anchor="middle" dominant-baseline="central" font-family="system-ui,sans-serif" font-weight="650" font-size="${size}">${value}</text>`;
const cross = (x, y, radius = 8, color = 'currentColor') => path(`M${x - radius} ${y - radius}l${radius * 2} ${radius * 2}m0 ${-radius * 2}l${-radius * 2} ${radius * 2}`, 1, color, 3);
const ring = (x, y, radius = 8, color = 'currentColor', opacity = 1) => `<circle cx="${x}" cy="${y}" r="${radius}" stroke="${color}" stroke-width="2.5" opacity="${opacity}"/>`;
const star = (x, y, radius = 12) => `<path d="${Array.from({ length: 10 }, (_, i) => { const angle = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? radius * .45 : radius; return `${i ? 'L' : 'M'}${(x + Math.cos(angle) * r).toFixed(2)} ${(y + Math.sin(angle) * r).toFixed(2)}`; }).join('')}Z" fill="currentColor" stroke="none"/>`;

export const icon = (name) => {
    const shapes = {
        settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--bg)"/><circle cx="15" cy="17" r="3" fill="var(--bg)"/>',
        search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
        restart: '<path d="M4 10a8 8 0 1 1 2 8M4 4v6h6"/>',
        pause: '<path d="M9 5v14M15 5v14"/>', play: '<path d="m8 5 11 7-11 7z"/>',
        focus: '<path d="M8 4H4v4m12-4h4v4M4 16v4h4m8 0h4v-4"/>',
        close: '<path d="m6 6 12 12M18 6 6 18"/>', arrow: '<path d="M6 18 18 6M7 6h11v11"/>',
        back: '<path d="m10 5-7 7 7 7M3 12h18"/>',
        heart: '<path d="M12 20 4 12C-1 6 6 1 12 7c6-6 13-1 8 5z"/>',
        shuffle: '<path d="M3 6h3c4 0 8 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 4-3 6-6s4-6 6-6h3m-4-4 4 4-4 4"/>',
        result: '<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M9 8h6M9 12h6M9 16h3"/>'
    };
    if (name === 'brand') return '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M7 24V8h5l4 8 4-8h5v16h-5v-8l-4 7-4-7v8z"/></svg>';
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name] || shapes.play}</svg>`;
};

// Shared 140×112 drawing field, rounded strokes, quiet structure and clear playing pieces.
export const gameArt = (id) => {
    let art = '';
    switch (id) {
        case 'laser':
            art = rect(18,14,104,84,.08) + path('M28 88V50h55V23',.85,'#b9f86b',2) + path('M20 58 36 42M75 58 91 42',1,'#ddd6ef',4) + dot(28,88,7,1,p1) + ring(83,23,8,'#b9f86b') + rect(91,81,23,4,.3,'currentColor',2); break;
        case 'mancala':
            art = rect(14,24,112,66,.1,'currentColor',15) + rect(21,35,15,44,.2,'currentColor',7) + rect(104,35,15,44,.2,'currentColor',7);
            art += Array.from({length:12},(_,i) => { const x=44+i%6*10.5,y=44+Math.floor(i/6)*26; return ring(x,y,4,'currentColor',.45)+dot(x-1,y,1.4,.9,'currentColor')+dot(x+1.7,y+1.7,1.1,.7,'currentColor'); }).join('') + dot(112,57,4,1,p1); break;
        case 'sudoku':
            art = rect(26,12,88,88,.08) + Array.from({length:8},(_,i) => path(`M${26+(i+1)*88/9} 12v88M26 ${12+(i+1)*88/9}h88`,.18,'currentColor',.6)).join('') + path('M26 12h88v88H26ZM55.33 12v88M84.67 12v88M26 41.33h88M26 70.67h88',.5,'currentColor',1.5) + number(1,40.67,26.67,11) + number(9,99.33,36.44,11) + number(2,70,56,11) + number(8,40.67,85.33,11) + number(3,99.33,85.33,11); break;
        case 'pipes':
            art = rect(22,12,96,88,.07) + path('M37 28h33v29h33v28H70V57H37v28',.28,'currentColor',10) + path('M37 28h33v29h33v28H70V57H37v28',1,'currentColor',3) + dot(37,28,6) + ring(103,85,5,'currentColor') + dot(37,85,3); break;
        case 'territory':
            art = rect(20, 15, 100, 84, .08, 'currentColor', 5) + rect(20, 15, 42, 84, .26, 'currentColor', 4) + path('M62 16v83', .5) + path('M62 37h29v39H62', 1, '#f5d47d', 2) + dot(62, 76, 5) + path('m101 26 6 6-6 6-6-6z', 1, p1, 2.5); break;
        case 'bubbles':
            art = [[43, 23, p1], [65, 23, p2], [87, 23, p2], [109, 23, p1], [32, 42, p1], [54, 42, 'currentColor'], [76, 42, p2], [98, 42, 'currentColor'], [43, 61, 'currentColor']].map(([x, y, color]) => dot(x, y, 9.5, .8, color) + dot(x - 3, y - 3, 1.8, .45, '#fff')).join('') + path('M71 97 87 66', .5, p2, 1.5) + ring(90, 61, 9, p2, .5) + dot(70, 97, 8, 1, p2); break;
        case 'golf':
            art = rect(19, 20, 102, 79, .1, 'currentColor', 9) + rect(62, 62, 10, 36, .5, 'currentColor', 2) + dot(100, 57, 9, .2) + dot(100, 57, 5, 1, surface) + path('M100 57V23', 1, 'currentColor', 2) + `<path d="M101 24l19 6-19 7z" fill="currentColor" stroke="none"/>` + path('M42 78 55 50 86 52', .4, 'currentColor', 1.5) + dot(41, 79, 6, 1, '#edf0f4'); break;
        case 'switch-duo':
            art = rect(19, 23, 43, 66, .08, p1, 5) + rect(78, 23, 43, 66, .08, p2, 5) + rect(62, 45, 16, 35, .25, 'currentColor', 2) + path('M68 47v30m4-30v30', .65) + rect(30, 70, 21, 6, .5, 'currentColor', 2) + path('M41 72V99h58V64', .45, 'currentColor', 1.5) + dot(41, 55, 10, 1, p1) + number(1, 41, 55, 11, surface) + dot(100, 55, 10, 1, p2) + number(2, 100, 55, 11, surface); break;
        case 'tetris': {
            art = [[28, 83], [46, 83], [64, 83], [64, 65], [82, 83], [100, 83], [100, 65]].map(([x, y]) => rect(x, y, 15, 15, .32)).join('');
            art += [[46, 19], [64, 19], [82, 19], [64, 37]].map(([x, y]) => rect(x, y, 15, 15)).join(''); break;
        }
        case 'snake':
            art = path('M27 82H69V31h40', 1, 'currentColor', 16) + rect(98, 23, 18, 16, 1, 'currentColor', 6) + dot(111, 27, 1.8, 1, surface) + dot(111, 80, 7, 1, p1); break;
        case 'breakout': case 'swipe-break': {
            art = Array.from({ length: 12 }, (_, i) => rect(22 + i % 4 * 25, 14 + Math.floor(i / 4) * 15, 21, 10, 1 - Math.floor(i / 4) * .23, 'currentColor', 2)).join('');
            art += dot(79, 77, 5) + path('M71 84 61 94', .3);
            art += id === 'breakout' ? rect(47, 99, 46, 5, 1, 'currentColor', 2.5) : dot(62, 97, 3, .4) + number('+', 113, 77, 20); break;
        }
        case 'flappy':
            art = rect(24, 9, 20, 24, .18) + rect(22, 29, 24, 6, .55, 'currentColor', 2) + rect(24, 80, 20, 23, .18) + rect(22, 77, 24, 6, .55, 'currentColor', 2);
            art += rect(99, 9, 20, 44, .18) + rect(97, 49, 24, 6, .55, 'currentColor', 2) + rect(99, 95, 20, 8, .18);
            art += dot(70, 59, 13) + dot(65, 64, 6, .35, surface) + dot(75, 55, 3, 1, surface) + path('M82 59h7', 1, 'currentColor', 4); break;
        case 'merge':
            art = rect(24, 14, 42, 39, .18) + rect(74, 14, 42, 39, .32) + rect(24, 61, 42, 39, .32) + rect(74, 61, 42, 39, .18);
            art += number(2, 45, 34, 24) + number(4, 95, 34, 24) + number(8, 45, 81, 24) + number(16, 95, 81, 22); break;
        case 'mines':
            art = Array.from({ length: 9 }, (_, i) => rect(31 + i % 3 * 27, 17 + Math.floor(i / 3) * 27, 24, 24, .13)).join('');
            art += number(1, 43, 56, 17) + number(2, 97, 29, 17) + path('M70 91V48m-7 43h14') + '<path d="m70 48 18 8-18 8z" fill="currentColor" stroke="none"/>'; break;
        case 'nonogram': {
            const bits = '1101111111111110111000100';
            art = [...bits].map((value, i) => rect(31 + i % 5 * 16, 20 + Math.floor(i / 5) * 16, 13, 13, value === '1' ? .95 : .12, 'currentColor', 2)).join(''); break;
        }
        case 'sliding':
            art = Array.from({ length: 9 }, (_, i) => rect(32 + i % 3 * 27, 17 + Math.floor(i / 3) * 27, 23, 23, i === 8 ? .06 : .2) + (i < 8 ? number(i + 1, 43.5 + i % 3 * 27, 28.5 + Math.floor(i / 3) * 27, 15) : '')).join(''); break;
        case 'lights':
            art = Array.from({ length: 25 }, (_, i) => rect(28 + i % 5 * 18, 13 + Math.floor(i / 5) * 18, 15, 15, [7, 11, 12, 13, 17].includes(i) ? 1 : .12, 'currentColor', 3)).join(''); break;
        case 'flood': {
            const colors = ['#ff8e7a', '#82b6ff', '#b9f86b', '#f5d47d', '#c1a0ff', '#76d0c5'];
            art = Array.from({ length: 25 }, (_, i) => rect(28 + i % 5 * 18, 13 + Math.floor(i / 5) * 18, 15, 15, .82, colors[i < 11 && i % 5 < 3 ? 2 : (i * 3 + Math.floor(i / 5)) % 6], 2)).join(''); break;
        }
        case 'stack':
            art = [0, 1, 2, 3, 4].map((n) => rect(28 + n * 5, 88 - n * 17, 84 - n * 8, 12, .28 + n * .17, 'currentColor', 3)).join('') + path('M52 12h44', .2, 'currentColor', 1); break;
        case 'dodge':
            art = ring(70, 58, 23, 'currentColor', .2) + dot(70, 58, 8, 1, '#b9f86b');
            art += [[30, 24], [109, 43], [43, 90]].map(([x, y]) => dot(x, y, 7, .8, p1) + ring(x, y, 12, p1, .22)).join(''); break;
        case 'asteroids':
            art = path('M70 35 85 73 70 65 55 73Z') + path('m24 16 17 4 7 15-10 14-18-4-5-15zM112 70l13 11-6 17-17 1-8-15z', .42);
            art += dot(70, 22, 2.5) + dot(70, 12, 1.7, .4); break;
        case 'invaders': {
            const alien = (x, y, opacity) => `<g opacity="${opacity}">${rect(x + 4, y, 22, 16, 1, 'currentColor', 1)}${rect(x, y + 5, 30, 7, 1, 'currentColor', 1)}${rect(x + 3, y + 17, 6, 5, 1, 'currentColor', 1)}${rect(x + 21, y + 17, 6, 5, 1, 'currentColor', 1)}${rect(x + 8, y + 5, 4, 4, 1, surface, 0)}${rect(x + 18, y + 5, 4, 4, 1, surface, 0)}</g>`;
            art = alien(25, 19, .65) + alien(84, 19, .35) + alien(55, 52, 1) + path('M70 89v-8', .5) + '<path d="M50 103V94h14v-8h12v8h14v9z" fill="currentColor" stroke="none"/>'; break;
        }
        case 'catch':
            art = star(43, 29, 12) + star(98, 54, 15) + star(76, 16, 6) + path('M42 81 49 102h42l7-21', 1, 'currentColor', 3.5); break;
        case 'runner':
            art = path('M16 96h108', .3) + rect(48, 41, 25, 28) + dot(66, 48, 1.8, 1, surface) + rect(98, 72, 23, 24, .4, p1, 3) + path('M20 49h17M25 60h12', .45); break;
        case 'memory':
            art = rect(26, 15, 38, 38, .19) + rect(76, 15, 38, 38, .19) + rect(26, 65, 38, 38, .19) + rect(76, 65, 38, 38, .19);
            art += path('m45 24 10 10-10 10-10-10z') + path('m95 74 10 10-10 10-10-10z') + [89, 95, 101].map((x) => dot(x, 34, 1.6, .45)).join('') + [39, 45, 51].map((x) => dot(x, 84, 1.6, .45)).join(''); break;
        case 'simon':
            art = Array.from({ length: 4 }, (_, i) => rect(27 + i % 2 * 47, 15 + Math.floor(i / 2) * 47, 39, 39, i === 1 ? .9 : .2, 'currentColor', 9) + number(i + 1, 46.5 + i % 2 * 47, 34.5 + Math.floor(i / 2) * 47, 17, i === 1 ? surface : 'currentColor')).join(''); break;
        case 'maze':
            art = path('M22 16h96v82H22V16m25 0v28h24V16m0 28v27h24V44h23M22 71h25v27m24 0V71M47 44v27M95 16v28', .8, 'currentColor', 3);
            art += dot(34, 30, 4) + rect(103, 83, 8, 8, .75, '#b9f86b', 2); break;
        case 'tictactoe':
            art = path('M53 13v86m34-86v86M23 42h94M23 73h94', .3) + cross(38, 27, 8, p1) + ring(70, 58, 10, p2) + cross(102, 88, 8, p1); break;
        case 'gomoku':
            art = rect(18, 6, 104, 100, .09) + Array.from({ length: 5 }, (_, i) => path(`M${28 + i * 21} 14v84M28 ${14 + i * 21}h84`, .3, 'currentColor', 1)).join('');
            art += [[28, 14], [49, 35], [70, 56], [91, 77], [112, 98]].map(([x, y]) => dot(x, y, 7, 1, surface) + ring(x, y, 7, 'currentColor', .8)).join('') + dot(91, 35, 7, .8) + dot(49, 77, 7, .8); break;
        case 'connect-four': {
            const tokens = { 35: 1, 29: 1, 23: 1, 17: 1, 36: 2, 37: 1, 38: 2, 30: 2, 31: 2, 24: 2 };
            art = rect(16, 12, 108, 92, .12, 'currentColor', 7) + Array.from({ length: 42 }, (_, i) => dot(28 + i % 7 * 14, 23 + Math.floor(i / 7) * 14, 4.5, tokens[i] ? 1 : .18, tokens[i] === 1 ? p1 : tokens[i] === 2 ? p2 : 'currentColor')).join(''); break;
        }
        case 'reversi':
            art = rect(24, 10, 92, 92, .12) + path('M47 10v92m23-92v92m23-92v92M24 33h92M24 56h92M24 79h92', .22, 'currentColor', 1);
            art += dot(58.5, 44.5, 9, 1, surface) + ring(58.5, 44.5, 9, 'currentColor', .6) + dot(81.5, 67.5, 9, 1, surface) + ring(81.5, 67.5, 9, 'currentColor', .6) + dot(81.5, 44.5, 9, .9) + dot(58.5, 67.5, 9, .9); break;
        case 'dots':
            art = rect(29, 18, 25, 25, .13, p1, 2) + path('M28 17h26v26H28V17m52 52h26', 1, p1, 3) + path('M54 43h26v26H54', .85, p2, 3);
            art += Array.from({ length: 16 }, (_, i) => dot(28 + i % 4 * 26, 17 + Math.floor(i / 4) * 26, 3)).join(''); break;
        case 'hex': {
            const layout = hexLayout(3), scale = Math.min(108 / layout.width, 88 / layout.height), h = layout.unitHeight;
            const borders = layout.goals.map((d, i) => `<path d="${d}" stroke="${i < 2 ? p1 : p2}" stroke-width=".07"/>`).join('');
            const cells = layout.cells.map(({ x, y }, i) => `<path d="M0 ${h / 4} .5 0 1 ${h / 4}v${h / 2}l-.5 ${h / 4}-.5 ${-h / 4}Z" transform="translate(${x + .03} ${y + h * .03}) scale(.94)" fill="${[1, 4, 7].includes(i) ? p1 : 'currentColor'}" stroke="none" opacity="${[1, 4, 7].includes(i) ? .95 : .22}"/>`).join('');
            art = `<g transform="translate(${(140 - layout.width * scale) / 2} ${(112 - layout.height * scale) / 2}) scale(${scale})">${borders}${cells}</g>`; break;
        }

        case 'sokoban': {
            art = Array.from({ length: 16 }, (_, i) => rect(25 + i % 4 * 23, 12 + Math.floor(i / 4) * 23, 20, 20, .12, 'currentColor', 3)).join('');
            art += ring(81, 22, 6, '#b9f86b', .75) + ring(104, 68, 6, '#b9f86b', .75);
            for (const [x, y] of [[49, 36], [72, 59]]) art += rect(x, y, 18, 18, .95, 'currentColor', 3) + path(`M${x + 4} ${y + 4}l10 10m0-10-10 10`, .6, surface, 1.8);
            art += dot(35, 91, 8, 1, '#b9f86b') + dot(32, 89, 1.4, 1, surface) + dot(37, 89, 1.4, 1, surface); break;
        }
        case 'samegame': {
            const shades = ['#ff8e7a', '#82b6ff', '#b9f86b', '#f5d47d'], bits = [0,0,3,0, 1,1,3,2, 2,1,1,2, 2,2,3,3];
            art = bits.map((color, i) => color ? rect(28 + i % 4 * 23, 11 + Math.floor(i / 4) * 23, 20, 20, .85, shades[color - 1], 3) : '').join('');
            art += '<path d="M26 32v-21h44v21" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 4" opacity=".5"/>' + path('M104 18v14m-4-4 4 4 4-4', .8); break;
        }
        case 'wall-race':
            art = Array.from({ length: 16 }, (_, i) => rect(26 + i % 4 * 23, 14 + Math.floor(i / 4) * 23, 19, 19, .12)).join('');
            art += path('M26 9h89', .65, p1, 2) + path('M26 108h89', .65, p2, 2) + rect(68, 36, 5, 43, .9, 'currentColor', 2) + rect(26, 55, 43, 5, .9, 'currentColor', 2);
            art += dot(36, 92, 8, 1, p1) + dot(105, 23, 8, 1, p2); break;
        case 'tanks': {
            art = rect(60, 17, 18, 29, .23) + rect(62, 82, 30, 12, .23) + '<path d="M43 82h64V50" stroke="#ff8e7a" stroke-width="2" stroke-dasharray="4 5" opacity=".6"/>';
            for (const [x, y, angle, color] of [[32, 78, -36, p1], [108, 30, 143, p2]]) art += `<g transform="translate(${x} ${y}) rotate(${angle})">${rect(-14, -12, 28, 5, .4, color, 2)}${rect(-14, 7, 28, 5, .4, color, 2)}${rect(-14, -8, 26, 16, 1, color, 4)}${dot(0, 0, 6, 1, color)}${rect(3, -2.5, 22, 5, 1, color, 2)}</g>`;
            art += dot(107, 60, 3, 1, p1); break;
        }
        case 'pong':
            art = '<path d="M70 10v94" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 7" opacity=".25"/>' + ring(70, 57, 20, 'currentColor', .12);
            art += rect(24, 20, 7, 34, 1, p1, 3) + rect(109, 59, 7, 34, 1, p2, 3) + dot(82, 42, 5.5) + path('m65 50 8-4', .35); break;
        case 'cycles':
            art = path('M23 95V28h41v30h36V16', .8, p1, 4) + path('M118 94H83V78H43', .8, p2, 4) + rect(95, 11, 10, 10, 1, p1, 2) + rect(38, 73, 10, 10, 1, p2, 2); break;
    }
    return `<svg viewBox="0 0 140 112" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${art}</svg>`;
};
