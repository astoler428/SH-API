import { Inject, Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { Game } from '../models/game.model';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class GameRepository {
  private redisClient: RedisClientType;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.redisClient = createClient({
      url: process.env.REDIS_URL,
    });
    this.redisClient.on('error', (err: Error) =>
      console.log('Redis client Error', err),
    );
  }

  async connect() {
    await this.redisClient.connect();
  }

  async disconnect() {
    await this.redisClient.disconnect();
  }

  async set(key: string, value: Game) {
    await this.cacheManager.set(key, JSON.stringify(value));
    //don't await since just for backup
    this.redisClient.set(key, JSON.stringify(value));
  }

  async update(key: string, value: Game) {
    await this.set(key, value);
  }

  async get(key: string): Promise<Game> {
    let value: string = await this.cacheManager.get(key);

    if (!value) {
      value = await this.redisClient.get(key);
    }
    if (!value) {
      return null;
    }
    try {
      const toReturn = JSON.parse(value);
      return toReturn;
    } catch (error) {
      console.error(error, value);
    }
    // return JSON.parse(value);
  }

  async delete(key: string) {
    this.cacheManager.del(key);
    this.redisClient.del(key);
  }
}
