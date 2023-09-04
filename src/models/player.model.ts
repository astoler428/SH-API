import {Role, Vote} from '../consts'

 export type Player = {
  name: string,
  socketId: string,
  role: Role,
  hitler: boolean,
  alive: boolean
  vote: Vote | undefined,
  investigated: boolean,
  investigations: Player[],
  bluesPlay: number,
  confirmedFasc: boolean,
  omniFasc: boolean
}