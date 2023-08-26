import {Player} from './player.model'
import {PRES3, CHAN2} from '../consts'

export type Gov = {
  deckNum: number,
  pres: Player,
  chan: Player,
  presCards: PRES3 | undefined,
  chanCards: CHAN2 | undefined,
  presClaim: PRES3 | undefined,
  chanClaim: PRES3 | undefined,
  underclaim: number
}