import {
  BadRequestException,
  Inject,
  Injectable,} from "@nestjs/common";
import { Game } from "../models/game.model";
import { Deck } from "../models/deck.model";
import { Status, Role, GameType, Vote, PRES3, CHAN2, Team, GameSettings } from "../consts";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { JOIN_GAME, LEAVE_GAME, START_GAME, UPDATE, UPDATE_GAME, UPDATE_PLAYERS } from "../consts/socketEventNames";
import { LogicService } from "./logic.service";
import { GameRepository } from "./game.repository";
import { DefaultActionService } from "./defaultAction.service";
import { getFormattedDate } from "src/helperFunctions";

@Injectable()
export class GameService{
  constructor(
    private eventEmitter: EventEmitter2,
    private logicService: LogicService,
    private gameRespository: GameRepository,
    private defaultActionService: DefaultActionService
){}

  async createGame(name: string, socketId: string) {
    let id: string
    let existingGame: Game
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    do{
      id = [1,2,3,4].map(() => letters.charAt(Math.floor(Math.random() * 26))).join('')
      // id = Math.random().toString(36).slice(2).substring(0, 4).toUpperCase();
      existingGame = await this.gameRespository.get(id)
    }
    while(existingGame)

    const game: Game = {
      id,
      host: name,
      settings: {
        type: GameType.BLIND,
        redDown: false,
        simpleBlind: false,
        hitlerKnowsFasc: false,
      },
      status: Status.CREATED,
      players: [],
      deck: {drawPile: [], discardPile: [], deckNum: 1},
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
      chat: [],
      govs: [],
      invClaims: [],
      confs: []
    }

    await this.gameRespository.set(id, game)
    this.joinGame(id, name, socketId)
    return id
  }

  async joinGame(id: string, name: string, socketId: string){
    //in case they bypass the home page and go straight to url - frontend should catch this first anyway
    if(!name){
      throw new BadRequestException(`You must have a name`)
    }
    const game = await this.findById(id)

    const playerAlreadyInGame = game.players.find(player => player.name === name)
    if(!playerAlreadyInGame && game.players.length === 10){
      throw new BadRequestException(`Game is full`)
    }

    if(playerAlreadyInGame){
      if(!playerAlreadyInGame.socketId){
        // console.log('reassigning socketId')
        playerAlreadyInGame.socketId = socketId
      }
      else if(playerAlreadyInGame.socketId !== socketId){
        throw new BadRequestException(`A player with that name is already in the game`)
      }
    }
    else{
      if(game.status !== Status.CREATED){
        throw new BadRequestException("Game already started");
      }
      else{
        game.players.push({
          name,
          socketId,
          color: 'black',
          team: Team.LIB,
          role: Role.LIB,
          alive: true,
          vote: null,
          investigated: false,
          investigations: [],
          bluesPlayed: 0,
          confirmedFasc: false,
          omniFasc: false,
          guessedToBeLibSpy: false,
        })
     }
    }
    await this.handleUpdate(id, game)
    this.eventEmitter.emit(JOIN_GAME, {socketId, id} )
    return game
  }

  async leaveGame(id: string, socketId: string){
    // console.log(`player leaving has socketId ${socketId}`)
    const game = await this.findById(id)
    const playerLeaving = game.players.find(player => player.socketId === socketId)

    if(!playerLeaving){
      return
      // throw new BadRequestException(`This player not found in game ${id}`)
    }

    let gameDeleted = false
    //completely leave the game if in lobby
    if(game.status === Status.CREATED){
      // console.log('deleting player')
      game.players = game.players.filter(player => player !== playerLeaving)
      if(game.players.length === 0){
        // console.log('deleting game')
        gameDeleted = true
        this.deleteGame(id)
      }
      else if(playerLeaving.name === game.host){
        game.host = game.players[0]?.name
      }

      //here set new host
    }
    else{
      //game in progress - disconnect
      // console.log('player disconnected - removing socketId')
      playerLeaving.socketId = null

      //if everybody disconnects - thenn delete game
      if(game.players.every(player => player.socketId === null)){
        // console.log('deleting game')
        setTimeout(async ()=> {
          const game = await this.gameRespository.get(id)
          if(game?.players.every(player => player.socketId === null)){
            gameDeleted = true
            this.deleteGame(id)
          }
        }, 1000*5*60)

        //maybe try adding something like settimeout for a while, then if still all null, then delete game in case everyone gets kicked or something
      }
    }
    if(!gameDeleted){
      this.gameRespository.update(id, game)
    }
    this.eventEmitter.emit(LEAVE_GAME, socketId)
    this.eventEmitter.emit(UPDATE_GAME, game)
    return
  }

  async startGame(id: string){
    const game = await this.findById(id)
    if(game.status !== Status.CREATED){
      throw new BadRequestException(`Game ${id} has already started`)
    }
    if(game.players.length < 5){
      throw new BadRequestException(`Can't start a game with fewer than 5 players`)
    }
    this.logicService.startGame(game)
    const timeout = game.settings.type === GameType.BLIND ? 2000 : 9000
    setTimeout(async () => {
      const game = await this.findById(id)
      game.status = Status.CHOOSE_CHAN
      await this.handleUpdate(id, game)
    }, timeout)
    await this.handleUpdate(id, game)
    return
  }

  async deleteGame(id: string){
    await this.gameRespository.delete(id)
  }

  async findById(id: string): Promise<Game>{
    const game = await this.gameRespository.get(id)
    if(!game){
      throw new BadRequestException(`No game found with ID ${id}`)
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
        hitlerKnowsFasc: false,
      }
    }
    else{
      game.settings = {
        ...gameSettings,
        simpleBlind: false
      }
    }
    // if(gameSettings.type !== GameType.LIB_SPY){
    //   game.settings.teamLibSpy = false
    // }
    await this.handleUpdate(id, game)
  }

  async chooseChan(id: string, chanName: string){
    const game = await this.findById(id)
    if(game.status !== Status.CHOOSE_CHAN){
      throw new BadRequestException(`Can't choose a chancellor at this time`)
    }
    this.logicService.chooseChan(game, chanName)
    await this.handleUpdate(id, game)
  }

  async vote(id: string, name: string, vote: Vote){
    const game = await this.findById(id)
    this.logicService.vote(game, name, vote)
    if(game.status === Status.SHOW_VOTE_RESULT){
      setTimeout(async ()=> {
        const game = await this.findById(id)
        this.logicService.determineResultofVote(game)
        await this.handleUpdate(id, game)
      }, 3000)
    }
    await this.handleUpdate(id, game)
  }

  async presDiscard(id: string, cardColor: string){
    const game = await this.findById(id)
    this.logicService.presDiscard(game, cardColor)
    await this.handleUpdate(id, game)
  }

  async chanPlay(id: string, cardColor: string){
    const game = await this.findById(id)
    this.logicService.chanPlay(game, cardColor)
    //if game didn't end (tell by status being chan claim), then
    await this.handleUpdate(id, game)
  }

  async chanClaim(id: string, claim: CHAN2){
    const game = await this.findById(id)
    this.logicService.chanClaim(game, claim)
    await this.handleUpdate(id, game)
  }

  async presClaim(id: string, claim: PRES3){
    const game = await this.findById(id)
    this.logicService.presClaim(game, claim)
    await this.handleUpdate(id, game)
  }

  async chooseInv(id: string, invName: string){
    const game = await this.findById(id)
    if(game.status !== Status.INV){
      throw new BadRequestException(`Can't investigate at this time`)
    }
    this.logicService.chooseInv(game, invName)
    await this.handleUpdate(id, game)
     setTimeout(async ()=> {
      const game = await this.findById(id)
      this.logicService.setInv(game, invName)
      await this.handleUpdate(id, game)
      }, 3000)
  }

  async invClaim(id: string, claim: Team){
    const game = await this.findById(id)
    if(game.status !== Status.INV_CLAIM){
      throw new BadRequestException(`Can't claim inv at this time`)
    }
    this.logicService.invClaim(game, claim)
    await this.handleUpdate(id, game)
  }

  async chooseSE(id: string, seName: string){
    const game = await this.findById(id)
    if(game.status !== Status.SE){
      throw new BadRequestException(`Can't SE at this time`)
    }
    this.logicService.chooseSE(game, seName)
    await this.handleUpdate(id, game)
  }

  async chooseGun(id: string, shotName: string){
    const game = await this.findById(id)
    if(game.status !== Status.GUN){
      throw new BadRequestException(`Can't shoot at this time`)
    }
    this.logicService.shootPlayer(game, shotName)
    await this.handleUpdate(id, game)
  }

  async chooseLibSpy(id: string, spyName: string){
    const game = await this.findById(id)
    if(game.status !== Status.LIB_SPY_GUESS){
      throw new BadRequestException(`Can't guess Lib Spy at this time`)
    }
    this.logicService.guessLibSpy(game, spyName)
    setTimeout(async ()=> {
      const game = await this.findById(id)
      this.logicService.determineResultOfLibSpyGuess(game, spyName)
      await this.handleUpdate(id, game)
    }, 2000)
    await this.handleUpdate(id, game)
  }

  async inspect3Claim(id: string, claim: PRES3){
    const game = await this.findById(id)
    this.logicService.inspect3Claim(game, claim)
    await this.handleUpdate(id, game)
  }

  async vetoRequest(id: string){
    const game = await this.findById(id)
    this.logicService.vetoRequest(game)
    await this.handleUpdate(id, game)
  }

  async vetoReply(id: string, vetoAccepted: boolean){
    const game = await this.findById(id)
    this.logicService.vetoReply(game, vetoAccepted)
    await this.handleUpdate(id, game)
  }

  async confirmFasc(id: string, name: string){
    const game = await this.findById(id)
    this.logicService.confirmFasc(game, name)
    await this.handleUpdate(id, game)
  }


  async defaultPresDiscard(id: string){
    const game = await this.findById(id)
    const cardColor = this.defaultActionService.defaultPresDiscard(game)
    await this.presDiscard(id, cardColor)
  }

  async defaultChanPlay(id: string){
    const game = await this.findById(id)
    const cardColor = this.defaultActionService.defaultChanPlay(game);
    if(!cardColor){
      //means veto
      await this.vetoRequest(id)
    }
    else{
      await this.chanPlay(id, cardColor)
    }
  }

  async defaultChanClaim(id: string){
    const game = await this.findById(id)
    const claim = this.defaultActionService.defaultChanClaim(game);
    await this.chanClaim(id, claim)
  }

  async defaultPresClaim(id: string){
    const game = await this.findById(id)
    const claim = this.defaultActionService.defaultPresClaim(game);
    await this.presClaim(id, claim)
  }

  async defaultInvClaim(id: string){
    const game = await this.findById(id)
    const claim = this.defaultActionService.defaultInvClaim(game);
    await this.invClaim(id, claim)
  }

  async defaultInspect3Claim(id: string){
    const game = await this.findById(id)
    const claim = this.defaultActionService.defaultInspect3Claim(game);
    await this.inspect3Claim(id, claim)
  }

  async defaultVetoReply(id: string){
    const game = await this.findById(id)
    const vetoReply = this.defaultActionService.defaultVetoReply(game);
    await this.vetoReply(id, vetoReply)
  }

  async handleUpdate(id: string, game: Game){
    await this.gameRespository.update(id, game)
    this.eventEmitter.emit(UPDATE_GAME, game)
  }

  async chatMessage(id: string, name: string, message: string){
    const game = await this.findById(id)
    game.chat.push({name, date: getFormattedDate(), message})
    game.log.push({name, date: getFormattedDate(), message})
    await this.handleUpdate(id, game)
  }
}