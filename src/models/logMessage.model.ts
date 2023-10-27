import { LogType } from "src/consts"

export type LogMessage = {
  type: LogType,
  date: string,
  payload?: object
}