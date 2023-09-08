import { Module } from "@nestjs/common";
import { GameController } from "./game.controller";
import { GameService } from "./game.service";
import { LogicService } from "./logic.service";
import { EventsGateway } from "src/game/events.gateway";
import type from 'redis'
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore as any,
      host: 'localhost',
      port: 6379,
    })
  ],
  controllers: [GameController],
  providers: [GameService, EventsGateway, LogicService]
})
export class GameModule {}

