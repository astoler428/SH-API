import {Role, Vote, Team} from '../consts'

 export type Player = {
  name: string,
  socketId: string,
  team: Team,
  role: Role,
  alive: boolean,
  vote: Vote,
  investigated: boolean,
  investigations: string[],
  bluesPlayed: number,
  confirmedFasc: boolean,
  omniFasc: boolean
}