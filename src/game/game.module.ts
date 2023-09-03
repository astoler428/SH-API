import { Module } from "@nestjs/common";
import { GameController } from "./game.controller";
import { GameService } from "./game.service";
import { EventsGateway } from "src/game/events.gateway";

@Module({
  imports: [],
  controllers: [GameController],
  providers: [GameService, EventsGateway]
})
export class GameModule {}