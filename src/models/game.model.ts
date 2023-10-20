import {Player} from './player.model'
import { Deck } from './deck.model'
import {Status, PRES3, CHAN2, Role, Conf, GameType, GameSettings, Team, LogType} from '../consts'
import {Card} from './card.model'
import {Gov} from './gov.model'
import {Socket} from 'socket.io'
import { chatMessage } from './chatMessage.model'
import { LogChatMessage } from './logChatMessage.model'

export type Game = {
  id: string,
  host: string,
  settings: GameSettings,
  status: Status,
  players: Player[],
  deck: Deck,
  LibPoliciesEnacted: number,
  FascPoliciesEnacted: number,
  tracker: number,
  presIdx: number,
  SE: string, //not player
  currentPres: string, //not player
  currentChan: string, //not player
  prevPres: string, //not player
  prevChan: string, //not player
  presCards: Card[] | undefined,
  chanCards: Card[] | undefined,
  presDiscard: Card | undefined,
  chanPlay: Card | undefined,
  presClaim: PRES3 | undefined,
  chanClaim: CHAN2 | undefined,
  top3: Card[],
  govs: Gov[],
  log: LogChatMessage[],
  chat: chatMessage[],
  invClaims: {investigator: string, investigatee: string, claim: Team}[],
  confs: {confer: string, confee: string, type: Conf }[]
}
//Figure out how they work with game logic: veto, topdecked