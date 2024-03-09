import { GameType, Status } from './consts';
import { Game } from './models/game.model';

export function getFormattedDate() {
  const addLeadingZero = (val: number) => (val < 10 ? `0${val}` : `${val}`);
  const now = new Date();
  const hours = addLeadingZero(now.getHours());
  const minutes = addLeadingZero(now.getMinutes());
  const seconds = addLeadingZero(now.getSeconds());
  return `${hours}:${minutes}:${seconds}`;
}

export function isBlindSetting(gameType: GameType) {
  return gameType?.slice(-5) === 'Blind';
}

export function gameOver(game: Game) {
  return game.status === Status.END_FASC || game.status === Status.END_LIB;
}
