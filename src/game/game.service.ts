import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";import { Game } from "../models/game.model";
import { Status, Role, GameType } from "../consts";
import Deck from "../classes/deckClass";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { JOIN_GAME, LEAVE_GAME, START_GAME, UPDATE_GAME, UPDATE_PLAYERS } from "../consts/socketEventNames";


@Injectable()
export class GameService{

  constructor(private eventEmitter: EventEmitter2){}
  //temp fake database
  public gameDatabase: Game[] = []

  createGame(name: string, socketId: string){
    const id: string = Math.random().toString(36).slice(2).substring(0, 4).toUpperCase();

    const game: Game = {
      id,
      createdBy: name,
      gameType: GameType.BLIND,
      status: Status.CREATED,
      players: [],
      alivePlayers: [],
      deadPlayers: [],
      deck: new Deck(),
      LibPoliciesEnacted: 0,
      FascPoliciesEnacted: 0,
      tracker: 0,
      presIdx: 0,
      SE: null,
      currentPres: null,
      curentChan: null,
      PrevPres: null,
      PrevChan: null,
      presCards: null,
      chanCards: null,
      presDiscard: null,
      chanPlay: null,
      presClaim: null,
      chanClaim: null,
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

    //throws in findById if no game
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
    if(!game){
      throw new BadRequestException(`No game found with id ${id}`)
    }
    //if already started, do nothing
    game.status = Status.CHOOSE_CHAN
    this.eventEmitter.emit(UPDATE_GAME, game)
    //this will call the logic to initialize the game
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
    game.gameType = gameType
    this.eventEmitter.emit(UPDATE_GAME, game)
  }
}