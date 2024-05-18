import { Card } from './card.model';

export type Deck = {
  drawPile: Card[];
  discardPile: Card[];
  deckNum: number;
  drawPileLengthBeforeDraw3: number;
  inspectTop3: Card[];
  justReshuffled: boolean;
  reshuffleIsBeforeATopDeck: boolean;
};
