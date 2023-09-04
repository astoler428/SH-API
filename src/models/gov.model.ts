import {Player} from './player.model'
import {PRES3, CHAN2} from '../consts'
import { Card } from './card.model'

export type Gov = {
  deckNum: number,
  pres: Player,
  chan: Player,
  presCards: Card[] | undefined,
  chanCards: Card[] | undefined,
  presClaim: PRES3 | undefined,
  chanClaim: CHAN2 | undefined,
  underclaim: number
}