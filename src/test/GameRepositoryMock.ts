import { Injectable } from "@nestjs/common";
import { Game } from "../models/game.model";


@Injectable()
export class GameRepositoryMock{
  public map: Map<string, string>

  constructor(){
    this.map = new Map<string, string>()
  }

  async connect() {
  }

  async disconnect(){
  }

  set(key: string, value: Game){
    this.map.set(key, JSON.stringify(value))
  }

  update(key: string, value:  Game){
    this.set(key, value)
  }

  get(key: string){
    const value = this.map.get(key)
    if(!value){
      return value
    }
    return JSON.parse(value)
  }

  delete(key: string){
    this.map.delete(key)
  }



}