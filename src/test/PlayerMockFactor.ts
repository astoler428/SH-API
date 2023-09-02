import {Role, Vote} from '../consts'
import { Player } from '../models/player.model'

 export class PlayerMockFactory {

  create(params?: object): Player {
    return {
      name: "player",
      socketId: '1',
      role: undefined,
      hitler: false,
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