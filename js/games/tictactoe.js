import { connectionGame } from '../connection-game.js';
import { tictactoeMove } from '../ai.js';
export default (s) => {
    const reverse = s.options.mode === 'reverse' || s.options.mode === 'cpu-reverse';
    connectionGame(s, { columns: 3, needed: 3, className: 'ttt', reverse, cpu: s.options.mode?.startsWith('cpu') ? (board) => tictactoeMove(board, { reverse }) : null });
};
