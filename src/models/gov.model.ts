import {Player} from './player.model'
import {PRES3, CHAN2} from '../consts'
import { Card } from './card.model'

export type Gov = {
  deckNum: number,
  pres: string,
  chan: string,
  policyPlayed: Card,
  presCards: Card[],
  chanCards: Card[],
  presClaim: PRES3,
  chanClaim: CHAN2,
  underclaim: number
}