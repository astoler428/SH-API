import { Test, TestingModule } from "@nestjs/testing";
import { LogicService } from "./logic.service";
import { Player } from "../models/player.model";
import { PlayerMockFactory } from "../test/PlayerMockFactory";
import { Game } from "../models/game.model";
import { GameMockFactory } from "../test/GameMockFactory";
import { Role, Status } from "../consts";

describe("Logic Service", () => {
  let logicService: LogicService
  let players: Player[]
  let game: Game

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
      const hitler: Player[] = game.players.filter(player => player.hitler)
      const omniFasc: Player[] = game.players.filter(player => player.omniFasc)
      const libs: Player[] = game.players.filter(player => player.role === Role.LIB)
      expect(hitler).toHaveLength(1)
      expect(omniFasc).toHaveLength(1)
      expect(libs).toHaveLength(3)
    })

  })
})