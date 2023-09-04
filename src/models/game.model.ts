import {Player} from './player.model'
import Deck from '../classes/deckClass'
import {Status, PRES3, CHAN2, Role, Conf, GameType} from '../consts'
import {Card} from './card.model'
import {Gov} from './gov.model'
import {Socket} from 'socket.io'

export type Game = {
  id: string,
  createdBy: string,
  gameType: GameType,
  status: Status,
  players: Player[],
  alivePlayers: Player[],
  deck: Deck,
  LibPoliciesEnacted: number,
  FascPoliciesEnacted: number,
  tracker: number,
  presIdx: number,
  SE: Player | undefined,
  currentPres: Player | undefined,
  currentChan: Player | undefined,
  prevPres: Player | undefined,
  prevChan: Player | undefined,
  presCards: Card[] | undefined,
  chanCards: Card[] | undefined,
  presDiscard: Card | undefined,
  chanPlay: Card | undefined,
  presClaim: PRES3 | undefined,
  chanClaim: CHAN2 | undefined,
  top3: Card[] | undefined,
  govs: Gov[],
  log: string[],
  invClaims: {investigator: Player, investigatee: Player, claim: Role | undefined}[],
  confs: {confer: Player, confee: Player, type: Conf }[]
}
//Figure out how they work with game logic: veto, topdecked