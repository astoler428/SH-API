import {
  BadRequestException,
  Inject,
  Injectable,} from "@nestjs/common";
import { Game } from "../models/game.model";
import { Status, Role, GameType, Vote, PRES3, CHAN2, Team, GameSettings } from "../consts";
import Deck from "../classes/deckClass";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { JOIN_GAME, LEAVE_GAME, START_GAME, UPDATE, UPDATE_GAME, UPDATE_PLAYERS } from "../consts/socketEventNames";
import { LogicService } from "./logic.service";
import { GameRepository } from "./game.repository";


@Injectable()
export class GameService{
  constructor(private eventEmitter: EventEmitter2, private logicService: LogicService, private gameRespository: GameRepository
){}
  //temp fake database
  // public gameDatabase: Game[] = []

  async createGame(name: string, socketId: string) {
    let id: string
    let existingGame: Game
    do{
      id = Math.random().toString(36).slice(2).substring(0, 4).toUpperCase();
      existingGame = await this.gameRespository.get(id)
    }
    while(existingGame)

    const game: Game = {
      id,
      createdBy: name,
      settings: {
        type: GameType.BLIND,
        redDown: false,
        libSpy: false,
        hitlerKnowsFasc: false
      },
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

    // this.gameDatabase.push(game)
    await this.gameRespository.set(id, game)
    this.joinGame(id, name, socketId)
    return id
  }

  async joinGame(id: string, name: string, socketId: string){
    //in case they bypass the home page and go straight to url - frontend should catch this first anyway
    if(!name){
      throw new BadRequestException(`Player must have a name`)
    }
    const game = await this.findById(id)

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
          team: Team.LIB,
          role: Role.LIB,
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
    this.handleUpdate(id, game)
    this.eventEmitter.emit(JOIN_GAME, {socketId, id} )
    return game
  }

  async leaveGame(id: string, socketId: string){
    const game = await this.findById(id)
    const playerLeaving = game.players.find(player => player.socketId === socketId)

    if(!playerLeaving){
      throw new BadRequestException(`This player not found in game ${id}`)
    }

    let gameDeleted = false
    //completely leave the game if in lobby
    if(game.status === Status.CREATED){
      game.players = game.players.filter(player => player !== playerLeaving)
      if(game.players.length === 0){
        console.log('deleting game')
        gameDeleted = true
        this.deleteGame(id)
      }
    }
    else{
      //game in progress - disconnect
      console.log('player disconnected - removing socketId')
      playerLeaving.socketId = null

      //if everybody disconnects - thenn delete game
      if(game.players.every(player => player.socketId === null)){
        console.log('deleting game')
        gameDeleted = true
        this.deleteGame(id)
      }
    }
    if(!this.deleteGame){
      this.gameRespository.update(id, game)
    }
    this.eventEmitter.emit(LEAVE_GAME, socketId)
    this.eventEmitter.emit(UPDATE_GAME, game)
    return
  }

  async startGame(id: string){
    //do game setup logic
    const game = await this.findById(id)

    if(game.status !== Status.CREATED){
      throw new BadRequestException(`Game ${id} has already started`)
    }
    if(game.players.length < 5){
      throw new BadRequestException(`Can't start a game with fewer than 5 players`)
    }
    this.logicService.startGame(game)
    this.handleUpdate(id, game)
    return
  }

  async deleteGame(id: string){
    await this.gameRespository.delete(id)
    // this.gameDatabase = this.gameDatabase.filter(game => game.id !== id)
  }

  async findById(id: string): Promise<Game>{
    const game = await this.gameRespository.get(id)

    // const game = this.gameDatabase.find(game => game.id === id)
    if(!game){
      throw new BadRequestException(`No game found with id ${id}`)
    }
    return game
  }

  async setGameSettings(id: string, gameSettings: GameSettings){
    const game = await this.findById(id)

    if(game.status !== Status.CREATED){
      throw new BadRequestException('Cannot change the game settings after the game has started')
    }
    if(gameSettings.type === GameType.BLIND){
      game.settings = {
        ...gameSettings,
        libSpy: false,
        hitlerKnowsFasc: false
      }
    }
    else{
      game.settings = gameSettings
    }
    this.handleUpdate(id, game)
  }

  async chooseChan(id: string, chanName: string){
    const game = await this.findById(id)
    if(game.status !== Status.CHOOSE_CHAN){
      throw new BadRequestException(`Can't choose a chancellor at this time`)
    }
    this.logicService.chooseChan(game, chanName)
    this.handleUpdate(id, game)
  }

  async vote(id: string, name: string, vote: Vote){
    const game = await this.findById(id)
    this.logicService.vote(game, name, vote)
    if(game.status === Status.VOTE_RESULT){
      setTimeout(()=> {
        this.logicService.determineResultofVote(game)
        this.eventEmitter.emit(UPDATE_GAME, game)
      }, 2000)
    }
    this.handleUpdate(id, game)
  }

  async presDiscard(id: string, cardColor: string){
    const game = await this.findById(id)
    this.logicService.presDiscard(game, cardColor)
    this.handleUpdate(id, game)
  }

  async chanPlay(id: string, cardColor: string){
        const game = await this.findById(id)

    this.logicService.chanPlay(game, cardColor)
    this.handleUpdate(id, game)
  }

  async chanClaim(id: string, claim: CHAN2){
        const game = await this.findById(id)

    this.logicService.chanClaim(game, claim)
    this.handleUpdate(id, game)
  }

  async presClaim(id: string, claim: PRES3){
        const game = await this.findById(id)

    this.logicService.presClaim(game, claim)
    this.handleUpdate(id, game)
  }

  async chooseInv(id: string, invName: string){
        const game = await this.findById(id)

    if(game.status !== Status.INV){
      throw new BadRequestException(`Can't investigate at this time`)
    }
    this.logicService.chooseInv(game, invName)
    this.handleUpdate(id, game)
  }

  async invClaim(id: string, claim: Role){
        const game = await this.findById(id)

    if(game.status !== Status.INV_CLAIM){
      throw new BadRequestException(`Can't claim inv at this time`)
    }
    this.logicService.invClaim(game, claim)
    this.handleUpdate(id, game)
  }

  async chooseSE(id: string, seName: string){
        const game = await this.findById(id)

    if(game.status !== Status.SE){
      throw new BadRequestException(`Can't SE at this time`)
    }
    this.logicService.chooseSE(game, seName)
    this.handleUpdate(id, game)
  }

  async chooseGun(id: string, shotName: string){
        const game = await this.findById(id)

    if(game.status !== Status.GUN){
      throw new BadRequestException(`Can't shoot at this time`)
    }
    this.logicService.shootPlayer(game, shotName)
    this.handleUpdate(id, game)
  }

  async inspect3Claim(id: string, claim: PRES3){
    const game = await this.findById(id)
    this.logicService.inspect3Claim(game, claim)
    this.handleUpdate(id, game)
  }

  async vetoRequest(id: string){
    const game = await this.findById(id)
    this.logicService.vetoRequest(game)
    this.handleUpdate(id, game)
  }

  async vetoReply(id: string, vetoAccepted: boolean){
    const game = await this.findById(id)
    this.logicService.vetoReply(game, vetoAccepted)
    this.handleUpdate(id, game)
  }

  async handleUpdate(id: string, game: Game){
    this.gameRespository.update(id, game)
    this.eventEmitter.emit(UPDATE_GAME, game)
  }



  // async setGameDataInCache(game: Game){
  //   const client = this.redisService.getClient()
  //   console.log('this is called')
  //   await client.set(game.id, JSON.stringify(game))
  // }
}