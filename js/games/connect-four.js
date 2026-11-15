import { connectionGame } from '../connection-game.js';
import { connectFourMove } from '../ai.js';
export default (s) => connectionGame(s, { columns: 7, rows: 6, needed: 4, className: 'connect4', gravity: true, pieces: ['●', '●'], cpu: s.options.mode === 'cpu' ? (board) => connectFourMove(board) : null });
