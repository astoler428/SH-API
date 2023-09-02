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

export enum Color {
  RED = 'R',
  BLUE = 'B'
}

export enum Vote {
  JA = 'Ja',
  NEIN = 'Nein',
}

export enum Role {
  LIB = 'Liberal',
  FASC = 'Fascist'
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
  NORMAL = 'normal'
}

export enum Status {
  CREATED = 'CREATED',
  END_LIB = 'END_LIB',
  END_FASC = 'END_FASC',
  CHOOSE_CHAN = 'CHOOSE_CHAN',
  VOTE = 'VOTE',
  PRES_DISCARD = 'PRES_DISCARD',
  CHAN_PLAY = 'CHAN_PLAY',
  SE = 'SE',
  INSPECT_TOP3 = 'INSPECT_TOP3',
  GUN = 'GUN',
  VETO_REQUEST = 'VETO_REQUEST',
}

