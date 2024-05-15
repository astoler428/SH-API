import { Card } from 'src/models/card.model';
import { Color, Policy, Role, Vote } from '../consts';
import { Player } from '../models/player.model';
import { Deck } from '../models/deck.model';

export class DeckMockFactory {
  createEmptyDeck(params?: object): Deck {
    return {
      drawPile: [],
      discardPile: [],
      deckNum: 1,
      justReshuffled: false,
      reshuffleIsBeforeATopDeck: false,
      drawPileLengthBeforeDraw3: 0,
      inspectTop3: [],
      ...params,
    };
  }

  createFullDeck(params?: object): Deck {
    const deck = {
      drawPile: [],
      discardPile: [],
      deckNum: 1,
      justReshuffled: false,
      reshuffleIsBeforeATopDeck: false,
      drawPileLengthBeforeDraw3: 0,
      inspectTop3: [],
      ...params,
    };
    this.buildDeck(deck);
    this.shuffleDeck(deck);
    return deck;
  }

  buildDeck(deck: Deck) {
    for (let i = 0; i < 6; i++) {
      deck.drawPile.push({ policy: Policy.LIB, color: Color.BLUE });
    }
    for (let i = 0; i < 11; i++) {
      deck.drawPile.push({ policy: Policy.FASC, color: Color.RED });
    }
  }

  shuffleDeck(deck: Deck) {
    deck.drawPile.sort(() => Math.random() - 0.5);
    deck.drawPile.sort(() => Math.random() - 0.5);
  }
}
