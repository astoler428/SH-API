export const BBB = 'BBB';
export const RBB = 'RBB';
export const RRB = 'RRB';
export const RRR = 'RRR';
export const BB = 'BB';
export const RB = 'RB';
export const RR = 'RR';

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
  BBB = 'BBB',
}

export const draws3 = [PRES3.RRR, PRES3.RRB, PRES3.RBB, PRES3.BBB];
export const draws2 = [CHAN2.RR, CHAN2.RB, CHAN2.BB];

export enum Color {
  RED = 'R',
  BLUE = 'B',
}

export enum Vote {
  JA = 'Ja',
  NEIN = 'Nein',
}

export enum Team {
  LIB = 'liberal',
  FASC = 'fascist',
}

export enum Role {
  LIB = 'liberal',
  FASC = 'fascist',
  HITLER = 'Hitler',
  LIB_SPY = 'liberal spy',
}

export enum Identity {
  LIB = 'liberal',
  FASC = 'fascist',
  HITLER = 'Hitler',
}

export enum Conf {
  POLICY = 'Policy',
  INV = 'Investigation',
}

export enum Policy {
  LIB = 'liberal',
  FASC = 'fascist',
}

export enum GameType {
  BLIND = 'Blind',
  COOPERATIVE_BLIND = 'Cooperative Blind',
  TOTALLY_BLIND = 'Totally Blind',
  NORMAL = 'Normal',
  MIXED_ROLES = 'Mixed Roles',
  LIB_SPY = 'Liberal Spy',
}

export type GameSettings = {
  type: GameType;
  redDown: boolean;
  simpleBlind: boolean;
  // cooperativeBlind: boolean,
  // completeBlind: boolean,
  hitlerKnowsFasc: boolean;
  // teamLibSpy: boolean
};

export enum DefaultAction {
  PRES_DISCARD = 'PRES_DISCARD',
  CHAN_PLAY = 'CHAN_PLAY',
  CHAN_CLAIM = 'CHAN_CLAIM',
  PRES_CLAIM = 'PRES_CLAIM',
  INV_CLAIM = 'INV_CLAIM',
  INSPECT_TOP3_CLAIM = 'INSPECT_TOP3_CLAIM',
}

export enum Status {
  CREATED = 'CREATED',
  STARTED = 'STARTED',
  CHOOSE_CHAN = 'CHOOSE_CHAN',
  VOTE = 'VOTE',
  PRES_DISCARD = 'PRES_DISCARD',
  CHAN_PLAY = 'CHAN_PLAY',
  PRES_CLAIM = 'PRES_CLAIM',
  CHAN_CLAIM = 'CHAN_CLAIM',
  INV = 'INV',
  INV_CLAIM = 'INV_CLAIM',
  SE = 'SE',
  INSPECT_TOP3 = 'INSPECT_TOP3',
  GUN = 'GUN',
  VETO_REPLY = 'VETO_REPLY',
  VETO_DECLINED = 'VETO_DECLINED',
  LIB_SPY_GUESS = 'LIB_SPY_GUESS',
  END_LIB = 'END_LIB',
  END_FASC = 'END_FASC',
  SHOW_VOTE_RESULT = 'SHOW_VOTE_RESULT',
  SHOW_HITLER_FOR_LIB_SPY_GUESS = 'SHOW_HITLER_FOR_LIB_SPY_GUESS',
  SHOW_LIB_SPY_GUESS = 'SHOW_LIB_SPY_GUESS',
}

export enum LogType {
  INDIVIDUAL_SEAT = 'INDIVIDUAL_SEAT',
  HITLER_SEAT = 'HITLER_SEAT',
  OTHER_FASCIST_SEATS = 'OTHER_FASCIST_SEATS',
  CHOOSE_CHAN = 'CHOOSE_CHAN',
  ENACT_POLICY = 'ENACT_POLICY',
  CHAN_CLAIM = 'CHAN_CLAIM',
  PRES_CLAIM = 'PRES_CLAIM',
  INV = 'INV',
  INV_CLAIM = 'INV_CLAIM',
  SE = 'SE',
  INSPECT_TOP3 = 'INSPECT_TOP3',
  INSPECT_TOP3_CLAIM = 'INSPECT_TOP3_CLAIM',
  GUN = 'GUN',
  VETO_REQUEST = 'VETO_REQUEST',
  VETO_REPLY = 'VETO_REPLY',
  CONFIRM_FASC = 'CONFIRM_FASC',
  DECK = 'DECK',
  LIB_SPY_GUESS = 'LIB_SPY_GUESS',
  SHUFFLE_DECK = 'SHUFFLE_DECK',
  //these don't require data
  ELECTION_FAIL = 'ELECTION_FAIL',
  TOP_DECK = 'TOP_DECK',
  LIB_WIN = 'LIB_WIN',
  FASC_WIN = 'FASC_WIN',
  LIB_SPY_WIN = 'LIB_SPY_WIN',
  LIB_SPY_FAIL = 'LIB_SPY_FAIL',
  HITLER_ELECTED = 'HITLER_ELECTED',
  HITLER_SHOT = 'HITLER_SHOT',
  INTRO_DECK = 'INTRO_DECK',
  INTRO_ROLES = 'INTRO_ROLES',
  INTRO_LIB_SPY = 'INTRO_LIB_SPY',
  INTRO_MIXED = 'INTRO_MIXED',
  INTRO_HITLER_KNOWS_FASC = 'INTRO_HITLER_KNOWS_FASC',
  INTRO_RED_DOWN = 'INTRO_RED_DOWN',
  HITLER_TO_GUESS_LIB_SPY = 'HITLER_TO_GUESS_LIB_SPY',
}

export enum DisplayType {
  VOTES = 'VOTES',
  INV = 'INV',
  LIB_SPY_GUESS = 'LIB_SPY_GUESS',
  ENACT_LIB_POLICY = 'ENACT_LIB_POLICY',
  ENACT_FASC_POLICY = 'ENACT_FASC_POLICY',
}

export const gameTeams = [
  Team.FASC,
  Team.FASC,
  Team.LIB,
  Team.LIB,
  Team.LIB,
  Team.LIB,
  Team.FASC,
  Team.LIB,
  Team.FASC,
  Team.LIB,
];
export const gameRoles = [
  Role.HITLER,
  Role.FASC,
  Role.LIB,
  Role.LIB,
  Role.LIB,
  Role.LIB,
  Role.FASC,
  Role.LIB,
  Role.FASC,
  Role.LIB,
];
export const gameIdentities = [
  Identity.HITLER,
  Identity.FASC,
  Identity.LIB,
  Identity.LIB,
  Identity.LIB,
  Identity.LIB,
  Identity.FASC,
  Identity.LIB,
  Identity.FASC,
  Identity.LIB,
];
