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
  deadPlayers: Player[],
  deck: Deck,
  LibPoliciesEnacted: number,
  FascPoliciesEnacted: number,
  tracker: number,
  presIdx: number,
  SE: Player | undefined,
  currentPres: Player | undefined,
  curentChan: Player | undefined,
  PrevPres: Player | undefined,
  PrevChan: Player | undefined,
  presCards: PRES3 | undefined,
  chanCards: CHAN2 | undefined,
  presDiscard: Card | undefined,
  chanPlay: Card | undefined,
  presClaim: PRES3 | undefined,
  chanClaim: PRES3 | undefined,
  govs: Gov[],
  invClaims: {investigator: Player, investigatee: Player, claim: Role | undefined}[],
  confs: {confer: Player, confee: Player, type: Conf }[]
}
//Figure out how they work with game logic: veto, topdecked