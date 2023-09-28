import { Injectable } from "@nestjs/common";
import { createClient, RedisClientType } from 'redis';
import { Game } from "../models/game.model";


@Injectable()
export class GameRepository{
  private redisClient: RedisClientType

  constructor(){
    this.redisClient = createClient({
      url: process.env.REDIS_URL
    })
    this.redisClient.on('error', (err: Error) => console.log('Redis client Error', err))
  }

  async connect() {
    await this.redisClient.connect()
  }

  async disconnect(){
    await this.redisClient.disconnect()
  }

  async set(key: string, value: Game){
    await this.redisClient.set(key, JSON.stringify(value))
  }

  async update(key: string, value:  Game){
    await this.set(key, value)
  }

  async get(key: string): Promise<Game>{
    const value = await this.redisClient.get(key)
    if(!value){
      return null
    }
    return JSON.parse(value)
  }

  async delete(key: string){
    this.redisClient.del(key)
  }



}