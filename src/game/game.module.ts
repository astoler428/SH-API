import {ConfigModule} from '@nestjs/config' //must be at the top?
import { Module } from "@nestjs/common";
import { GameController } from "./game.controller";
import { GameService } from "./game.service";
import { LogicService } from "./logic.service";
import { EventsGateway } from "src/game/events.gateway";
import { CacheModule } from '@nestjs/cache-manager';
import { GameRepository } from './game.repository';

@Module({
  imports: [
    ConfigModule.forRoot()
  ],
  controllers: [GameController],
  providers: [GameService, EventsGateway, LogicService, GameRepository]
})
export class GameModule {}

