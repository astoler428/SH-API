import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { GameService } from "./game.service";
import { Socket } from "socket.io";
import { CHAN2, GameType, PRES3, Role, Vote } from "../consts";
import { Card } from "src/models/card.model";

class CreateGameDTO {
  constructor(public name: string, public socketId: string) {}
}

class JoinGameDTO {
  constructor(public name: string, public socketId: string) {}
}

class LeaveGameDTO {
  constructor(public socketId: string, public enteringGame: boolean) {}
}

class VoteDTO {
  constructor(public name: string, public vote: Vote) {}
}

@Controller("game")
export class GameController {
  constructor(private gameService: GameService) {}

  @Post('/')
  create(@Body() body: CreateGameDTO){
    const id = this.gameService.createGame(body.name, body.socketId)
    // const game = this.gameService.findById(id)
    // this.gameService.setGameDataInCache(game)
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

  @Post("/chooseChan/:id")
  async chooseChan(@Param("id") id: string, @Body() body: {chanName: string}){
    return this.gameService.chooseChan(id, body.chanName);
  }

  @Post("/vote/:id")
  async vote(@Param("id") id: string, @Body() body: VoteDTO){
    return this.gameService.vote(id, body.name, body.vote);
  }

  @Post("/presDiscard/:id")
  async presDiscard(@Param("id") id: string, @Body() body: {cardColor: string}){
    return this.gameService.presDiscard(id, body.cardColor);
  }

  @Post("/chanPlay/:id")
  async chanPlay(@Param("id") id: string, @Body() body: {cardColor: string}){
    return this.gameService.chanPlay(id, body.cardColor);
  }

  @Post("/chanClaim/:id")
  async chanClaim(@Param("id") id: string, @Body() body: {claim: CHAN2}){
    return this.gameService.chanClaim(id, body.claim);
  }

  @Post("/presClaim/:id")
  async presClaim(@Param("id") id: string, @Body() body: {claim: PRES3}){
    return this.gameService.presClaim(id, body.claim);
  }


  @Post("/chooseInv/:id")
  async chooseInv(@Param("id") id: string, @Body() body: {invName: string}){
    return this.gameService.chooseInv(id, body.invName);
  }

  @Post("/invClaim/:id")
  async invClaim(@Param("id") id: string, @Body() body: {claim: Role}){
    return this.gameService.invClaim(id, body.claim);
  }


  @Post("/chooseSE/:id")
  async chooseSE(@Param("id") id: string, @Body() body: {seName: string}){
    return this.gameService.chooseSE(id, body.seName);
  }


  @Post("/chooseGun/:id")
  async chooseGun(@Param("id") id: string, @Body() body: {shotName: string}){
    return this.gameService.chooseGun(id, body.shotName);
  }

  @Post("/inspect3Claim/:id")
  async inspect3Claim(@Param("id") id: string, @Body() body: {claim: PRES3} ){
    return this.gameService.inspect3Claim(id, body.claim);
  }

  @Post("/vetoRequest/:id")
  async vetoRequest(@Param("id") id: string ){
    return this.gameService.vetoRequest(id);
  }

  @Post("/vetoReply/:id")
  async vetoReply(@Param("id") id: string, @Body() body: {vetoAccepted: boolean}  ){
    return this.gameService.vetoReply(id, body.vetoAccepted);
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