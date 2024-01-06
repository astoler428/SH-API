import { Card } from 'src/models/card.model';
import { CHAN2, Color, PRES3, Policy, Role, Vote } from '../consts';
import { Player } from '../models/player.model';
import { Gov } from 'src/models/gov.model';
import { CardMockFactory } from './CardMockFactory';

export class GovMockFactory {
  create(params?: object): Gov {
    return {
      deckNum: 1,
      pres: 'player-1',
      chan: 'player-2',
      policyPlayed: new CardMockFactory().createFasc(),
      presCards: [0, 1, 2].map((i) => new CardMockFactory().createFasc()),
      chanCards: [0, 1].map((i) => new CardMockFactory().createFasc()),
      presClaim: PRES3.RRR,
      chanClaim: CHAN2.RR,
      underclaim: 0,
      ...params,
    };
  }
}
