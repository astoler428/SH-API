import { Game } from "../models/game.model";
import { Status, GameType } from "../consts";
import Deck from "../classes/deckClass";

export class GameMockFactory{
  create(params?: object): Game {
    return {
      id: "test",
      createdBy: "player",
      gameType: GameType.BLIND,
      status: Status.CREATED,
      players: [],
      alivePlayers: [],
      deadPlayers: [],
      deck: new Deck(),
      LibPoliciesEnacted: 0,
      FascPoliciesEnacted: 0,
      tracker: 0,
      presIdx: 0,
      SE: null,
      currentPres: null,
      curentChan: null,
      PrevPres: null,
      PrevChan: null,
      presCards: null,
      chanCards: null,
      presDiscard: null,
      chanPlay: null,
      presClaim: null,
      chanClaim: null,
      govs: [],
      invClaims: [],
      confs: [],
      ...params
    }

  }
}