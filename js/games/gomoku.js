import { connectionGame } from '../connection-game.js';
import { gomokuMove } from '../ai.js';
export default (s) => connectionGame(s, { columns: 15, needed: 5, className: 'gomoku', stoneBoard: true, pieces: ['●', '○'], cpu: s.options.mode === 'cpu' ? (board) => gomokuMove(board) : null });
