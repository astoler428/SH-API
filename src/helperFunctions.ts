import {
  GameType,
  Status,
  POLICY_PILES_DELAY_BETWEEN_POLICIES,
  POLICY_PILES_DURATION,
  POLICY_PILES_INITIAL_DELAY,
  TOP_DECK_DELAY,
} from './consts';
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

export const policyPilesAnimationLength = (move: number) => {
  return (
    POLICY_PILES_INITIAL_DELAY +
    POLICY_PILES_DURATION +
    POLICY_PILES_DELAY_BETWEEN_POLICIES * (move - 1)
  );
};

export const policyEnactDelay = (game) => {
  if (game.vetoAccepted) {
    //must be a top deck for policy to enact on vetoAccepted
    return (
      TOP_DECK_DELAY +
      policyPilesAnimationLength(2) +
      (game.deck.reshuffleIsBeforeATopDeck
        ? policyPilesAnimationLength(game.deck.drawPile.length + 1)
        : 0)
    );
  } else {
    return game.topDecked ? TOP_DECK_DELAY : 0;
  }
};
