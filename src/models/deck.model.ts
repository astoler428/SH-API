import { Card } from './card.model';

export type Deck = {
  drawPile: Card[];
  discardPile: Card[];
  deckNum: number;
};
