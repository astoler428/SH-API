import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { GameService } from "./game.service";
import { Socket } from "socket.io";
import { GameType } from "src/consts";

class CreateGameDTO {
  constructor(public name: string, public socketId: string) {}
}

class JoinGameDTO {
  constructor(public name: string, public socketId: string) {}
}

class LeaveGameDTO {
  constructor(public socketId: string, public enteringGame: boolean) {}
}

@Controller("game")
export class GameController {
  constructor(private gameService: GameService) {}

  @Post('/')
  async create(@Body() body: CreateGameDTO){
    const id = await this.gameService.createGame(body.name, body.socketId)
    console.log(`id is ${id}`)
    return id
  }

  @Post('/join/:id')
  join(@Param('id') id: string, @Body() body: JoinGameDTO ){
    return this.gameService.joinGame(id, body.name, body.socketId)
  }

  @Post('/leave/:id')
  leave(@Param('id') id: string, @Body() body: LeaveGameDTO ){
    if(!body.enteringGame){
      return this.gameService.leaveGame(id, body.socketId)
    }
    return
  }

  @Post('/gameType/:id')
  setGameType(@Param('id') id: string, @Body() body: {gameType: GameType} ){
    return this.gameService.setGameType(id, body.gameType)
  }

  @Post("/start/:id")
  async startGame(@Param("id") id: string) {
    return this.gameService.startGame(id);
  }

  // @Get('/updatePlayers/:id')
  // updatePlayers(@Param("id") id: string){
  //   return this.gameService.updatePlayers(id)
  // }

  // @Get('/:id')
  // findById(@Param("id") id: string){
  //   const game = this.gameService.findById(id)
  //   // console.log(game)
  //   return game
  // }
}