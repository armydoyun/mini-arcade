import { connectionGame } from '../connection-game.js';
export default (s) => connectionGame(s, { columns: 7, rows: 6, needed: 4, className: 'connect4', gravity: true, pieces: ['●', '●'] });
