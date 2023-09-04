import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";import { Game } from "../models/game.model";
import { Status, Role, GameType, Vote, PRES3, CHAN2 } from "../consts";
import Deck from "../classes/deckClass";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { JOIN_GAME, LEAVE_GAME, START_GAME, UPDATE_GAME, UPDATE_PLAYERS } from "../consts/socketEventNames";
import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogicService } from "./logic.service";
import { Card } from "src/models/card.model";

@Injectable()
export class GameService{
  constructor(private eventEmitter: EventEmitter2, private logicService: LogicService
){}
  //temp fake database
  public gameDatabase: Game[] = []

  async createGame(name: string, socketId: string) {
    const id: string = Math.random().toString(36).slice(2).substring(0, 4).toUpperCase();

    const game: Game = {
      id,
      createdBy: name,
      gameType: GameType.BLIND,
      status: Status.CREATED,
      players: [],
      alivePlayers: [],
      deck: new Deck(),
      LibPoliciesEnacted: 0,
      FascPoliciesEnacted: 0,
      tracker: 0,
      presIdx: 0,
      SE: null,
      currentPres: null,
      currentChan: null,
      prevPres: null,
      prevChan: null,
      presCards: null,
      chanCards: null,
      presDiscard: null,
      chanPlay: null,
      presClaim: null,
      chanClaim: null,
      top3: null,
      log: [],
      govs: [],
      invClaims: [],
      confs: []
    }

    this.gameDatabase.push(game)
    this.joinGame(id, name, socketId)
    return id
  }

  joinGame(id: string, name: string, socketId: string){
    //in case they bypass the home page and go straight to url - frontend should catch this first anyway
    if(!name){
      throw new BadRequestException(`Player must have a name`)
    }
    const game = this.findById(id)

    const playerAlreadyInGame = game.players.find(player => player.name === name)
    if(!playerAlreadyInGame && game.players.length === 10){
      throw new BadRequestException(`up to 10 players per game.`)
    }

    if(playerAlreadyInGame){
      if(!playerAlreadyInGame.socketId){
        console.log('reassigning socketId')
        playerAlreadyInGame.socketId = socketId
      }
      else if(playerAlreadyInGame.socketId !== socketId){
        throw new BadRequestException(`A player with that name is already in the game. Choose a different name.`)
      }
    }
    else{
      if(game.status !== Status.CREATED){
        throw new BadRequestException("Cannot join a game that has already started.");
      }
      else{
        game.players.push({
          name,
          socketId,
          role: Role.LIB,
          hitler: false,
          alive: true,
          vote: undefined,
          investigated: false,
          investigations: [],
          bluesPlay: 0,
          confirmedFasc: false,
          omniFasc: false
        })
      }
    }
    this.eventEmitter.emit(JOIN_GAME, {socketId, id} )
    this.eventEmitter.emit(UPDATE_GAME, game)
    return game
  }

  leaveGame(id: string, socketId: string){
    const game = this.findById(id)
    const playerLeaving = game.players.find(player => player.socketId === socketId)

    if(!playerLeaving){
      throw new BadRequestException(`This player not found in game ${id}`)
    }

    //completely leave the game if in lobby
    if(game.status === Status.CREATED){
      game.players = game.players.filter(player => player !== playerLeaving)
      if(game.players.length === 0){
        console.log('deleting game')
        this.deleteGame(id)
      }
    }
    else{
      //game in progress - disconnect
      console.log('player disconnected - removing socketId')
      playerLeaving.socketId = null
    }
    // this.eventsGateway.updatePlayers(game)
    this.eventEmitter.emit(LEAVE_GAME, socketId)
    this.eventEmitter.emit(UPDATE_GAME, game)
    return
  }

  startGame(id: string){
    //do game setup logic
    const game = this.findById(id)

    if(game.status !== Status.CREATED){
      throw new BadRequestException(`Game ${id} has already started`)
    }
    // if(game.players.length < 5){
    //   throw new BadRequestException(`Can't start a game with fewer than 5 players`)
    // }
    this.logicService.startGame(game)
    this.eventEmitter.emit(UPDATE_GAME, game)
    //this will call the logic to initialize the game
    return
  }

  deleteGame(id: string){
    this.gameDatabase = this.gameDatabase.filter(game => game.id !== id)
  }

  findById(id: string){
    const game = this.gameDatabase.find(game => game.id === id)
    if(!game){
      throw new BadRequestException(`No game found with id ${id}`)
    }
    return game
  }

  setGameType(id: string, gameType: GameType){
    const game = this.findById(id)

    if(game.status !== Status.CREATED){
      throw new BadRequestException('Cannot change the game type after the game has started')
    }
    game.gameType = gameType
    this.eventEmitter.emit(UPDATE_GAME, game)
  }

  chooseChan(id: string, chanName: string){
    const game = this.findById(id)
    if(game.status !== Status.CHOOSE_CHAN){
      throw new BadRequestException(`Can't choose a chancellor at this time`)
    }
    this.logicService.chooseChan(game, chanName)
    this.eventEmitter.emit(UPDATE_GAME, game)
  }

  vote(id: string, name: string, vote: Vote){
    const game = this.findById(id)
    this.logicService.vote(game, name, vote)
    if(game.status === Status.VOTE_RESULT){
      setTimeout(()=> {
        this.logicService.determineResultofVote(game)
        this.eventEmitter.emit(UPDATE_GAME, game)
      }, 3000)
    }
    this.eventEmitter.emit(UPDATE_GAME, game)
  }

  presDiscard(id: string, cardColor: string){
    const game = this.findById(id)
    this.logicService.presDiscard(game, cardColor)
    this.eventEmitter.emit(UPDATE_GAME, game)
  }

  chanPlay(id: string, cardColor: string){
    const game = this.findById(id)
    this.logicService.chanPlay(game, cardColor)
    this.eventEmitter.emit(UPDATE_GAME, game)
  }

  chanClaim(id: string, claim: CHAN2){
    const game = this.findById(id)
    this.logicService.chanClaim(game, claim)
    this.eventEmitter.emit(UPDATE_GAME, game)
  }

  presClaim(id: string, claim: PRES3){
    const game = this.findById(id)
    this.logicService.presClaim(game, claim)
    this.eventEmitter.emit(UPDATE_GAME, game)
  }

  chooseInv(id: string, invName: string){
    const game = this.findById(id)
    if(game.status !== Status.INV){
      throw new BadRequestException(`Can't investigate at this time`)
    }
    this.logicService.chooseInv(game, invName)
    this.eventEmitter.emit(UPDATE_GAME, game)
  }

  invClaim(id: string, claim: Role){
    const game = this.findById(id)
    if(game.status !== Status.INV_CLAIM){
      throw new BadRequestException(`Can't claim inv at this time`)
    }
    this.logicService.invClaim(game, claim)
    this.eventEmitter.emit(UPDATE_GAME, game)
  }

  chooseSE(id: string, seName: string){
    const game = this.findById(id)
    if(game.status !== Status.SE){
      throw new BadRequestException(`Can't SE at this time`)
    }
    this.logicService.chooseSE(game, seName)
    this.eventEmitter.emit(UPDATE_GAME, game)
  }

  chooseGun(id: string, shotName: string){
    const game = this.findById(id)
    if(game.status !== Status.GUN){
      throw new BadRequestException(`Can't shoot at this time`)
    }
    this.logicService.shootPlayer(game, shotName)
    this.eventEmitter.emit(UPDATE_GAME, game)
  }

  inspect3Claim(id: string, claim: PRES3){
    const game = this.findById(id)
    this.logicService.inspect3Claim(game, claim)
    this.eventEmitter.emit(UPDATE_GAME, game)
  }

  vetoRequest(id: string){
    const game = this.findById(id)
    this.logicService.vetoRequest(game)
    this.eventEmitter.emit(UPDATE_GAME, game)
  }

  vetoReply(id: string, vetoAccepted: boolean){
    const game = this.findById(id)
    this.logicService.vetoReply(game, vetoAccepted)
    this.eventEmitter.emit(UPDATE_GAME, game)
  }



  // async setGameDataInCache(game: Game){
  //   const client = this.redisService.getClient()
  //   console.log('this is called')
  //   await client.set(game.id, JSON.stringify(game))
  // }
}