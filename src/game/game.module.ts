import {ConfigModule} from '@nestjs/config' //must be at the top?
import { Module } from "@nestjs/common";
import { GameController } from "./game.controller";
import { GameService } from "./game.service";
import { LogicService } from "./logic.service";
import { EventsGateway } from "src/game/events.gateway";
import { CacheModule } from '@nestjs/cache-manager';
import { GameRepository } from './game.repository';
import { DefaultActionService } from './defaultAction.service';
import { ProbabilityService } from './probability.service';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.register({
        isGlobal: true,
        store: redisStore as any,
        host: 'localhost',
        port: 6379
      })
  ],
  controllers: [GameController],
  providers: [GameService, EventsGateway, LogicService, GameRepository, DefaultActionService, ProbabilityService]
})
export class GameModule {}

