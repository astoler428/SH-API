import {Role, Vote} from '../consts'

 export type Player = {
  name: string,
  role: Role,
  hitler: boolean,
  vote: Vote | undefined,
  investigated: boolean,
  investigations: Player[],
  bluesPlay: number,
  confirmedFasc: boolean,
  omniFasc: boolean
}