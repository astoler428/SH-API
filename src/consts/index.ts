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

export enum Status {
  CREATED = 'created',
  END_LIB = 'created',
  END_FASC = 'created',
  CHOOSE_CHAN = 'created',
  VOTE = 'created',
  PRES_DISCARD = 'created',
  CHAN_PLAY = 'created',
  SE = 'created',
  INSPECT_TOP3 = 'created',
  GUN = 'created',
  VETO_REQUEST = 'created',
}

