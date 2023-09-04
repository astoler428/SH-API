import {Role, Vote} from '../consts'
import { Player } from '../models/player.model'

 export class PlayerMockFactory {

  create(params?: object): Player {
    return {
      name: "player",
      socketId: '1',
      team: undefined,
      role: undefined,
      alive: true,
      vote: undefined,
      investigated: false,
      investigations: [],
      bluesPlay: 0,
      confirmedFasc: false,
      omniFasc: false,
      ...params
    }
  }
}