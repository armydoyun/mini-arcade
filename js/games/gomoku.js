import { connectionGame } from '../connection-game.js';
export default (s) => connectionGame(s, { columns: 15, needed: 5, className: 'gomoku', stoneBoard: true, pieces: ['●', '○'] });
