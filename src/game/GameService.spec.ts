import { Test, TestingModule } from "@nestjs/testing";
import { GameService } from "./game.service"
import { EventEmitter2 } from "@nestjs/event-emitter";
import { GameMockFactory } from "../test/GameMockFactory";
import { PlayerMockFactory } from "../test/PlayerMockFactory";
import { GameType, Status } from "../consts";
import { Game } from "../models/game.model";
import { JOIN_GAME, LEAVE_GAME, START_GAME, UPDATE_GAME } from "../consts/socketEventNames";
import { LogicService } from "./logic.service";


describe("GameService", () => {
  let gameService: GameService
  let eventEmitter: EventEmitter2
  let id: string
  let game: Game

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService, EventEmitter2, LogicService],
    }).compile();

    gameService = module.get<GameService>(GameService)
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

  })

  beforeEach(async () => {
    id = await gameService.createGame("player-1", '1')
    gameService.joinGame(id, "player-2", "2")
    gameService.joinGame(id, "player-3", "3")
    gameService.joinGame(id, "player-4", "4")
    gameService.joinGame(id, "player-5", "5")
    gameService.joinGame(id, "player-6", "6")
    gameService.joinGame(id, "player-7", "7")
    gameService.joinGame(id, "player-8", "8")
    gameService.joinGame(id, "player-9", "9")
    gameService.joinGame(id, "player-10", "10")
    game = gameService.findById(id)
  });

  describe("createGame", ()=> {
    it('creates a new game', async () => {
      jest.spyOn(gameService, "joinGame").mockImplementation(() => new GameMockFactory().create());
      gameService.createGame('player', '1')

      expect(gameService.gameDatabase).toHaveLength(2)
      expect(gameService.joinGame).toBeCalled()
    })
  })

  describe("joinGame", ()=> {
    it('throws if no name', async () => {
      expect(() => gameService.joinGame(id, undefined, undefined )).toThrow(`Player must have a name`)
    })

    it('throws if no game id found', async () => {
      expect(() => gameService.joinGame('ABCD', 'player', '1' )).toThrow(`No game found with id ABCD`)
    })

    it('throws if game at capacity', async () => {
      expect(() => gameService.joinGame(id, 'player-11', '11' )).toThrow(`up to 10 players per game.`)
    })

    it('throws when repeated name tries to join', ()=> {
      expect(() => gameService.joinGame(id, 'player-2', '20')).toThrow(`A player with that name is already in the game. Choose a different name.`)
    })

    it('throws when new player joins a game in progress', ()=> {
      const game = new GameMockFactory().create({status: Status.CHOOSE_CHAN});
      gameService.gameDatabase.push(game)
      expect(() => gameService.joinGame(game.id, 'player-2', '20')).toThrow(`Cannot join a game that has already started.`)
    })

    it('allows player to rejoin a game in progress', ()=> {
      const player = new PlayerMockFactory().create({socketId: undefined})
      const game = new GameMockFactory().create({status: Status.CHOOSE_CHAN});
      gameService.gameDatabase.push(game)
      game.players.push(player)
      expect(() => gameService.joinGame(game.id, player.name, '20')).not.toThrow()
      expect(player.socketId).toEqual('20')
    })

    it('adds new player to the game', async () => {
      const id = await gameService.createGame('player', '1')
      gameService.joinGame(id, 'player-2', '2')
      const game = await gameService.findById(id)

      expect(game.players).toHaveLength(2)
      expect(game.players[1].name).toEqual('player-2')
    })

    it('emits the proper messages', async () => {
      jest.spyOn(eventEmitter, 'emit')
      const id = await gameService.createGame('player', '1')
      gameService.joinGame(id, 'player-2', '2')
      const game = gameService.findById(id)
      expect(eventEmitter.emit).toHaveBeenCalledWith(UPDATE_GAME, game)
      expect(eventEmitter.emit).toHaveBeenCalledWith(JOIN_GAME, {socketId: '2', id})
    })
  })



  describe("leaveGame", ()=> {
    beforeEach(async () => {
      gameService.leaveGame(id, "1")
    });

    it('throws when player leaving not found', async () => {
      expect(() => gameService.leaveGame(id, '20')).toThrow(`This player not found in game ${id}`)
    })

    it('removes a player when game has not started', async () => {
      const player1 = game.players.find(player => player.name === 'player-1')
      expect(player1).toBeUndefined()
    })

    it('deletes a game when no players are in it', async () => {
      jest.spyOn(gameService, "deleteGame")
      expect(gameService.deleteGame).not.toBeCalled()
      for(const player of game.players){
        gameService.leaveGame(id, player.socketId)
      }
      expect(gameService.deleteGame).toBeCalled()
    })

    it('removes socket id but does not delete player when game in progress', async () => {
      game.status = Status.CHOOSE_CHAN
      gameService.leaveGame(id, "2")
      const player2 = game.players.find(player => player.name === 'player-2')
      expect(player2.socketId).toBeNull()
      expect(player2).not.toBeUndefined()
    })


    it('deletes a game when no players are in it', async () => {
      jest.spyOn(eventEmitter, "emit")
      gameService.leaveGame(id, '2')
      expect(eventEmitter.emit).toBeCalledWith(LEAVE_GAME, '2')
      expect(eventEmitter.emit).toBeCalledWith(UPDATE_GAME, game)
    })
  })


  describe("startGame", ()=> {
    it('throws if not enough players', ()=>{
      const game = new GameMockFactory().create()
      gameService.gameDatabase.push(game)
      expect(() => gameService.startGame(game.id)).toThrow(`Can't start a game with fewer than 5 players`)
    })
    it('starts a game', async () => {
      expect(() => gameService.startGame('ABCD')).toThrow(`No game found with id ABCD`)
      jest.spyOn(eventEmitter, 'emit')
      gameService.startGame(id)
      expect(game.status).toBe(Status.CHOOSE_CHAN)
      expect(eventEmitter.emit).toHaveBeenCalledWith(UPDATE_GAME, game)
      expect(() => gameService.startGame(id)).toThrow(`Game ${id} has already started`)
    })
  })


  describe("deleteGame", ()=> {
    it('deletes a game', async () => {
      gameService.deleteGame(id)
      expect(gameService.gameDatabase).toHaveLength(0)
    })
  })

  describe("setGameType", ()=> {
    it('changes the game type', async () => {
      jest.spyOn(eventEmitter, 'emit')
      gameService.setGameType(id, GameType.NORMAL)
      expect(game.gameType).toEqual(GameType.NORMAL)
      expect(eventEmitter.emit).toHaveBeenCalledWith(UPDATE_GAME, game)
    })

    it('throws if gametype is changed after game has started', ()=>{
      game.status = Status.CHOOSE_CHAN
      expect(()=> gameService.setGameType(id, GameType.NORMAL)).toThrow('Cannot change the game type after the game has started')

    })
  })

  describe("findById", ()=> {
    it('throws if game not found', async () => {
      expect(() => gameService.findById('ABCD')).toThrow(`No game found with id ABCD`)
      const game = gameService.findById(id)
      expect(game.id).not.toBeNull()
    })
  })

  describe("chooseChan", ()=>{
    let mockGame: Game
    beforeEach(()=> {
      mockGame = new GameMockFactory().create({status: Status.CHOOSE_CHAN})
      mockGame.players.push(new PlayerMockFactory().create({name: 'current-pres'}))
      mockGame.players.push(new PlayerMockFactory().create({name: 'chan-pick'}))
      mockGame.alivePlayers = mockGame.players
      mockGame.currentPres = mockGame.players[0]
      gameService.gameDatabase.push(mockGame)
      gameService.chooseChan(mockGame.id, 'chan-pick')
    })

    it('sets the current chan', ()=>{
      expect(mockGame.currentChan).toBeDefined()
      expect(mockGame.currentChan.name).toEqual('chan-pick')
    })

    it('sets game status to vote', ()=> {
      expect(mockGame.status).toEqual(Status.VOTE)
    })
  })
})