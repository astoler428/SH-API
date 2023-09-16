export const BBB = 'BBB'
export const RBB = 'RBB'
export const RRB = 'RRB'
export const RRR = 'RRR'
export const BB = 'BB'
export const RB = 'RB'
export const RR = 'RR'

// export const CHAN2 = [RR, RB, BB]
// export const PRES3 = [RRR, RRB, RBB, BBB]

export enum CHAN2 {
  RR = 'RR',
  RB = 'RB',
  BB = 'BB',
}

export enum PRES3 {
  RRR = 'RRR',
  RRB = 'RRB',
  RBB = 'RBB',
  BBB = 'BBB'
}

export const draws3 = [PRES3.RRR, PRES3.RRB, PRES3.RBB, PRES3.BBB]
export const draws2 = [CHAN2.RR, CHAN2.RB, CHAN2.BB]

export enum Color {
  RED = 'R',
  BLUE = 'B'
}

export enum Vote {
  JA = 'Ja',
  NEIN = 'Nein',
}

export enum Team {
  LIB = 'Liberal',
  FASC = 'Fascist'
}

export enum Role {
  LIB = 'Liberal',
  FASC = 'Fascist',
  HITLER = 'Hitler',
  LIB_SPY = 'Liberal Spy'
}

export enum Conf {
  POLICY = 'Policy',
  INV = 'Investigation'
}

export enum Policy {
  LIB = 'Liberal',
  FASC = 'Fascist'
}

export enum GameType {
  BLIND = 'Blind',
  NORMAL = 'Normal',
  MIXED_ROLES = 'Mixed Roles',
  LIB_SPY = 'Liberal Spy'
}

export type GameSettings = {
  type: GameType,
  redDown: boolean,
  hitlerKnowsFasc: boolean
}

export enum Status {
  CREATED = 'CREATED',
  CHOOSE_CHAN = 'CHOOSE_CHAN',
  VOTE = 'VOTE',
  VOTE_RESULT = 'VOTE_RESULT',
  PRES_DISCARD = 'PRES_DISCARD',
  CHAN_PLAY = 'CHAN_PLAY',
  PRES_CLAIM = 'PRES_CLAIM',
  CHAN_CLAIM = 'CHAN_CLAIM',
  INV = 'INV',
  INV_CLAIM = 'INV_CLAIM',
  SE = 'SE',
  INSPECT_TOP3 = 'INSPECT_TOP3',
  GUN = 'GUN',
  VETO_REQUEST = 'VETO_REQUEST',
  VETO_DECLINED = 'VETO_DECLINED',
  END_LIB = 'END_LIB',
  END_FASC = 'END_FASC',
}

export const gameTeams = [Team.FASC, Team.FASC, Team.LIB, Team.LIB, Team.LIB, Team.LIB, Team.FASC, Team.LIB, Team.FASC, Team.LIB]
export const gameRoles = [Role.HITLER, Role.FASC, Role.LIB, Role.LIB, Role.LIB, Role.LIB, Role.FASC, Role.LIB, Role.FASC, Role.LIB]
