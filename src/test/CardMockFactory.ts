import { Card } from 'src/models/card.model'
import {Color, Policy, Role, Vote} from '../consts'
import { Player } from '../models/player.model'

 export class CardMockFactory {

  createFasc(params?: object): Card {
    return {
      policy: Policy.FASC,
      color: Color.RED,
      ...params
    }
  }

  createLib(params?: object): Card {
    return {
      policy: Policy.LIB,
      color: Color.BLUE,
      ...params
    }
  }
}