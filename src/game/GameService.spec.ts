import { Test, TestingModule } from "@nestjs/testing";
import { GameService } from "./game.service"
import { EventEmitter2 } from "@nestjs/event-emitter";
import { GameMockFactory } from "../test/GameMockFactory";
import { PlayerMockFactory } from "../test/PlayerMockFactory";
import { Color, GameSettings, GameType, Status, Vote } from "../consts";
import { Game } from "../models/game.model";
import { JOIN_GAME, LEAVE_GAME, START_GAME, UPDATE_GAME } from "../consts/socketEventNames";
import { LogicService } from "./logic.service";
import { GameRepository } from "./game.repository";
import { GameRepositoryMock } from "../test/GameRepositoryMock";
import { Player } from "src/models/player.model";
import { DefaultActionService } from "./defaultAction.service";
import { ProbabilityService } from "./probability.service";


jest.useFakeTimers()

describe("GameService", () => {
  let gameService: GameService
  let eventEmitter: EventEmitter2
  let logicService: LogicService
  let defaultActionService: DefaultActionService
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
        GameService, EventEmitter2, LogicService, DefaultActionService, ProbabilityService],
    }).compile();

    gameService = module.get<GameService>(GameService)
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    logicService = module.get<LogicService>(LogicService);
    defaultActionService = module.get<DefaultActionService>(DefaultActionService);
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
    let player1: Player

    beforeEach(async () => {
      // gameId = await gameService.createGame('player-1', 'socket id')
      player1 = new PlayerMockFactory().create({name: 'player-1', socketId: 'socket id'})
      game = new GameMockFactory().create({players: [player1], id: 'mockId'})
      id = game.id
      gameRepositoryMock.set(id, game)
    })

    it('throws if no name', async () => {
      await expect(gameService.joinGame(id, undefined, undefined )).rejects.toThrow(`You must have a name`)
    })

    it('throws if game at capacity', async () => {
      for(let i = 2; i <= 10; i++){
        await gameService.joinGame(id, `player-${i}`, undefined)
      }
      await expect(gameService.joinGame(id, 'player-11', '11' )).rejects.toThrow(`Game is full`)
    })

    it('throws when repeated name tries to join', async ()=> {
      await expect(gameService.joinGame(id, 'player-1', 'new socket id')).rejects.toThrow(`A player with that name is already in the game`)
    })

    it('throws when new player joins a game in progress', async ()=> {
      game.status = Status.CHOOSE_CHAN
      await expect(gameService.joinGame(id, 'player-2', '20')).rejects.toThrow(`Game already started`)
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

  describe("leaveGame", ()=> {
    let player1: Player
    beforeEach(async () => {
      gameRepositoryMock.delete(id)
      gameRepositoryMock.set(id, game)
      player1 = game.players.find(player => player.name === 'player-1')
      player1.socketId = 'player-1-socketid'
      game.status = Status.CREATED
    });

    it.skip('throws when player leaving not found', async () => {
      await expect(gameService.leaveGame(id, 'unkown socket id')).rejects.toThrow(`This player not found in game ${id}`)
    })

    it('removes a player when game has not started', async () => {
      await gameService.leaveGame(id, 'player-1-socketid')
      const player1StillThere = game.players.find(player => player.name === 'player-1') !== undefined
      expect(player1StillThere).toBe(false)
    })

    it('adjusts the host if the host leaves in a created game', async () => {
      game.host = player1.name
      expect(game.host).toBe('player-1')
      await gameService.leaveGame(id, 'player-1-socketid')
      expect(game.host).toBe('player-2')
    })

    it('does not adjust the host if the host leaves in a started game', async () => {
      game.host = player1.name
      game.status = Status.CHOOSE_CHAN
      expect(game.host).toBe('player-1')
      await gameService.leaveGame(id, 'player-1-socketid')
      expect(game.host).toBe('player-1')
    })

    it('deletes a created game when no players are in it', async () => {
      jest.spyOn(gameService, "deleteGame")
      expect(gameService.deleteGame).not.toBeCalled()
      for(const player of game.players){
        await gameService.leaveGame(id, player.socketId)
      }
      expect(gameService.deleteGame).toBeCalledTimes(1)
    })

    //test not working because of async findbyid inside callback, can't wait for that before checking delete game
    it.skip('deletes a started game when no players are in it after timeout', async () => {
      jest.spyOn(gameService, "deleteGame")
      game.status = Status.CHOOSE_CHAN
      await Promise.all(game.players.map(async (player) => {
        await gameService.leaveGame(id, player.socketId)
    }))
      expect(gameService.deleteGame).toBeCalledTimes(0)
      jest.advanceTimersByTime(1000*60*5)
    })

    it('removes socket id but does not delete player when game in progress', async () => {
      game.status = Status.CHOOSE_CHAN
      await gameService.leaveGame(id, 'player-1-socketid')
      expect(player1.socketId).toBeNull()
      const player1StillThere = game.players.find(player => player.name === 'player-1') !== undefined
      expect(player1StillThere).toBe(true)
    })


    it('calls the appropriate functions to store and emit', async () => {
      jest.spyOn(eventEmitter, "emit")
      jest.spyOn(gameRepositoryMock, "update")
      await gameService.leaveGame(id, 'player-1-socketid')
      expect(eventEmitter.emit).toBeCalledWith(LEAVE_GAME, 'player-1-socketid')
      expect(eventEmitter.emit).toBeCalledWith(UPDATE_GAME, game)
      expect(gameRepositoryMock.update).toBeCalledWith(id, game)
    })
  })

  describe("startGame", ()=> {
    beforeEach(() => {
      jest.spyOn(gameService, 'findById').mockImplementation(async () => game)
    })

    it('throws if not enough players', async ()=>{

      game.players = game.players.slice(0, 4)
      await expect(gameService.startGame(id)).rejects.toThrow(`Can't start a game with fewer than 5 players`)
    })

    it('starts a game', async () => {
      jest.spyOn(gameService, 'handleUpdate')
      jest.spyOn(logicService, 'startGame')
      await gameService.startGame(id)
      expect(logicService.startGame).toHaveBeenCalledTimes(1)
      expect(game.status).toBe(Status.CHOOSE_CHAN)
      expect(gameService.handleUpdate).toHaveBeenCalledWith(id, game)
      expect(gameService.handleUpdate).toHaveBeenCalledTimes(1)

      await expect(gameService.startGame(id)).rejects.toThrow(`Game ${id} has already started`)
    })
  })


  describe("deleteGame", ()=> {
    it('deletes a game', async () => {
      gameRepositoryMock.map.clear()
      gameRepositoryMock.set(id, game)
      await gameService.deleteGame(id)
      expect(gameRepositoryMock.map.size).toEqual(0)
    })
  })

  describe("setGameSettings", ()=> {
    let gameSettings: GameSettings
    beforeEach(() => {
      gameSettings = {type: GameType.NORMAL, redDown: true, simpleBlind: false, hitlerKnowsFasc: true}
      jest.clearAllMocks()
      jest.spyOn(gameService, 'findById').mockImplementation(async () => game)
      jest.spyOn(gameService, 'handleUpdate')
    })
    it('changes the game settings', async () => {
      await gameService.setGameSettings(id, gameSettings)
      expect(game.settings.type).toEqual(GameType.NORMAL)
      expect(game.settings.redDown).toEqual(true)
      expect(game.settings.simpleBlind).toEqual(false)
      expect(game.settings.hitlerKnowsFasc).toEqual(true)
      expect(gameService.handleUpdate).toHaveBeenCalledWith(id, game)
      expect(gameService.handleUpdate).toHaveBeenCalledTimes(1)
    })

    it('resets the hitler knows fasc if game setting set to BlIND', async () => {
      gameSettings.type = GameType.BLIND
      await gameService.setGameSettings(id, gameSettings)
      expect(game.settings.type).toEqual(GameType.BLIND)
      expect(game.settings.redDown).toEqual(true)
      expect(game.settings.hitlerKnowsFasc).toEqual(false)
      expect(gameService.handleUpdate).toHaveBeenCalledWith(id, game)
      expect(gameService.handleUpdate).toHaveBeenCalledTimes(1)
    })

    it('resets the simple blind if game setting set to NOT BlIND', async () => {
      gameSettings.type = GameType.NORMAL
      game.settings.simpleBlind = true
      await gameService.setGameSettings(id, gameSettings)
      expect(game.settings.type).toEqual(GameType.NORMAL)
      expect(game.settings.simpleBlind).toEqual(false)
      expect(gameService.handleUpdate).toHaveBeenCalledWith(id, game)
      expect(gameService.handleUpdate).toHaveBeenCalledTimes(1)
    })

    it('throws if game settings are changed after game has started', async ()=>{
      game.status = Status.CHOOSE_CHAN
      await expect(gameService.setGameSettings(id, gameSettings)).rejects.toThrow('Cannot change the game settings after the game has started')
    })
  })

  describe("findById", ()=> {
    it('catches error if game not found', async () => {
      await expect(gameService.findById('DNE_ID')).rejects.toThrow(`No game found with ID DNE_ID`)
    })

    it('returns the game if it exists', async () => {
      gameRepositoryMock.set(id, game)
      const theGame = await gameService.findById(id)
      expect(theGame.id).toBe(id)
    })
  })

  describe("Vote", ()=> {

    beforeEach(() => {
      jest.clearAllMocks()
      jest.spyOn(gameService, 'findById').mockImplementation(async () => game)
      jest.spyOn(gameService, 'handleUpdate')
      jest.spyOn(logicService, 'vote').mockImplementation(() => {})
      jest.spyOn(logicService, 'determineResultofVote').mockImplementation(() => {})

    })
    it('handles async calls', async () => {
      game.status = Status.VOTE_RESULT
      await gameService.vote(id, 'player-1', Vote.JA)
      expect(gameService.handleUpdate).toBeCalledTimes(1)
      expect(logicService.determineResultofVote).toBeCalledTimes(0)
      jest.advanceTimersByTime(2000)
      expect(gameService.handleUpdate).toBeCalledTimes(2)
      expect(logicService.determineResultofVote).toBeCalledTimes(1)
    })

    it('does not do async calls if not vote result status', async () => {
      game.status = Status.CHOOSE_CHAN
      await gameService.vote(id, 'player-1', Vote.JA)
      expect(gameService.handleUpdate).toBeCalledTimes(1)
      expect(logicService.determineResultofVote).toBeCalledTimes(0)
      jest.advanceTimersByTime(2000)
      expect(gameService.handleUpdate).toBeCalledTimes(1)
      expect(logicService.determineResultofVote).toBeCalledTimes(0)
    })
  })

  describe("defaultChanPlay", ()=> {

    beforeEach(() => {
      jest.resetAllMocks()
      jest.spyOn(gameService, 'vetoRequest').mockImplementation(async () => {})
      jest.spyOn(gameService, 'chanPlay').mockImplementation(async () => {})
    })

    it('calls request veto if defaultChanPlay is null', async () => {
      defaultActionService.defaultChanPlay = () => null
      await gameService.defaultChanPlay(id)
      expect(gameService.vetoRequest).toBeCalledTimes(1)
      expect(gameService.chanPlay).toBeCalledTimes(0)
    })

    it('calls chan play is defaultChanPlay is not null', async () => {
      defaultActionService.defaultChanPlay = () => Color.BLUE
      await gameService.defaultChanPlay(id)
      expect(gameService.chanPlay).toBeCalledTimes(1)
      expect(gameService.vetoRequest).toBeCalledTimes(0)
    })
  })
})
