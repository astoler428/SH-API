import { Module } from "@nestjs/common";
import { GameController } from "./game.controller";
import { GameService } from "./game.service";
import { EventsGateway } from "src/game/events.gateway";
import { GameRepository } from "./game.repository";
import { Repository } from "typeorm";
import { GameEntity } from "./game.entity";

@Module({
  imports: [],
  controllers: [GameController],
  providers: [GameService, EventsGateway, GameRepository]
})
export class GameModule {}