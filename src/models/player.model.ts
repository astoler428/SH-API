import {Role, Vote, Team} from '../consts'

 export type Player = {
  name: string,
  socketId: string,
  team: Team,
  role: Role,
  alive: boolean,
  vote: Vote,
  investigated: boolean,
  investigations: Player[],
  bluesPlay: number,
  confirmedFasc: boolean,
  omniFasc: boolean
}