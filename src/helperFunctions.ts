import { GameType, Status } from './consts';
import { Game } from './models/game.model';

export function getFormattedDate() {
  //used to format here, but not formatted on the frontend
  const now = new Date();
  return now.toISOString();
}

export function isBlindSetting(gameType: GameType) {
  return gameType?.slice(-5) === 'Blind';
}

export function gameOver(game: Game) {
  return game.status === Status.END_FASC || game.status === Status.END_LIB;
}
