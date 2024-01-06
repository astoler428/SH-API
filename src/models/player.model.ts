import { Role, Vote, Team, Identity } from '../consts';

export type Player = {
  name: string;
  socketId: string;
  color: string;
  team: Team;
  role: Role;
  alive: boolean;
  vote: Vote;
  investigated: boolean;
  investigations: string[];
  bluesPlayed: number;
  confirmedFasc: boolean;
  omniFasc: boolean;
  guessedToBeLibSpy: boolean;
  identity: Identity; //used in a totally blind version that doesn't exist yet
};
