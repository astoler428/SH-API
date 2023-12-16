import { Player } from "./player.model"
import { DefaultAction } from "src/consts"

export type DefaultProbabilityLogItem = {
  threshold: number,
  randomProb: number,
  playerName: string,
  actionName: DefaultAction,
  probabilityName: string
}