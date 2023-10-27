import {Role, Vote} from '../consts'
import { Player } from '../models/player.model'

 export class PlayerMockFactory {

  create(params?: object): Player {
    return {
      name: "player",
      socketId: '1',
      color: 'black',
      team: undefined,
      role: undefined,
      alive: true,
      vote: undefined,
      investigated: false,
      investigations: [],
      bluesPlayed: 0,
      confirmedFasc: false,
      omniFasc: false,
      guessedToBeLibSpy: false,
      ...params
    }
  }
}