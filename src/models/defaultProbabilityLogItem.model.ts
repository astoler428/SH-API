import { Player } from './player.model';
import { DefaultAction, Role } from 'src/consts';

export type DefaultProbabilityLogItem = {
  playerName: string;
  role: Role;
  threshold: number;
  randomProb: number;
  actionName: DefaultAction;
  probabilityName: string;
  govNum: number;
};
/**
 *
 *
 */
