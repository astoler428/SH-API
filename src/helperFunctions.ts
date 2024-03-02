import { GameType } from './consts';

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
