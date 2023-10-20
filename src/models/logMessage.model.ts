import { LogType } from "src/consts"

export type LogMessage = {
  type: LogType,
  payload?: object
}