import { connectionGame } from '../connection-game.js';
export default (s) => connectionGame(s, { columns: 3, needed: 3, className: 'ttt', reverse: s.options.mode === 'reverse' });
