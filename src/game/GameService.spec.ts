import { Test, TestingModule } from "@nestjs/testing";
import { GameService } from "./game.service"
import { EventEmitter2 } from "@nestjs/event-emitter";
import { GameMockFactory } from "../test/GameMockFactory";
import { PlayerMockFactory } from "../test/PlayerMockFactory";
import { GameSettings, GameType, Status } from "../consts";
import { Game } from "../models/game.model";
import { JOIN_GAME, LEAVE_GAME, START_GAME, UPDATE_GAME } from "../consts/socketEventNames";
import { LogicService } from "./logic.service";
import { GameRepository } from "./game.repository";
import { GameRepositoryMock } from "../test/GameRepositoryMock";
import { Player } from "src/models/player.model";


describe("GameService", () => {
  let gameService: GameService
  let eventEmitter: EventEmitter2
  let id: string
  let game: Game
  let gameRepositoryMock: GameRepositoryMock = new GameRepositoryMock()


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
      {
        provide: GameRepository,
        useValue: gameRepositoryMock,
      },
        GameService, EventEmitter2, LogicService],
    }).compile();

    gameService = module.get<GameService>(GameService)
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

  })

  beforeEach(async () => {
    //don't do this. test createGame and joniGame like this
    //otherwise useGameMockFactory and just setplayers...
    // id = await gameService.createGame("player-1", '1')
    // gameService.joinGame(id, "player-2", "2")
    // gameService.joinGame(id, "player-3", "3")
    // gameService.joinGame(id, "player-4", "4")
    // gameService.joinGame(id, "player-5", "5")
    // gameService.joinGame(id, "player-6", "6")
    // gameService.joinGame(id, "player-7", "7")
    // gameService.joinGame(id, "player-8", "8")
    // gameService.joinGame(id, "player-9", "9")
    // gameService.joinGame(id, "player-10", "10")
    // game = await gameService.findById(id)
    const players = []
    for(let i = 1; i <= 10; i ++){
      players.push(new PlayerMockFactory().create({name: `player-${i}`}))
    }
    game = new GameMockFactory().create({players})
    id = game.id
  });

  describe("createGame", ()=> {
    it('creates a new game', async () => {
      jest.spyOn(gameService, "joinGame").mockImplementation(async () => new GameMockFactory().create());
      await gameService.createGame('player', 'ABCD')

      expect(gameRepositoryMock.map.size).toEqual(1)
      expect(() => gameRepositoryMock.map.get('ABCD')).toBeDefined()
      expect(gameService.joinGame).toBeCalled()
    })
  })

  describe("joinGame", ()=> {
    let gameId: string
    let player1: Player

    beforeEach(async () => {
      // gameId = await gameService.createGame('player-1', 'socket id')
      player1 = new PlayerMockFactory().create({name: 'player-1', socketId: 'socket id'})
      game = new GameMockFactory().create({players: [player1], id: 'mockId'})
      id = game.id
      gameRepositoryMock.set(id, game)
    })

    it('throws if no name', async () => {
      await expect(gameService.joinGame(id, undefined, undefined )).rejects.toThrow(`Player must have a name`)
    })

    it('throws if no game id found', async () => {
      await expect(gameService.joinGame('random_game_id', 'player', '1' )).rejects.toThrow(`No game found with id random_game_id`)
    })

    it('throws if game at capacity', async () => {
      for(let i = 2; i <= 10; i++){
        await gameService.joinGame(id, `player-${i}`, undefined)
      }
      await expect(gameService.joinGame(id, 'player-11', '11' )).rejects.toThrow(`up to 10 players per game.`)
    })

    it('throws when repeated name tries to join', async ()=> {
      await expect(gameService.joinGame(id, 'player-1', 'new socket id')).rejects.toThrow(`A player with that name is already in the game. Choose a different name.`)
    })

    it('throws when new player joins a game in progress', async ()=> {
      game.status = Status.CHOOSE_CHAN
      await expect(gameService.joinGame(id, 'player-2', '20')).rejects.toThrow(`Cannot join a game that has already started.`)
    })

    it('allows player to rejoin a game in progress', async ()=> {
      player1.socketId = undefined
      game.status = Status.CHOOSE_CHAN
      await expect(gameService.joinGame(id, 'player-1', 'new socket id')).resolves.not.toThrow()
      expect(player1.socketId).toBe('new socket id')
    })

    it('adds new player to the game', async () => {
      await gameService.joinGame(id, 'player-2', undefined)
      expect(game.players).toHaveLength(2)
      expect(game.players[1].name).toEqual('player-2')
    })

    it('emits the proper messages', async () => {
      jest.spyOn(eventEmitter, 'emit')
      jest.spyOn(gameService, 'handleUpdate')
      await gameService.joinGame(id, 'player-3', 'socket id')
      expect(gameService.handleUpdate).toHaveBeenCalledWith(id, game)
      expect(gameService.handleUpdate).toHaveBeenCalledTimes(1)
      expect(eventEmitter.emit).toHaveBeenCalledWith(JOIN_GAME, {socketId: 'socket id', id})
    })
  })

//   describe("leaveGame", ()=> {
//     beforeEach(async () => {
//       gameService.leaveGame(id, "1")
//     });

//     it('throws when player leaving not found', async () => {
//       expect(() => gameService.leaveGame(id, '20')).toThrow(`This player not found in game ${id}`)
//     })

//     it('removes a player when game has not started', async () => {
//       const player1 = game.players.find(player => player.name === 'player-1')
//       expect(player1).toBeUndefined()
//     })

//     it('deletes a created game when no players are in it', async () => {
//       jest.spyOn(gameService, "deleteGame")
//       expect(gameService.deleteGame).not.toBeCalled()
//       for(const player of game.players){
//         gameService.leaveGame(id, player.socketId)
//       }
//       expect(gameService.deleteGame).toBeCalled()
//     })

//     it('deletes a started game when no players are in it', async () => {
//       jest.spyOn(gameService, "deleteGame")
//       game.status = Status.CHOOSE_CHAN
//       for(const player of game.players){
//         gameService.leaveGame(id, player.socketId)
//       }
//       expect(gameService.deleteGame).toBeCalled()
//     })

//     it('removes socket id but does not delete player when game in progress', async () => {
//       game.status = Status.CHOOSE_CHAN
//       gameService.leaveGame(id, "2")
//       const player2 = game.players.find(player => player.name === 'player-2')
//       expect(player2.socketId).toBeNull()
//       expect(player2).not.toBeUndefined()
//     })


//     it('deletes a game when no players are in it', async () => {
//       jest.spyOn(eventEmitter, "emit")
//       gameService.leaveGame(id, '2')
//       expect(eventEmitter.emit).toBeCalledWith(LEAVE_GAME, '2')
//       expect(eventEmitter.emit).toBeCalledWith(UPDATE_GAME, game)
//     })
//   })


//   describe("startGame", ()=> {
//     it('throws if not enough players', ()=>{
//       const game = new GameMockFactory().create()
//       gameService.gameDatabase.push(game)
//       expect(() => gameService.startGame(game.id)).toThrow(`Can't start a game with fewer than 5 players`)
//     })
//     it('starts a game', async () => {
//       expect(() => gameService.startGame('ABCD')).toThrow(`No game found with id ABCD`)
//       jest.spyOn(eventEmitter, 'emit')
//       gameService.startGame(id)
//       expect(game.status).toBe(Status.CHOOSE_CHAN)
//       expect(eventEmitter.emit).toHaveBeenCalledWith(UPDATE_GAME, game)
//       expect(() => gameService.startGame(id)).toThrow(`Game ${id} has already started`)
//     })
//   })


//   describe("deleteGame", ()=> {
//     it('deletes a game', async () => {
//       gameService.deleteGame(id)
//       expect(gameService.gameDatabase).toHaveLength(0)
//     })
//   })

//   describe("setGameSettings", ()=> {
//     let gameSettings: GameSettings
//     beforeEach(() => {
//       gameSettings = {type: GameType.NORMAL, redDown: true, libSpy: true, hitlerKnowsFasc: true}
//     })
//     it('changes the game settings', async () => {
//       jest.spyOn(eventEmitter, 'emit')
//       gameService.setGameSettings(id, gameSettings)
//       expect(game.settings.type).toEqual(GameType.NORMAL)
//       expect(game.settings.redDown).toEqual(true)
//       expect(game.settings.libSpy).toEqual(true)
//       expect(game.settings.hitlerKnowsFasc).toEqual(true)
//       expect(eventEmitter.emit).toHaveBeenCalledWith(UPDATE_GAME, game)
//     })

//     it('throws if game settings are changed after game has started', ()=>{
//       game.status = Status.CHOOSE_CHAN
//       expect(()=> gameService.setGameSettings(id, gameSettings)).toThrow('Cannot change the game settings after the game has started')

//     })
//   })

//   describe("findById", ()=> {
//     it('throws if game not found', async () => {
//       expect(() => gameService.findById('ABCD')).toThrow(`No game found with id ABCD`)
//       const game = gameService.findById(id)
//       expect(game.id).not.toBeNull()
//     })
//   })

//   describe("chooseChan", ()=>{
//     let mockGame: Game
//     beforeEach(()=> {
//       mockGame = new GameMockFactory().create({status: Status.CHOOSE_CHAN})
//       mockGame.players.push(new PlayerMockFactory().create({name: 'current-pres'}))
//       mockGame.players.push(new PlayerMockFactory().create({name: 'chan-pick'}))
//       mockGame.alivePlayers = mockGame.players
//       mockGame.currentPres = mockGame.players[0]
//       gameService.gameDatabase.push(mockGame)
//       gameService.chooseChan(mockGame.id, 'chan-pick')
//     })

//     it('sets the current chan', ()=>{
//       expect(mockGame.currentChan).toBeDefined()
//       expect(mockGame.currentChan.name).toEqual('chan-pick')
//     })

//     it('sets game status to vote', ()=> {
//       expect(mockGame.status).toEqual(Status.VOTE)
//     })
//   })
// })

})