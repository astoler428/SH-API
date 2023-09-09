import { Test, TestingModule } from "@nestjs/testing";
import { LogicService } from "./logic.service";
import { Player } from "../models/player.model";
import { PlayerMockFactory } from "../test/PlayerMockFactory";
import { Game } from "../models/game.model";
import { GameMockFactory } from "../test/GameMockFactory";
import { GameSettings, GameType, Role, Status, Team } from "../consts";

describe("Logic Service", () => {
  let logicService: LogicService
  let players: Player[]
  let game: Game
  let gameSettings: GameSettings

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LogicService],
    }).compile();

    logicService = module.get<LogicService>(LogicService)
    players = []
    for(let i = 1; i <= 5; i++){
      players.push(new PlayerMockFactory().create(({name: `player-${i}`})))
    }
    game = new GameMockFactory().create({players})
    logicService.startGame(game)
  })

  describe('startGame', ()=>{

    it('sets game status', ()=>{
      expect(game.status).toEqual(Status.CHOOSE_CHAN)
    })
    it('assigns roles properly in 5 player', ()=>{
      for(const player of game.players){
        expect(player.role).toBeDefined()
      }
      const hitler: Player[] = game.players.filter(player => player.role === Role.HITLER)
      const omniFasc: Player[] = game.players.filter(player => player.omniFasc)
      const libs: Player[] = game.players.filter(player => player.team === Team.LIB)
      const fascs: Player[] = game.players.filter(player => player.team === Team.FASC)
      expect(hitler).toHaveLength(1)
      expect(omniFasc).toHaveLength(1)
      expect(libs).toHaveLength(3)
      expect(fascs).toHaveLength(2)
    })

    it('assigns roles properly in 6 player', ()=>{
      players = []
      for(let i = 1; i <= 6; i++){
        players.push(new PlayerMockFactory().create(({name: `player-${i}`})))
      }
      game = new GameMockFactory().create({players})
      logicService.startGame(game)
      for(const player of game.players){
        expect(player.role).toBeDefined()
      }
      const hitler: Player[] = game.players.filter(player => player.role === Role.HITLER)
      const omniFasc: Player[] = game.players.filter(player => player.omniFasc)
      const libs: Player[] = game.players.filter(player => player.team === Team.LIB)
      const fascs: Player[] = game.players.filter(player => player.team === Team.FASC)
      expect(hitler).toHaveLength(1)
      expect(omniFasc).toHaveLength(1)
      expect(libs).toHaveLength(4)
      expect(fascs).toHaveLength(2)
    })

    it('assigns roles properly in 7 player', ()=>{
      players = []
      for(let i = 1; i <= 7; i++){
        players.push(new PlayerMockFactory().create(({name: `player-${i}`})))
      }
      game = new GameMockFactory().create({players})
      logicService.startGame(game)
      for(const player of game.players){
        expect(player.role).toBeDefined()
      }
      const hitler: Player[] = game.players.filter(player => player.role === Role.HITLER)
      const omniFasc: Player[] = game.players.filter(player => player.omniFasc)
      const libs: Player[] = game.players.filter(player => player.team === Team.LIB)
      const fascs: Player[] = game.players.filter(player => player.team === Team.FASC)
      expect(hitler).toHaveLength(1)
      expect(omniFasc).toHaveLength(1)
      expect(libs).toHaveLength(4)
      expect(fascs).toHaveLength(3)

    })

    it('assigns roles properly in 8 player', ()=>{
      players = []
      for(let i = 1; i <= 8; i++){
        players.push(new PlayerMockFactory().create(({name: `player-${i}`})))
      }
      game = new GameMockFactory().create({players})
      logicService.startGame(game)
      for(const player of game.players){
        expect(player.role).toBeDefined()
      }
      const hitler: Player[] = game.players.filter(player => player.role === Role.HITLER)
      const omniFasc: Player[] = game.players.filter(player => player.omniFasc)
      const libs: Player[] = game.players.filter(player => player.team === Team.LIB)
      const fascs: Player[] = game.players.filter(player => player.team === Team.FASC)
      expect(hitler).toHaveLength(1)
      expect(omniFasc).toHaveLength(1)
      expect(libs).toHaveLength(5)
      expect(fascs).toHaveLength(3)
    })

    it('assigns roles properly in 9 player', ()=>{
      players = []
      for(let i = 1; i <= 9; i++){
        players.push(new PlayerMockFactory().create(({name: `player-${i}`})))
      }
      game = new GameMockFactory().create({players})
      logicService.startGame(game)
      for(const player of game.players){
        expect(player.role).toBeDefined()
      }
      const hitler: Player[] = game.players.filter(player => player.role === Role.HITLER)
      const omniFasc: Player[] = game.players.filter(player => player.omniFasc)
      const libs: Player[] = game.players.filter(player => player.team === Team.LIB)
      const fascs: Player[] = game.players.filter(player => player.team === Team.FASC)
      expect(hitler).toHaveLength(1)
      expect(omniFasc).toHaveLength(1)
      expect(libs).toHaveLength(5)
      expect(fascs).toHaveLength(4)
    })

    it('assigns roles properly in 10 player', ()=>{
      players = []
      for(let i = 1; i <= 10; i++){
        players.push(new PlayerMockFactory().create(({name: `player-${i}`})))
      }
      game = new GameMockFactory().create({players})
      logicService.startGame(game)
      for(const player of game.players){
        expect(player.role).toBeDefined()
      }
      const hitler: Player[] = game.players.filter(player => player.role === Role.HITLER)
      const omniFasc: Player[] = game.players.filter(player => player.omniFasc)
      const libs: Player[] = game.players.filter(player => player.team === Team.LIB)
      const fascs: Player[] = game.players.filter(player => player.team === Team.FASC)
      expect(hitler).toHaveLength(1)
      expect(omniFasc).toHaveLength(1)
      expect(libs).toHaveLength(6)
      expect(fascs).toHaveLength(4)
    })

    it('sets alive players', ()=>{
      expect(game.alivePlayers).toHaveLength(5)
    })

    it('sets current president', ()=>{
      expect(game.currentPres).toBeDefined()
    })

    it('does not assign lib spy in nonlibspy game', ()=>{
      gameSettings = {type: GameType.NORMAL, redDown: false, libSpy: false, hitlerKnowsFasc: false}
      game = new GameMockFactory().create({settings: gameSettings, players} )
      logicService.startGame(game)
      const libSpy = game.players.find(player => player.role === Role.LIB_SPY)
      expect(libSpy).not.toBeDefined()
    })
  })

  it('does does assign lib spy in libspy game', ()=>{
    gameSettings = {type: GameType.NORMAL, redDown: false, libSpy: true, hitlerKnowsFasc: false}
    game = new GameMockFactory().create({settings: gameSettings, players} )
    logicService.startGame(game)
    const libSpy = game.players.find(player => player.role === Role.LIB_SPY)
    expect(libSpy).toBeDefined()
  })
})