import { Test, TestingModule } from "@nestjs/testing";
import { CardMockFactory } from "../test/CardMockFactory";
import { DefaultActionService } from "./defaultAction.service";
import { LogicService } from "./logic.service";
import { Game } from "../models/game.model";
import { Player } from "../models/player.model";
import { PlayerMockFactory } from "../test/PlayerMockFactory";
import { GameMockFactory } from "../test/GameMockFactory";
import { GovMockFactory } from "../test/GovMockFactory";
import { Conf, PRES3, Role, Team } from "../consts";
import { Card } from "src/models/card.model";
import { ProbabilityService } from "./probability.service";



describe("DefaultActionService", () => {
  let defaultActionService: DefaultActionService
  let logicService: LogicService
  let players: Player[]
  let game: Game
  let id: string
  let player1: Player, player2: Player
  let R: Card
  let B: Card

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DefaultActionService, LogicService],
    }).compile()

    defaultActionService = module.get<DefaultActionService>(DefaultActionService)
    logicService = module.get<LogicService>(LogicService)

    players = []
    for(let i = 1; i <= 5; i++){
      players.push(new PlayerMockFactory().create(({name: `player-${i}`})))
    }
    game = new GameMockFactory().create({players})
    player1 = game.players.find(player => player.name === 'player-1')
    player2 = game.players.find(player => player.name === 'player-2')
    R = new CardMockFactory().createFasc()
    B = new CardMockFactory().createLib()
  })

  describe('determinePreCards', () => {

    it('correctly determines', () => {
      const R = new CardMockFactory().createFasc()
      const B = new CardMockFactory().createLib()
      const presCards = [[B, B, B], [R, B, B], [R, R, B], [R, R, R] ]
      const presDraws = ['BBB', 'RBB', 'RRB', 'RRR']
      for(let i = 0; i < 4; i ++){
        expect(defaultActionService.determine3Cards(presCards[i])).toBe(presDraws[i])
      }
    })
  })

  describe('determineChanCards', () => {

    it('correctly determines', () => {
      const R = new CardMockFactory().createFasc()
      const B = new CardMockFactory().createLib()
      const chanCards = [[B, B], [R, B], [R, R] ]
      const chanDraws = ['BB', 'RB', 'RR']
      for(let i = 0; i < 3; i ++){
        expect(defaultActionService.determine2Cards(chanCards[i])).toBe(chanDraws[i])
      }
    })
  })

  describe('lib3Red', () => {

    it('properly determines that a lib pres drew 3 red on this deck', () => {
      player1.team = Team.LIB
      game.govs.push(new GovMockFactory().create())
      expect(defaultActionService.lib3RedOnThisDeck(game)).toBe(true)
    })

    it('properly determines that a lib pres drew 3 red on a different deck', () => {
      player1.team = Team.LIB
      game.govs.push(new GovMockFactory().create())
      game.deck.deckNum = 2
      expect(defaultActionService.lib3RedOnThisDeck(game)).toBe(false)
    })

    it('returns false if a fasc pres draws RRR', () => {
      player1.team = Team.FASC
      game.govs.push(new GovMockFactory().create())
      expect(defaultActionService.lib3RedOnThisDeck(game)).toBe(false)
    })
  })


  describe('is3Red', () => {

    it('properly determines that the player claimed 3 red regardless of the cards', () => {
      player1.team = Team.FASC
      game.govs.push(new GovMockFactory().create({presCards: [R, B, B]}))
      expect(defaultActionService.is3Red(game, 'player-1')).toBe(true)
    })

    it('properly determines not 3 red if overclaim', () => {
      player1.team = Team.FASC
      game.govs.push(new GovMockFactory().create({presClaim: PRES3.RRB}))
      expect(defaultActionService.is3Red(game, 'player-1')).toBe(false)
    })
  })

  describe('isAntiDD', () => {

    it('properly determines that the gov is an antiDD', () => {
      player1.team = Team.FASC
      game.confs.push({
        confer: 'player-1',
        confee: 'player-2',
        type: Conf.INV
      },
      {
        confer: 'player-1',
        confee: 'player-3',
        type: Conf.POLICY
      })
      game.currentChan = 'player-2'
      game.currentPres = 'player-3'
      expect(defaultActionService.isAntiDD(game)).toBe(true)
      game.currentChan = 'player-2'
      game.currentPres = 'player-1'
      expect(defaultActionService.isAntiDD(game)).toBe(false)
    })
  })

  describe('underClaimTotal', () => {

    it('properly counts the total underclaims', ()=> {
      game.govs.push(new GovMockFactory().create({underclaim: 2}))
      game.govs.push(new GovMockFactory().create({underclaim: 3}))
      game.govs.push(new GovMockFactory().create({deckNum: 2, underclaim: 3}))
      game.govs.push(new GovMockFactory().create({deckNum: 2, underclaim: -4}))
      expect(defaultActionService.underclaimTotal(game)).toEqual(5)
      game.deck.deckNum = 2
      expect(defaultActionService.underclaimTotal(game)).toEqual(-1)
    })
  })

  describe('isCucu', () => {

    it('properly determines Cucu', ()=> {
      game.invClaims.push({
        investigator: 'player-1',
        investigatee: 'player-2',
        claim: Team.LIB
      })
      game.invClaims.push({
        investigator: 'player-1',
        investigatee: 'player-3',
        claim: Team.FASC
      })
      game.currentPres = 'player-2'
      game.currentChan = 'player-1'
      expect(defaultActionService.isCucu(game)).toBe(true)

      game.currentPres = 'player-1'
      game.currentChan = 'player-2'
      expect(defaultActionService.isCucu(game)).toBe(false)

      game.currentPres = 'player-3'
      game.currentChan = 'player-1'
      expect(defaultActionService.isCucu(game)).toBe(false)

      game.currentPres = 'player-3'
      game.currentChan = 'player-4'
      expect(defaultActionService.isCucu(game)).toBe(false)
    })
  })


  describe('isCucu', () => {

    it('properly determines Cucu', ()=> {
      game.confs.push({
        confer: 'player-1',
        confee: 'player-2',
        type: Conf.POLICY
      })
      game.confs.push({
        confer: 'player-1',
        confee: 'player-3',
        type: Conf.INV
      })
      game.confs.push({
        confer: 'player-2',
        confee: 'player-4',
        type: Conf.INV
      })
      game.currentPres = 'player-2'
      game.currentChan = 'player-3'
      expect(defaultActionService.isAntiDD(game)).toBe(true)
      game.currentPres = 'player-3'
      game.currentChan = 'player-2'
      expect(defaultActionService.isAntiDD(game)).toBe(true)
      game.currentPres = 'player-4'
      game.currentChan = 'player-3'
      expect(defaultActionService.isAntiDD(game)).toBe(false)
    })
  })


  describe('isPower', () => {

    it('properly determines if there is a power in 5-6 player games', ()=> {
      game.FascPoliciesEnacted = 0
      expect(defaultActionService.isPower(game)).toBe(false)
      game.FascPoliciesEnacted = 1
      game.players.push(new PlayerMockFactory().create())
      expect(defaultActionService.isPower(game)).toBe(false)
      game.FascPoliciesEnacted = 2
      expect(defaultActionService.isPower(game)).toBe(true)
      game.FascPoliciesEnacted = 4
      expect(defaultActionService.isPower(game)).toBe(true)
    })

    it('properly determines if there is a power in 7-8 player games', ()=> {
      for(let i = 6; i < 8; i++){
        game.players.push(new PlayerMockFactory().create({name: `player-${i}`}))
      }
      game.FascPoliciesEnacted = 0
      expect(defaultActionService.isPower(game)).toBe(false)
      game.FascPoliciesEnacted = 1
      expect(defaultActionService.isPower(game)).toBe(true)
      game.players.push(new PlayerMockFactory().create({name: `player-8`}))
      game.FascPoliciesEnacted = 0
      expect(defaultActionService.isPower(game)).toBe(false)
      game.FascPoliciesEnacted = 4
      expect(defaultActionService.isPower(game)).toBe(true)
    })

    it('properly determines if there is a power in 9-10 player games', ()=> {
      for(let i = 6; i < 10; i++){
        game.players.push(new PlayerMockFactory().create({name: `player-${i}`}))
      }
      game.FascPoliciesEnacted = 0
      expect(defaultActionService.isPower(game)).toBe(true)
      game.FascPoliciesEnacted = 1
      expect(defaultActionService.isPower(game)).toBe(true)
      game.players.push(new PlayerMockFactory().create({name: `player-10`}))
      game.FascPoliciesEnacted = 0
      expect(defaultActionService.isPower(game)).toBe(true)
      game.FascPoliciesEnacted = 4
      expect(defaultActionService.isPower(game)).toBe(true)
    })
  })

  describe('invPower', () => {

    it('properly determines if there is a invpower in 5-6 player games', ()=> {
      game.FascPoliciesEnacted = 0
      expect(defaultActionService.invPower(game)).toBe(false)
      game.FascPoliciesEnacted = 1
      expect(defaultActionService.invPower(game)).toBe(false)
      game.FascPoliciesEnacted = 2
      expect(defaultActionService.invPower(game)).toBe(false)
      game.FascPoliciesEnacted = 3
      expect(defaultActionService.invPower(game)).toBe(false)
    })

    it('properly determines if there is a power in 7-8 player games', ()=> {
      for(let i = 6; i < 8; i++){
        game.players.push(new PlayerMockFactory().create({name: `player-${i}`}))
      }
      game.FascPoliciesEnacted = 0
      expect(defaultActionService.invPower(game)).toBe(false)
      game.FascPoliciesEnacted = 1
      expect(defaultActionService.invPower(game)).toBe(true)
      game.FascPoliciesEnacted = 2
      expect(defaultActionService.invPower(game)).toBe(false)
      game.FascPoliciesEnacted = 3
      expect(defaultActionService.invPower(game)).toBe(false)
    })

    it('properly determines if there is a power in 9-10 player games', ()=> {
      for(let i = 6; i < 10; i++){
        game.players.push(new PlayerMockFactory().create({name: `player-${i}`}))
      }
      game.FascPoliciesEnacted = 0
      expect(defaultActionService.invPower(game)).toBe(true)
      game.FascPoliciesEnacted = 1
      expect(defaultActionService.invPower(game)).toBe(true)
      game.FascPoliciesEnacted = 2
      expect(defaultActionService.invPower(game)).toBe(false)
      game.FascPoliciesEnacted = 3
      expect(defaultActionService.invPower(game)).toBe(false)
    })
  })

  describe('gunPower', () => {

    it('properly determines if there is a gunPower', ()=> {
      game.FascPoliciesEnacted = 0
      expect(defaultActionService.gunPower(game)).toBe(false)
      game.FascPoliciesEnacted = 1
      expect(defaultActionService.gunPower(game)).toBe(false)
      game.FascPoliciesEnacted = 2
      expect(defaultActionService.gunPower(game)).toBe(false)
      game.FascPoliciesEnacted = 3
      expect(defaultActionService.gunPower(game)).toBe(true)
      game.FascPoliciesEnacted = 4
      expect(defaultActionService.gunPower(game)).toBe(true)
      game.FascPoliciesEnacted = 5
      expect(defaultActionService.gunPower(game)).toBe(false)
    })
  })

  describe('doubleDipping', () => {

    it('properly determines if the pres is doubledipping', ()=> {
      game.confs.push({
        confer: 'player-1',
        confee: 'player-2',
        type: Conf.POLICY
      })
      game.currentPres = 'player-1'
      game.currentChan = 'player-2'
      expect(defaultActionService.doubleDipping(game)).toBe(true)
    })

    it('properly determines if the pres is not doubledipping', ()=> {
      game.confs.push({
        confer: 'player-3',
        confee: 'player-4',
        type: Conf.INV
      })
      game.currentPres = 'player-3'
      game.currentChan = 'player-4'
      expect(defaultActionService.doubleDipping(game)).toBe(false)
      game.confs.push({
        confer: 'player-1',
        confee: 'player-2',
        type: Conf.POLICY
      })
      game.currentPres = 'player-2'
      game.currentChan = 'player-1'
      expect(defaultActionService.doubleDipping(game)).toBe(false)

    })
  })



describe('defaultInspect3Claim', () => {
  let cards3: Card[]
  let underclaim: number
  let testProb: number
  beforeEach(() => {
    jest.spyOn(logicService, 'inspect3').mockImplementation(() => cards3)
    jest.spyOn(defaultActionService, 'underclaimTotal').mockImplementation(() => underclaim)
    // jest.spyOn(defaultActionService, 'testProb').mockImplementation(() => )
    Math.random = () => testProb
    player1.team = Team.FASC
    player2.team = Team.LIB
    cards3 = [R, R, B]
  })

  it('overclaims RRB for fasc pres on underclaimedDeck', ()=> {
    game.currentPres = 'player-1'
    underclaim = 1
    testProb = .69
    const claim = defaultActionService.defaultInspect3Claim(game)
    expect(claim).toBe(PRES3.RBB)
  })

  it('does not overclaim RRB if prob is too high for fasc pres on underclaimedDeck', ()=> {
    game.currentPres = 'player-1'
    underclaim = 1
    testProb = .71
    const claim = defaultActionService.defaultInspect3Claim(game)
    expect(claim).toBe(PRES3.RRB)
  })


  it('does not overclaim RRB if underclaim is too low', ()=> {
    game.currentPres = 'player-1'
    underclaim = 0
    testProb = .69
    const claim = defaultActionService.defaultInspect3Claim(game)
    expect(claim).toBe(PRES3.RRB)
  })

  it('overclaims RRR', ()=> {
    game.currentPres = 'player-1'
    underclaim = 2
    cards3 = [R, R, R]
    testProb = .69
    const claim = defaultActionService.defaultInspect3Claim(game)
    expect(claim).toBe(PRES3.RBB)
  })

  it('does not overclaim RRR if underclaim is too low', ()=> {
    game.currentPres = 'player-1'
    underclaim = 1
    cards3 = [R, R, R]
    testProb = .69
    const claim = defaultActionService.defaultInspect3Claim(game)
    expect(claim).toBe(PRES3.RRR)
  })

  it('does not overclaim RRR if prob is too high', ()=> {
    game.currentPres = 'player-1'
    underclaim = 2
    cards3 = [R, R, R]
    testProb = .71
    const claim = defaultActionService.defaultInspect3Claim(game)
    expect(claim).toBe(PRES3.RRR)
  })

  it('does not overclaim for lib pres on underclaimedDeck', ()=> {
    game.currentPres = 'player-2'
    underclaim = 2
    testProb = .69
    const claim = defaultActionService.defaultInspect3Claim(game)
    expect(claim).toBe(PRES3.RRB)
  })

  it('underclaims BBB', ()=> {
    cards3 = [B, B, B]
    game.currentPres = 'player-1'
    underclaim = 1
    const claim = defaultActionService.defaultInspect3Claim(game)
    expect(claim).toBe(PRES3.RBB)
  })

  it('does not underclaim BBB as a lib', ()=> {
    cards3 = [B, B, B]
    game.currentPres = 'player-2'
    underclaim = 1
    const claim = defaultActionService.defaultInspect3Claim(game)
    expect(claim).toBe(PRES3.BBB)
  })
})

describe('testProb', () => {

  it('returns true when value is less', ()=> {
    Math.random = () => .7
    expect(defaultActionService.testProb(.71)).toBe(true)
  })

  it('returns true when value is less', ()=> {
    Math.random = () => .7
    expect(defaultActionService.testProb(.69)).toBe(false)
  })
})

})


  /**
  BBoverClaimInspect3Action() {
    const BBoverclaimInspect3Prob = .7
    return this.testProb(BBoverclaimInspect3Prob)
  }


  testProb(threshold: number){
    const randomProb = Math.random()
    return randomProb < threshold
  }
   */







