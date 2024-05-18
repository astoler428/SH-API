import { Inject, Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { Game } from '../models/game.model';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class GameRepository {
  private redisClient: RedisClientType;
  public redisClientUpToDate: boolean = true;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.redisClient = createClient({
      url: process.env.REDIS_URL,
    });
    this.redisClient.on('error', (err: Error) => {
      console.log('Redis client Error', err);
    });
    this.redisClient.on('connect', () => {
      console.log('Redis client Connected');
    });
    this.redisClient.on('ready', () => {
      console.log('Redis client Ready');
    });
    this.redisClient.on('end', () => {
      console.log('Redis client End');
    });
  }

  async connect() {
    await this.redisClient.connect();
  }

  async disconnect() {
    await this.redisClient.disconnect();
  }

  async set(key: string, value: Game) {
    try {
      await this.redisClient.set(key, JSON.stringify(value));
      this.redisClientUpToDate = true;
    } catch (error) {
      console.error('Failed to set value in Redis', error);
      this.redisClientUpToDate = false;
    }

    try {
      await this.cacheManager.set(key, JSON.stringify(value));
    } catch (error) {
      console.error('Fialed to set value in Cache Manager');
    }
  }

  async update(key: string, value: Game) {
    await this.set(key, value);
  }

  async get(key: string): Promise<Game> {
    let value: string;
    if (this.redisClientUpToDate) {
      try {
        value = await this.redisClient.get(key);
      } catch (error) {
        console.error('Error getting value from Redis', error);
      }
    }

    if (!value) {
      try {
        value = await this.cacheManager.get(key);
      } catch (error) {
        console.error('Error getting value from Cache Manager', error);
      }
    }
    if (!value) {
      return null;
    }
    try {
      let game: Game;
      //for some reason in deployment the value was already an object sometimes?
      if (typeof value === 'string') {
        game = JSON.parse(value);
      } else {
        game = value;
      }
      return game;
    } catch (error) {
      console.error('Error parsing game data', error, value);
    }
    // return JSON.parse(value);
  }

  async delete(key: string) {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      console.error('Error deleting from Redis', error);
    }
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      console.error('Error deleting from Cache Manager', error);
    }
  }
}
