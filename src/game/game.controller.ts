import { Body, Controller, Param, Post } from "@nestjs/common";
import { GameService } from "./game.service";
import { Socket } from "socket.io";

class CreateGameDTO {
  constructor(public name: string, public socket: Socket) {}
}

class JoinGameDTO {
  constructor(public name: string, public socket: Socket) {}
}

@Controller("game")
export class GameController {
  constructor(private gameService: GameService) {}

  @Post('/')
  create(@Body() body: CreateGameDTO){
    return this.gameService.createGame(body.name, body.socket)
  }

  @Post('/join/:id')
  join(@Param('id') id: string, @Body() body: JoinGameDTO ){
    return this.gameService.joinGame(id, body.name, body.socket)
  }
}