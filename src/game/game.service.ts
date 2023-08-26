import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";import { Game } from "../models/game.model";
import { Player } from "src/models/player.model";
import { Socket } from "socket.io";
import { Status, Role, Vote } from "src/consts";
import Deck from "src/classes/deckClass";

@Injectable()
export class GameService{
  //temp fake database
  private gameDatabase: Game[] = []

  createGame(name: string, socket: Socket){
    //make sure there is a name...
    const id: string = Math.random()
    .toString(36)
    .slice(2)
    .substring(0, 4)
    .toUpperCase();

    const game: Game = {
      id,
      socketMap: new Map<Player, Socket>(),
      status: Status.CREATED,
      players: [],
      alivePlayers: [],
      deadPlayers: [],
      deck: new Deck(),
      LibPoliciesEnacted: 0,
      FascPoliciesEnacted: 0,
      tracker: 0,
      presIdx: 0,
      SE: undefined,
      currentPres: undefined,
      curentChan: undefined,
      PrevPres: undefined,
      PrevChan: undefined,
      presCards: undefined,
      chanCards: undefined,
      presDiscard: undefined,
      chanPlay: undefined,
      presClaim: undefined,
      chanClaim: undefined,
      govs: [],
      invClaims: [],
      confs: []
    }

    this.gameDatabase.push(game)
    //emit message that game has been created
    this.joinGame(id, name, socket)
    return game
  }

  joinGame(id: string, name: string, socket: Socket){
    //in case they bypass the home page and go straight to url - frontend should catch this first anyway
    if(!name){
      return new BadRequestException(`Player must have a name`)
    }
    //find game
    const game = this.gameDatabase.find(game => game.id === id)

    if(!game){
      return new BadRequestException(`No game found with id ${id}`)
    }

    if(game.players.length === 10){
      return new BadRequestException(`up to 10 players per game.`)
    }

    const playerAlreadyInGame = game.players.find(player => player.name === name)

    if(playerAlreadyInGame){
      const playerDisconnected = game.socketMap.get(playerAlreadyInGame) === undefined
      if(playerDisconnected){
        game.socketMap.set(playerAlreadyInGame, socket)
      }
      else{
        return new BadRequestException(`A player with that name is already in the game. Choose a different name.`)
      }
    }
    else{
      if(game.status !== Status.CREATED){
        throw new BadRequestException("Cannot join a game that has already started.");
      }
      else{
        game.players.push({
          name,
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
    //emit an event
    return game
  }
}