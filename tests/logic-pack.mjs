import assert from 'node:assert/strict';
import { laserPuzzles, pipePuzzles, sudokuPuzzles } from '../js/puzzles.js';
import { laserTrace, parseLaser, rotatePorts, pipeNetwork, sudokuSolve, mancalaMove } from '../js/rules.js';
import { games } from '../js/catalog.js';
import { Element, tick, advance, key, mount, check, counts } from './harness.mjs';

// Independent beam oracle uses vectors and walks whole rays instead of queued cell directions.
const referenceLaser = (puzzle,mask) => {
    const rows=puzzle.map.split('/'),size=rows[0].length,tiles=[...rows.join('')],mirrors=tiles.flatMap((c,i)=>c==='M'?[i]:[]),origin=tiles.indexOf('S'),dirs=[[0,-1],[1,0],[0,1],[-1,0]],stack=[[origin%size,Math.floor(origin/size),...dirs[puzzle.direction]]],seen=new Set(),lit=new Set();
    while(stack.length){let[x,y,dx,dy]=stack.pop();while(true){const state=`${x},${y},${dx},${dy}`;if(seen.has(state))break;seen.add(state);x+=dx;y+=dy;if(x<0||y<0||x>=size||y>=rows.length||rows[y][x]==='#')break;const at=y*size+x,c=rows[y][x];if(c==='T')lit.add(at);if(c==='M')[dx,dy]=mask&(1<<mirrors.indexOf(at))?[dy,dx]:[-dy,-dx];if(c==='+'){stack.push([x,y,-dy,dx],[x,y,dy,-dx]);}}}
    return [...lit].sort((a,b)=>a-b);
};
const bits = (n) => {let sum=0;for(;n;n&=n-1)sum++;return sum;};
let t;
for (let i=0;i<laserPuzzles.length;i++) {
    const puzzle=laserPuzzles[i],level=parseLaser(puzzle.map,puzzle.direction),wins=[];
    for(let mask=0;mask<1<<level.mirrors.length;mask++){
        const trace=laserTrace(level,mask); assert.deepEqual([...trace.lit].sort((a,b)=>a-b),referenceLaser(puzzle,mask));
        check(trace.segments.length<=level.tiles.length*4,'Beam traversal is bounded even with branches and loops'); if(trace.win)wins.push(mask);
    }
    check(wins.length===1&&wins[0]===puzzle.solution&&!wins.includes(puzzle.initial),'Every laser puzzle has one reachable orientation solution and starts unsolved');
    check(puzzle.par===Math.min(...wins.map(mask=>bits(mask^puzzle.initial))),'Displayed minimum laser rotations matches exhaustive search');
    t=mount('laser',{mode:`stage-${i}`}); let first=true;
    for(let m=0;m<level.mirrors.length;m++)if((puzzle.initial^puzzle.solution)&(1<<m)){
        const at=level.mirrors[m];t.click(at);
        if(first&&!t.s.over){key('KeyZ');check(t.state.hud[1][1]===0,'Laser undo restores the original rotation count');t.click(at);first=false;}
    }
    advance(.3);check(t.state.results.length===1&&t.state.results[0].score===puzzle.par&&!t.state.results[0].practice,`Laser ${i+1} completes through actual clicks at the certified minimum`);t.destroy();
}
const cycle=parseLaser('...../.M.M./.S.T./.M.M./.....',0),loop=laserTrace(cycle,6);check(loop.repeated&&loop.win&&loop.segments.length<100,'A closed beam loop terminates traversal and still counts its targets');
t=mount('laser');const laserBefore=t.state.hud[1][1];t.click(parseLaser(laserPuzzles[0].map).source);check(t.state.hud[1][1]===laserBefore,'Fixed optical pieces do not consume rotations');key('KeyH');key('KeyZ');check(t.s.practice&&t.state.hud[1][1]===0,'Undo cannot restore ranking eligibility after a laser hint');t.destroy();

// Independent pipe CSP: explicit directional booleans, border pruning and arc consistency.
const referencePipes = (puzzle) => {
    const size=puzzle.size,shape=[...puzzle.initial].map(n=>parseInt(n,16)),target=[...puzzle.solution].map(n=>parseInt(n,16)),solutions=[];
    const rotate=v=>((v*2)&15)+(v>=8?1:0),has=(v,d)=>!!(v&(1<<d)),next=(i,d)=>{const x=i%size+[0,1,0,-1][d],y=Math.floor(i/size)+[-1,0,1,0][d];return x<0||y<0||x>=size||y>=size?-1:y*size+x;};
    const start=shape.map((v,i)=>{let choices=[];for(let n=0;n<4;n++){if(!choices.includes(v))choices.push(v);v=rotate(v);}if(puzzle.fixed.includes(i))choices=[target[i]];return choices.filter(v=>[0,1,2,3].every(d=>next(i,d)>=0||!has(v,d)));});
    const connected=b=>{const seen=new Set([puzzle.source]),queue=[puzzle.source];for(let h=0;h<queue.length;h++)for(let d=0;d<4;d++){const j=next(queue[h],d);if(j>=0&&has(b[queue[h]],d)&&has(b[j],(d+2)%4)&&!seen.has(j)){seen.add(j);queue.push(j);}}return seen.size===b.length;};
    const search=input=>{if(solutions.length>=2)return;let dom=input.map(a=>[...a]),changed=true;while(changed){changed=false;for(let i=0;i<dom.length;i++)for(let d=0;d<4;d++){const j=next(i,d);if(j<0)continue;const a=dom[i].filter(v=>dom[j].some(w=>has(v,d)===has(w,(d+2)%4)));if(!a.length)return;if(a.length!==dom[i].length){dom[i]=a;changed=true;}}}let at=-1;dom.forEach((a,i)=>{if(a.length>1&&(at<0||a.length<dom[at].length))at=i;});if(at<0){const b=dom.map(a=>a[0]);if(connected(b))solutions.push(b);return;}for(const v of dom[at]){const clone=dom.map(a=>[...a]);clone[at]=[v];search(clone);}};
    search(start);return solutions;
};
check(pipeNetwork([6,12,3,9],2,0).win,'A complete connected loop with matched ports is legal');
const leaking=pipeNetwork([7,12,3,9],2,0);check(leaking.connected.size===4&&leaking.leaks.length===1&&!leaking.win,'Connecting every tile does not hide a boundary leak');
const disconnected=pipeNetwork([6,12,6,12,3,9,3,9],4,0);check(!disconnected.leaks.length&&disconnected.connected.size===4&&!disconnected.win,'Two isolated complete circuits cannot win');
for(let i=0;i<pipePuzzles.length;i++){
    const puzzle=pipePuzzles[i],solution=[...puzzle.solution].map(n=>parseInt(n,16)),initial=[...puzzle.initial].map(n=>parseInt(n,16)),solved=referencePipes(puzzle);
    check(solved.length===1,'Pipe orientation puzzle has exactly one connected solution');assert.deepEqual(solved[0],solution);check(pipeNetwork(solution,puzzle.size,puzzle.source).win&&!pipeNetwork(initial,puzzle.size,puzzle.source).win,'Certified pipe solution connects all ports and initial state is unsolved');
    let minimum=0;initial.forEach((v,at)=>{minimum+=Math.min(...[0,1,2,3].filter(n=>rotatePorts(v,n)===solution[at]).map(n=>Math.min(n,4-n)));});check(minimum===puzzle.par,'Pipe minimum counts clockwise and counterclockwise quarter turns');
    t=mount('pipes',{mode:`stage-${i}`});let first=true;
    for(let at=0;at<initial.length;at++){
        if(initial[at]===solution[at])continue;const options=[1,-1,2].filter(n=>rotatePorts(initial[at],n)===solution[at]),turn=options[0];
        const rotate=()=>turn<0?t.cells()[at].parent.emit('contextmenu',{target:t.cells()[at]}):t.click(at);
        rotate();if(first){key('KeyZ');check(t.state.hud[2][1]===`0 / ${puzzle.par}`,'Pipe undo restores count and board before replay');rotate();first=false;}if(turn===2)t.click(at);
    }
    advance(.3);check(t.state.results.length===1&&t.state.results[0].score===puzzle.par&&!t.state.results[0].practice,`Pipe ${i+1} completes with real left/right clicks at minimum rotations`);t.destroy();
}
t=mount('pipes');t.click(pipePuzzles[0].source);check(String(t.state.hud[2][1]).startsWith('0 /'),'Fixed pipe source cannot rotate');key('KeyH');key('KeyZ');check(t.s.practice,'Pipe assistance remains practice after undo');t.destroy();

const units=[];for(let r=0;r<9;r++)units.push(Array.from({length:9},(_,c)=>r*9+c));for(let c=0;c<9;c++)units.push(Array.from({length:9},(_,r)=>r*9+c));for(let y=0;y<3;y++)for(let x=0;x<3;x++)units.push(Array.from({length:9},(_,i)=>(y*3+Math.floor(i/3))*9+x*3+i%3));
const independentSudoku=input=>{
    const board=[...input],solutions=[],houses=Array.from({length:81},(_,i)=>units.filter(u=>u.includes(i)));
    const search=()=>{if(solutions.length===2)return;let at=-1,choices=null;for(let i=0;i<81;i++)if(!board[i]){const used=new Set(houses[i].flatMap(u=>u.map(j=>board[j]))),allowed=[1,2,3,4,5,6,7,8,9].filter(n=>!used.has(n));if(!allowed.length)return;if(!choices||allowed.length<choices.length){at=i;choices=allowed;if(choices.length===1)break;}}if(at<0){solutions.push([...board]);return;}for(const n of choices){board[at]=n;search();if(solutions.length===2)break;}board[at]=0;};search();return solutions;
};
for(let i=0;i<sudokuPuzzles.length;i++){
    const puzzle=sudokuPuzzles[i],givens=[...puzzle.givens].map(Number),answers=independentSudoku(givens);check(answers.length===1,'Independent set-based Sudoku search certifies a unique answer');assert.deepEqual(sudokuSolve(givens),answers);check(units.every(u=>new Set(u.map(at=>answers[0][at])).size===9),'Sudoku solution satisfies every row, column and box');
    t=mount('sudoku',{mode:`stage-${i}`});for(let at=0;at<81;at++)if(!givens[at]){t.click(at);key(`Digit${answers[0][at]}`);}advance(.25);check(t.state.results.length===1&&!t.state.results[0].practice&&t.state.results[0].recordKey===`stage-${i}`&&t.state.results[0].score>=1,`Sudoku ${i+1} completes with actual cell and digit events`);t.destroy();
}
check(sudokuSolve(Array(81).fill(1)).length===0&&sudokuSolve(Array(80).fill(0)).length===0,'Sudoku rejects conflicting and malformed boards');
t=mount('sudoku');const timeGiven=[...sudokuPuzzles[0].givens].map(Number),timeAnswer=sudokuSolve(timeGiven,1)[0],empty=timeGiven.flatMap((n,i)=>n?[]:[i]);for(const at of empty.slice(0,-1)){t.click(at);key(`Digit${timeAnswer[at]}`);}tick();advance(59.98);t.click(empty.at(-1));key(`Digit${timeAnswer[empty.at(-1)]}`);const finalClock=t.state.hud[1][1];advance(.3);check(finalClock===t.state.hud[1][1]&&t.state.results[0].score===59&&finalClock==='0:59','Sudoku freezes displayed and recorded time at completion across a minute boundary');t.destroy();
t=mount('sudoku');const given=[...sudokuPuzzles[0].givens].map(Number),a=given.findIndex(n=>!n),row=units[Math.floor(a/9)],b=row.find(i=>i!==a&&!given[i]),value=sudokuSolve(given,1)[0][a];
t.click(b);key('KeyN');key(`Digit${value}`);check(t.cells()[b].getAttribute('aria-label').includes(`메모 ${value}`),'Pencil mode records a candidate');key(`Digit${value}`);check(!t.cells()[b].getAttribute('aria-label').includes('메모'),'Typing the same candidate toggles it off');key(`Digit${value}`);key('KeyN');t.click(a);key(`Digit${value}`);check(!t.cells()[b].getAttribute('aria-label').includes('메모'),'Placing a digit clears its peer notes');key('KeyZ');check(t.cells()[b].getAttribute('aria-label').includes(`메모 ${value}`),'Undo restores automatic note cleanup');
const duplicate=row.find(i=>given[i]);t.click(a);key(`Digit${given[duplicate]}`);check(t.cells()[a].classList.contains('sudoku-conflict')&&t.cells()[duplicate].classList.contains('sudoku-conflict'),'Both ends of a duplicate are marked without revealing unrelated answer mistakes');key('KeyZ');
t.click(duplicate);const fixed=t.cells()[duplicate].innerHTML;key('Digit9');check(t.cells()[duplicate].innerHTML===fixed,'Given digits are immutable');
tick();const before=t.s.elapsed();tick(1);check(!t.s.paused&&Math.abs(t.s.elapsed()-before-1)<1e-7,'Passive board clocks tolerate slow redraws without blocking inputs');t.s.pause(true);const paused=t.s.elapsed();advance(1.3);check(t.s.elapsed()===paused,'Passive board clocks still freeze on explicit pause');t.s.pause(false);key('KeyH');key('KeyZ');check(t.s.practice,'Sudoku hint eligibility cannot be restored by undo');t.destroy();
t=mount('memory');tick();const previewTime=t.s.time;tick(1);check(t.s.paused&&t.s.time===previewTime,'Existing timed DOM previews keep their rendering-stall protection');t.destroy();

const referenceMancala=(state,pit)=>{
    const b=[...state.board],p=state.turn,order=p===1?[0,1,2,3,4,5,6,7,8,9,10,11,12]:[7,8,9,10,11,12,13,0,1,2,3,4,5],home=p===1?6:13,own=p===1?[0,1,2,3,4,5]:[7,8,9,10,11,12];if(!own.includes(pit)||!b[pit])return null;
    let at=order.indexOf(pit),count=b[pit],last=pit;b[pit]=0;while(count--){at=(at+1)%order.length;last=order[at];b[last]++;}if(own.includes(last)&&b[last]===1&&b[12-last]>0){b[home]+=b[last]+b[12-last];b[last]=b[12-last]=0;}
    const ended=[b.slice(0,6),b.slice(7,13)].some(a=>a.every(n=>n===0));if(ended){b[6]+=b.slice(0,6).reduce((a,c)=>a+c,0);b[13]+=b.slice(7,13).reduce((a,c)=>a+c,0);for(const i of [0,1,2,3,4,5,7,8,9,10,11,12])b[i]=0;}
    return {board:b,turn:ended?0:last===home?p:3-p,moves:state.moves+1};
};
let seed=631;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const capture=Array(14).fill(0);capture[0]=1;capture[2]=2;capture[11]=4;capture[9]=1;capture[6]=3;capture[13]=7;
const taken=mancalaMove({board:capture,turn:1,moves:0},0);check(taken.capture.count===5&&taken.state.board[6]===8&&taken.state.board[11]===0&&taken.state.board[1]===0,'Capture collects both the last seed and nonempty opposite pit');
const noOpposite=[...capture];noOpposite[11]=0;check(!mancalaMove({board:noOpposite,turn:1,moves:0},0).capture,'Landing in an empty own pit does not capture an empty opposite pit');
const last=Array(14).fill(0);last[5]=1;last[7]=4;last[8]=2;const sweep=mancalaMove({board:last,turn:1,moves:0},5);check(sweep.finished&&!sweep.extra&&sweep.state.board[6]===1&&sweep.state.board[13]===6&&sweep.winner===2,'Terminal sweep takes priority over an extra turn');
const skip=Array(14).fill(4);skip[5]=8;const skipped=mancalaMove({board:skip,turn:1,moves:0},5);check(skipped.steps.includes(6)&&skipped.steps.includes(0)&&!skipped.steps.includes(13),'A sow skips only the opponent store across the wrap');
for(let match=0;match<30;match++){
    const seeds=match%2?3:4;let state={board:Array.from({length:14},(_,i)=>i===6||i===13?0:seeds),turn:1,moves:0};
    for(let turn=0;state.turn&&turn<600;turn++){
        const legal=(state.turn===1?[0,1,2,3,4,5]:[7,8,9,10,11,12]).filter(i=>state.board[i]),pit=legal[Math.floor(random()*legal.length)],before=structuredClone(state),result=mancalaMove(state,pit);assert.deepEqual(state,before);assert.deepEqual(result.state,referenceMancala(state,pit));check(result.state.board.reduce((a,b)=>a+b,0)===seeds*12,'Every sow preserves the complete seed total');state=result.state;
    }
    check(!state.turn&&state.board[6]+state.board[13]===seeds*12,'Random legal Mancala matches finish with every seed in a store');
}
const readPits=t=>Array.from({length:14},(_,i)=>Number(t.cells().find(c=>Number(c.dataset.index)===i).getAttribute('aria-label').match(/씨앗 (\d+)개/)[1]));
t=mount('mancala');key('Digit3');advance(.12);const partial=readPits(t);check(partial.reduce((a,b)=>a+b,0)+Number(t.state.hud[1][1].match(/손에 (\d+)/)[1])===48,'The visible hand counter accounts for seeds still in transit');key('Digit4');check(t.controls.children[0].disabled,'Mancala locks repeated moves and undo while sowing');t.s.pause(true);advance(1.3);assert.deepEqual(readPits(t),partial);t.s.pause(false);advance(1.5);check(t.state.hud[1][1]==='P1 · 1수','Finishing in the own store grants the same player another turn');key('KeyZ');check(t.state.hud[1][1]==='P1 · 0수'&&readPits(t).every((n,i)=>n===(i===6||i===13?0:4)),'Mancala undo restores the full opening state');t.root.emit('keydown',{code:'Enter',repeat:true});advance(1.4);check(t.state.hud[1][1]==='P1 · 0수','Holding Enter cannot make another turn after sowing unlocks');
let state={board:Array.from({length:14},(_,i)=>i===6||i===13?0:4),turn:1,moves:0};
while(state.turn&&state.moves<600){const legal=(state.turn===1?[0,1,2,3,4,5]:[12,11,10,9,8,7]).filter(i=>state.board[i]),pit=legal[Math.floor(random()*legal.length)],result=mancalaMove(state,pit),digit=state.turn===1?pit+1:13-pit;key(`Digit${digit}`);advance(1.4);assert.deepEqual(readPits(t),result.state.board);state=result.state;}
check(t.state.results.length===1&&t.state.results[0].winner===(state.board[6]===state.board[13]?0:state.board[6]>state.board[13]?1:2),'A full keyboard Mancala match records the actual winning player once');t.destroy();
const oldBody=document.body;document.body=new Element('body');document.body.classList.add('reduce-motion');t=mount('mancala',{mode:'quick'});key('Digit4');check(t.state.hud[1][1]==='P1 · 1수'&&!t.controls.children[0].disabled,'Reduced motion applies a complete sow immediately');t.destroy();document.body=oldBody;

// Application integration checks progress keys, practice badges, next-stage focus and restart protection.
let caseId=0;
const appCase=async(id,practice)=>{
    const elements=new Map(),filters=['all','1','2','new','favorite'].map(value=>{const e=new Element('button');e.dataset.player=value;return e;}),el=id=>{if(!elements.has(id)){const e=new Element(id==='game-search'?'input':'div');e.value='';elements.set(id,e);}return elements.get(id);};
    let saved={sound:false,completed:{'puzzle-0':'clean','switch-duo:stage-0':'clean'},records:{}};const doc=new Element('document');doc.body=new Element('body');doc.activeElement=doc.body;doc.createElement=tag=>new Element(tag);doc.getElementById=el;doc.querySelectorAll=()=>filters;doc.querySelector=selector=>selector==='[data-player="favorite"]'?filters[4]:null;
    globalThis.document=doc;globalThis.window=new Element('window');window.scrollTo=()=>{};globalThis.location={hash:`#${id}`};globalThis.localStorage={getItem:()=>JSON.stringify(saved),setItem:(_,value)=>{saved=JSON.parse(value);}};
    const game=games.find(g=>g.id===id),original=game.create;let active;
    game.create=s=>{active=s;s.changed();s.on(s.root,'test-finish',()=>{if(practice)s.assist();s.finish({score:10,winner:id==='mancala'?2:undefined,title:'Complete'});});};
    try{await import(`../js/app.js?logic-pack=${caseId++}`);}finally{game.create=original;}
    el('restart').emit('click');check(el('leave-dialog').open,'New logic games protect dirty progress before restart');el('leave-dialog').close('cancel');el('game-root').emit('test-finish');
    if(id==='mancala')check(saved.records['mancala:v3:classic'].p2===1,'Mancala results update the correct player’s duel record');
    else check(saved.completed[`${id}:stage-0`]===(practice?'assisted':'clean')&&!el('overlay-next').hidden&&doc.activeElement===el('overlay-next'),'Logic progress distinguishes hints and offers the next unfinished stage');
    check(saved.completed['puzzle-0']==='clean'&&saved.completed['switch-duo:stage-0']==='clean','New completion namespaces preserve existing progress');
    if(practice)check(saved.records[`${id}:v3:stage-0`].best===undefined,'Hint-assisted completion never updates ranked best');
    filters[3].emit('click');check(el('game-grid').children.length===4,'New-game filter holds exactly the four logic additions');active.destroy();
};
await appCase('laser',false);await appCase('pipes',true);await appCase('sudoku',false);await appCase('mancala',false);
console.log(`PASS: ${counts().assertions} logic pack rule / native input / completion conditions`);
