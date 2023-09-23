import { Test, TestingModule } from "@nestjs/testing";
import { CardMockFactory } from "../test/CardMockFactory";
import { DefaultActionService } from "./defaultAction.service";
import { LogicService } from "./logic.service";
import { Game } from "../models/game.model";
import { Player } from "../models/player.model";
import { PlayerMockFactory } from "../test/PlayerMockFactory";
import { GameMockFactory } from "../test/GameMockFactory";
import { GovMockFactory } from "../test/GovMockFactory";
import { CHAN2, Color, Conf, GameType, PRES3, Role, Status, Team } from "../consts";
import { Card } from "src/models/card.model";
import { ProbabilityService } from "./probability.service";



describe("DefaultActionService", () => {
  let defaultActionService: DefaultActionService
  let logicService: LogicService
  let players: Player[]
  let game: Game
  let id: string
  let player1: Player, player2: Player, player3: Player
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
    player1.role = Role.LIB
    player1.team = Team.LIB
    player2 = game.players.find(player => player.name === 'player-2')
    player2.role = Role.FASC
    player2.team = Team.FASC
    player3 = game.players.find(player => player.name === 'player-3')
    player3.role = Role.HITLER
    player3.team = Team.FASC
    game.currentPres = player1.name
    game.currentChan = player2.name
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


/**
 * default actions
 */

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
    testProb = .89
    const claim = defaultActionService.defaultInspect3Claim(game)
    expect(claim).toBe(PRES3.RBB)
  })

  it('does not overclaim RRB if prob is too high for fasc pres on underclaimedDeck', ()=> {
    game.currentPres = 'player-1'
    underclaim = 1
    testProb = .91
    const claim = defaultActionService.defaultInspect3Claim(game)
    expect(claim).toBe(PRES3.RRB)
  })


  it('does not overclaim RRB if underclaim is too low', ()=> {
    game.currentPres = 'player-1'
    underclaim = 0
    testProb = .89
    const claim = defaultActionService.defaultInspect3Claim(game)
    expect(claim).toBe(PRES3.RRB)
  })

  it('overclaims RRR', ()=> {
    game.currentPres = 'player-1'
    underclaim = 2
    cards3 = [R, R, R]
    testProb = .89
    const claim = defaultActionService.defaultInspect3Claim(game)
    expect(claim).toBe(PRES3.RBB)
  })

  it('does not overclaim RRR if underclaim is too low', ()=> {
    game.currentPres = 'player-1'
    underclaim = 1
    cards3 = [R, R, R]
    testProb = .89
    const claim = defaultActionService.defaultInspect3Claim(game)
    expect(claim).toBe(PRES3.RRR)
  })

  it('does not overclaim RRR if prob is too high', ()=> {
    game.currentPres = 'player-1'
    underclaim = 2
    cards3 = [R, R, R]
    testProb = .91
    const claim = defaultActionService.defaultInspect3Claim(game)
    expect(claim).toBe(PRES3.RRR)
  })

  it('does not overclaim for lib pres on underclaimedDeck', ()=> {
    game.currentPres = 'player-2'
    underclaim = 2
    testProb = .89
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

describe('defaultVetoReply', () => {

  it('accepts veto on RR as a lib', ()=> {
    game.currentPres = 'player-1'
    game.chanCards = [R, R]
    expect(defaultActionService.defaultVetoReply(game)).toBe(true)
  })

  it('rejects veto on RB or BB as a lib', ()=> {
    game.currentPres = 'player-1'
    game.chanCards = [R, B]
    expect(defaultActionService.defaultVetoReply(game)).toBe(false)
    game.chanCards = [B, B]
    expect(defaultActionService.defaultVetoReply(game)).toBe(false)
  })

  it('rejects veto on RR and RB as a fasc', ()=> {
    game.currentPres = 'player-2'
    game.chanCards = [R, R]
    expect(defaultActionService.defaultVetoReply(game)).toBe(false)
    game.chanCards = [R, B]
    expect(defaultActionService.defaultVetoReply(game)).toBe(false)
  })

  it('accepts veto on BB as a fasc', ()=> {
    game.currentPres = 'player-2'
    game.chanCards = [B, B]
    expect(defaultActionService.defaultVetoReply(game)).toBe(true)
  })

})



describe('defaultInvClaim', () => {

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(defaultActionService, 'testProb').mockImplementation(() => true)
  })

  it('tells the truth as a lib', ()=> {
    game.currentPres = 'player-1'
    player1.investigations.push('player-2')
    expect(logicService.getCurrentPres(game).team).toBe(Team.LIB)
    expect(defaultActionService.defaultInvClaim(game)).toBe(Team.FASC)
    player1.investigations.push('player-1')
    expect(defaultActionService.defaultInvClaim(game)).toBe(Team.LIB)
    player1.investigations.push('player-3')
    expect(defaultActionService.defaultInvClaim(game)).toBe(Team.FASC)
    expect(defaultActionService.testProb).toBeCalledTimes(0)
  })

  it('lies based on test prob as a fasc', ()=> {
    game.currentPres = 'player-3'
    player3.investigations.push('player-2')
    expect(logicService.getCurrentPres(game).team).toBe(Team.FASC)
    expect(defaultActionService.defaultInvClaim(game)).toBe(Team.LIB)
    player3.investigations.push('player-1')
    expect(defaultActionService.defaultInvClaim(game)).toBe(Team.FASC)
    player3.investigations.push('player-3')
    expect(defaultActionService.defaultInvClaim(game)).toBe(Team.LIB)
    expect(defaultActionService.testProb).toBeCalledTimes(3)
  })

  it('tells truth based on test prob as a fasc', ()=> {
    jest.spyOn(defaultActionService, 'testProb').mockImplementation(() => false)
    game.currentPres = 'player-3'
    player3.investigations.push('player-2')
    expect(logicService.getCurrentPres(game).team).toBe(Team.FASC)
    expect(defaultActionService.defaultInvClaim(game)).toBe(Team.FASC)
    player3.investigations.push('player-1')
    expect(defaultActionService.defaultInvClaim(game)).toBe(Team.LIB)
    player3.investigations.push('player-3')
    expect(defaultActionService.defaultInvClaim(game)).toBe(Team.FASC)
    expect(defaultActionService.testProb).toBeCalledTimes(3)
  })
})

describe('defaultPresDiscard', () => {

  beforeEach( () => {
    jest.spyOn(defaultActionService, 'testProb').mockImplementation((prob) => .5 < prob )
    jest.spyOn(defaultActionService, 'getPresDropProbs')
    jest.spyOn(defaultActionService, 'getSimplePresDropProbs')
  })

  it('discards red whenever possible for a lib', ()=> {
    game.currentPres = player1.name
    expect(logicService.getCurrentPres(game).role).toBe(Role.LIB)
    game.presCards = [B, B, B]
    expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.BLUE)
    game.presCards = [R, B, B]
    expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.RED)
    game.presCards = [R, R, B]
    expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.RED)
    game.presCards = [R, R, R]
    expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.RED)
    expect(defaultActionService.getPresDropProbs).toBeCalledTimes(0)
    expect(defaultActionService.getSimplePresDropProbs).toBeCalledTimes(0)
  })

  it('discards blue when passing test prob for a fasc', ()=> {
    jest.spyOn(defaultActionService, 'getPresDropProbs').mockImplementation(() => [1, 1])
    game.currentPres = player2.name
    expect(logicService.getCurrentPres(game).role).toBe(Role.FASC)
    game.presCards = [B, B, B]
    expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.BLUE)
    game.presCards = [R, B, B]
    expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.BLUE)
    game.presCards = [R, R, B]
    expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.BLUE)
    game.presCards = [R, R, R]
    expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.RED)
    expect(defaultActionService.getPresDropProbs).toBeCalledTimes(4)
    expect(defaultActionService.getSimplePresDropProbs).toBeCalledTimes(0)
   })

   it('discards blue when passing test prob for hitler', ()=> {
    jest.spyOn(defaultActionService, 'getPresDropProbs').mockImplementation(() => [1, 1])
    game.currentPres = player3.name
    expect(logicService.getCurrentPres(game).role).toBe(Role.HITLER)
    game.presCards = [B, B, B]
    expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.BLUE)
    game.presCards = [R, B, B]
    expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.BLUE)
    game.presCards = [R, R, B]
    expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.BLUE)
    game.presCards = [R, R, R]
    expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.RED)
   })

   it('discards red when failing test prob for a fasc', ()=> {
    jest.spyOn(defaultActionService, 'getPresDropProbs').mockImplementation(() => [0, 0])
    game.currentPres = player2.name
    expect(logicService.getCurrentPres(game).role).toBe(Role.FASC)
    game.presCards = [B, B, B]
    expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.BLUE)
    game.presCards = [R, B, B]
    expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.RED)
    game.presCards = [R, R, B]
    expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.RED)
    game.presCards = [R, R, R]
    expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.RED)
   })

   it('calls simple version when the game setting is simpleBlind', ()=> {
    game.settings.simpleBlind = true
    game.currentPres = player2.name
    game.presCards = [B, B, B]
    defaultActionService.defaultPresDiscard(game)
    expect(defaultActionService.getPresDropProbs).toBeCalledTimes(0)
    expect(defaultActionService.getSimplePresDropProbs).toBeCalledTimes(1)
   })
})

describe('defaultChanPlay', () => {

  beforeEach( () => {
    jest.spyOn(defaultActionService, 'testProb').mockImplementation((prob) => .5 < prob )
    jest.spyOn(defaultActionService, 'getSimpleChanDropProbs')
    jest.spyOn(defaultActionService, 'getChanDropProbs')
  })

  it('plays blue whenever possible for a lib', ()=> {
    game.currentChan = player1.name
    expect(logicService.getCurrentChan(game).role).toBe(Role.LIB)
    game.chanCards = [B, B]
    expect(defaultActionService.defaultChanPlay(game)).toBe(Color.BLUE)
    game.chanCards = [R, B]
    expect(defaultActionService.defaultChanPlay(game)).toBe(Color.BLUE)
    game.chanCards = [R, R]
    expect(defaultActionService.defaultChanPlay(game)).toBe(Color.RED)
  })

  it('plays red when passing testProb for a fasc', ()=> {
    jest.spyOn(defaultActionService, 'getChanDropProbs').mockImplementation(() => 1)
    game.currentChan = player2.name
    expect(logicService.getCurrentChan(game).role).toBe(Role.FASC)
    game.chanCards = [B, B]
    expect(defaultActionService.defaultChanPlay(game)).toBe(Color.BLUE)
    game.chanCards = [R, B]
    expect(defaultActionService.defaultChanPlay(game)).toBe(Color.RED)
    game.chanCards = [R, R]
    expect(defaultActionService.defaultChanPlay(game)).toBe(Color.RED)
  })

  it('plays red when passing testProb for hitler', ()=> {
    jest.spyOn(defaultActionService, 'getChanDropProbs').mockImplementation(() => 1)
    game.currentChan = player3.name
    expect(logicService.getCurrentChan(game).role).toBe(Role.HITLER)
    game.chanCards = [B, B]
    expect(defaultActionService.defaultChanPlay(game)).toBe(Color.BLUE)
    game.chanCards = [R, B]
    expect(defaultActionService.defaultChanPlay(game)).toBe(Color.RED)
    game.chanCards = [R, R]
    expect(defaultActionService.defaultChanPlay(game)).toBe(Color.RED)
  })

  it('plays blue when failing testProb for a fasc', ()=> {
    jest.spyOn(defaultActionService, 'getChanDropProbs').mockImplementation(() => 0)
    game.currentChan = player2.name
    expect(logicService.getCurrentChan(game).role).toBe(Role.FASC)
    game.chanCards = [B, B]
    expect(defaultActionService.defaultChanPlay(game)).toBe(Color.BLUE)
    game.chanCards = [R, B]
    expect(defaultActionService.defaultChanPlay(game)).toBe(Color.BLUE)
    game.chanCards = [R, R]
    expect(defaultActionService.defaultChanPlay(game)).toBe(Color.RED)
  })

  it('does not request veto for a lib on RR if not in veto zone', ()=> {
    jest.spyOn(defaultActionService, 'getChanDropProbs').mockImplementation(() => 0)
    game.currentChan = player1.name
    expect(logicService.getCurrentChan(game).role).toBe(Role.LIB)
    game.chanCards = [R, R]
    expect(defaultActionService.defaultChanPlay(game)).not.toBeNull()
  })

  it('does not request veto for a lib on RR in veto zone but veto already declined', ()=> {
    jest.spyOn(defaultActionService, 'getChanDropProbs').mockImplementation(() => 0)
    game.FascPoliciesEnacted = 5
    game.status = Status.VETO_DECLINED
    game.currentChan = player1.name
    expect(logicService.getCurrentChan(game).role).toBe(Role.LIB)
    game.chanCards = [R, R]
    expect(defaultActionService.defaultChanPlay(game)).not.toBeNull()
  })

  it('does request veto for a lib on RR in veto zone', ()=> {
    jest.spyOn(defaultActionService, 'getChanDropProbs').mockImplementation(() => 0)
    game.FascPoliciesEnacted = 5
    game.status = Status.CHAN_PLAY
    game.currentChan = player1.name
    expect(logicService.getCurrentChan(game).role).toBe(Role.LIB)
    game.chanCards = [R, R]
    expect(defaultActionService.defaultChanPlay(game)).toBeNull()
  })

  it('does not request veto for a lib on RB or BB in veto zone', ()=> {
    jest.spyOn(defaultActionService, 'getChanDropProbs').mockImplementation(() => 0)
    game.FascPoliciesEnacted = 5
    game.status = Status.CHAN_PLAY
    game.currentChan = player1.name
    expect(logicService.getCurrentChan(game).role).toBe(Role.LIB)
    game.chanCards = [R, B]
    expect(defaultActionService.defaultChanPlay(game)).not.toBeNull()
    game.chanCards = [B, B]
    expect(defaultActionService.defaultChanPlay(game)).not.toBeNull()
  })

  it('does not request veto for a fasc on BB with fasc if not in veto zone', ()=> {
    jest.spyOn(defaultActionService, 'getChanDropProbs').mockImplementation(() => 0)
    game.currentChan = player2.name
    game.currentPres = player3.name
    game.status = Status.CHOOSE_CHAN
    expect(logicService.getCurrentChan(game).team).toBe(Team.FASC)
    expect(logicService.getCurrentPres(game).team).toBe(Team.FASC)
    game.chanCards = [B, B]
    expect(defaultActionService.defaultChanPlay(game)).not.toBeNull()
  })

  it('does request veto for a fasc on BB with fasc if  in veto zone', ()=> {
    jest.spyOn(defaultActionService, 'getChanDropProbs').mockImplementation(() => 0)
    game.currentChan = player2.name
    game.currentPres = player3.name
    game.status = Status.CHOOSE_CHAN
    game.FascPoliciesEnacted = 5
    expect(logicService.getCurrentChan(game).team).toBe(Team.FASC)
    expect(logicService.getCurrentPres(game).team).toBe(Team.FASC)
    game.chanCards = [B, B]
    expect(defaultActionService.defaultChanPlay(game)).toBeNull()
  })

  it('does not request veto for a fasc on BB in veto zone if veto already declined', ()=> {
    game.FascPoliciesEnacted = 5
    game.status = Status.VETO_DECLINED
    jest.spyOn(defaultActionService, 'getChanDropProbs').mockImplementation(() => 0)
    game.currentChan = player2.name
    game.currentPres = player3.name
    expect(logicService.getCurrentChan(game).team).toBe(Team.FASC)
    expect(logicService.getCurrentPres(game).team).toBe(Team.FASC)
    game.chanCards = [B, B]
    expect(defaultActionService.defaultChanPlay(game)).not.toBeNull()
  })

  it('does not request veto for a fasc on BB in veto zone if pres is lib', ()=> {
    game.FascPoliciesEnacted = 5
    game.status = Status.CHOOSE_CHAN
    jest.spyOn(defaultActionService, 'getChanDropProbs').mockImplementation(() => 0)
    game.currentChan = player2.name
    game.currentPres = player1.name
    expect(logicService.getCurrentChan(game).team).toBe(Team.FASC)
    expect(logicService.getCurrentPres(game).team).toBe(Team.LIB)
    game.chanCards = [B, B]
    expect(defaultActionService.defaultChanPlay(game)).not.toBeNull()
  })

  it('calls simple version when the game setting is simpleBlind', ()=> {
    game.settings.simpleBlind = true
    game.currentChan = player2.name
    game.chanCards = [B, B]
    defaultActionService.defaultChanPlay(game)
    expect(defaultActionService.getSimpleChanDropProbs).toBeCalledTimes(1)
    expect(defaultActionService.getChanDropProbs).toBeCalledTimes(0)
   })
})


describe('defaultChanClaim', () => {

  beforeEach( () => {
    jest.spyOn(defaultActionService, 'getFascFascBlueChanClaim').mockImplementation(() => CHAN2.BB)
    jest.spyOn(defaultActionService, 'getSimpleFascFascBlueChanClaim').mockImplementation(() => CHAN2.BB)
  })

  it('tells the truth when lib', ()=> {
    game.currentChan = player1.name
    expect(logicService.getCurrentChan(game).role).toBe(Role.LIB)
    game.chanCards = [B, B]
    expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.BB)
    game.chanCards = [R, B]
    expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.RB)
    game.chanCards = [R, R]
    expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.RR)
    expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(0)
    expect(defaultActionService.getSimpleFascFascBlueChanClaim).toBeCalledTimes(0)
  })

  it('fasc claim RR if a red is played', ()=> {
    game.currentChan = player2.name
    game.currentPres = player3.name
    game.chanPlay = R
    expect(logicService.getCurrentChan(game).team).toBe(Team.FASC)
    expect(logicService.getCurrentChan(game).team).toBe(Team.FASC)
    game.chanCards = [R, B]
    expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.RR)
    game.chanCards = [R, R]
    expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.RR)
    expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(0)
    expect(defaultActionService.getSimpleFascFascBlueChanClaim).toBeCalledTimes(0)
  })

  it('doesnt lie as a fasc if pres is lib', ()=> {
    game.currentChan = player2.name
    game.currentPres = player1.name
    game.chanPlay = B
    expect(logicService.getCurrentChan(game).team).toBe(Team.FASC)
    expect(logicService.getCurrentPres(game).team).toBe(Team.LIB)
    game.chanCards = [R, B]
    expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.RB)
    game.chanCards = [B, B]
    expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.BB)
    expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(0)
    expect(defaultActionService.getSimpleFascFascBlueChanClaim).toBeCalledTimes(0)
  })

  it('doesnt lie as a fasc if hitler is the chan regardless of who is pres', ()=> {
    game.currentChan = player3.name
    game.currentPres = player1.name
    game.chanPlay = B
    expect(logicService.getCurrentChan(game).role).toBe(Role.HITLER)
    expect(logicService.getCurrentPres(game).team).toBe(Team.LIB)
    game.chanCards = [R, B]
    expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.RB)
    game.chanCards = [B, B]
    expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.BB)
    //fasc pres
    game.currentPres = player2.name
    expect(logicService.getCurrentPres(game).team).toBe(Team.FASC)
    game.chanCards = [R, B]
    expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.RB)
    game.chanCards = [B, B]
    expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.BB)

    expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(0)
    expect(defaultActionService.getSimpleFascFascBlueChanClaim).toBeCalledTimes(0)
  })

  it('it calls getFascFascBlueChanClaim when fasc fasc to get claim', ()=> {
    game.currentChan = player2.name
    game.currentPres = player3.name
    game.chanPlay = B
    expect(logicService.getCurrentChan(game).role).toBe(Role.FASC)
    expect(logicService.getCurrentPres(game).team).toBe(Team.FASC)
    game.chanCards = [R, B]
    expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.BB) //mockImplementation
    game.chanCards = [B, B]
    expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.BB) //mockImplementation
   expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(2)
   expect(defaultActionService.getSimpleFascFascBlueChanClaim).toBeCalledTimes(0)
  })

  it('calls simple version when the game setting is simpleBlind', ()=> {
    game.settings.simpleBlind = true
    game.currentPres = player3.name
    game.currentChan = player2.name
    game.chanPlay = B
    game.chanCards = [B, B]
    defaultActionService.defaultChanClaim(game)
    expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(0)
    expect(defaultActionService.getSimpleFascFascBlueChanClaim).toBeCalledTimes(1)
   })
})


describe('defaultPresClaim', () => {

  beforeEach( () => {
    jest.resetAllMocks()
    jest.spyOn(defaultActionService, 'getPresClaimWithLibProbs').mockImplementation(() => [1, 1, 1, 1, 1])
    jest.spyOn(defaultActionService, 'getPresClaimWithFascProbs').mockImplementation(() => [1, 1])
  })

  describe('lib pres', () => {

    it('tells the truth as a lib', () => {
      game.currentPres = player1.name
      expect(logicService.getCurrentPres(game).role).toBe(Role.LIB)
      game.presCards = [B, B, B]
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.BBB)
      game.presCards = [R, B, B]
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RBB)
      game.presCards = [R, R, B]
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB)
      game.presCards = [R, R, R]
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRR)
      expect(defaultActionService.getPresClaimWithLibProbs).toBeCalledTimes(0)
      expect(defaultActionService.getPresClaimWithFascProbs).toBeCalledTimes(0)
    })
  })


  describe('fasc pres with lib chan', () => {

    it('claims different than what was passed when discarding a B if passes testprob', () => {
      game.currentPres = player2.name
      game.currentChan = player1.name
      game.presDiscard = B
      expect(logicService.getCurrentPres(game).role).toBe(Role.FASC)
      expect(logicService.getCurrentChan(game).role).toBe(Role.LIB)
      game.presCards = [R, R, B]
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB)
      game.presCards = [R, B, B]
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB)
      game.presCards = [B, B, B]
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RBB)
      expect(defaultActionService.getPresClaimWithLibProbs).toBeCalledTimes(3)
      expect(defaultActionService.getPresClaimWithFascProbs).toBeCalledTimes(0)
    })

    it('claims in line with what was passed when discarding a B if fails testprob', () => {
      jest.spyOn(defaultActionService, 'getPresClaimWithLibProbs').mockImplementation(() => [0,0,0,0,0])

      game.currentPres = player2.name
      game.currentChan = player1.name
      game.presDiscard = B
      expect(logicService.getCurrentPres(game).role).toBe(Role.FASC)
      expect(logicService.getCurrentChan(game).role).toBe(Role.LIB)
      game.presCards = [R, R, B]
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRR)
      game.presCards = [R, B, B]
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB)
      game.presCards = [B, B, B]
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.BBB)
      expect(defaultActionService.getPresClaimWithLibProbs).toBeCalledTimes(3)
      expect(defaultActionService.getPresClaimWithFascProbs).toBeCalledTimes(0)
    })

    it('claims different than what was passed when discarding a R if passes testprob', () => {
      game.currentPres = player2.name
      game.currentChan = player1.name
      game.presDiscard = R
      expect(logicService.getCurrentPres(game).role).toBe(Role.FASC)
      expect(logicService.getCurrentChan(game).role).toBe(Role.LIB)
      game.presCards = [R, R, R]
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB)
      game.presCards = [R, R, B]
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RBB)
      game.presCards = [R, B, B]
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.BBB)
      expect(defaultActionService.getPresClaimWithLibProbs).toBeCalledTimes(3)
      expect(defaultActionService.getPresClaimWithFascProbs).toBeCalledTimes(0)
    })

    it('claims in line with what was passed when discarding a R if fails testprob', () => {
      jest.spyOn(defaultActionService, 'getPresClaimWithLibProbs').mockImplementation(() => [0,0,0,0,0])
      game.currentPres = player2.name
      game.currentChan = player1.name
      game.presDiscard = R
      expect(logicService.getCurrentPres(game).role).toBe(Role.FASC)
      expect(logicService.getCurrentChan(game).role).toBe(Role.LIB)
      game.presCards = [R, R, R]
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRR)
      game.presCards = [R, R, B]
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB)
      game.presCards = [R, B, B]
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RBB)
      expect(defaultActionService.getPresClaimWithLibProbs).toBeCalledTimes(3)
      expect(defaultActionService.getPresClaimWithFascProbs).toBeCalledTimes(0)
    })
  })


  describe('fasc pres with fasc chan', () => {

    it('claims inline with chan and changes as appropriate when passing testprob', () => {
      game.currentPres = player3.name
      game.currentChan = player2.name
      game.presCards = [B, B, B]
      expect(logicService.getCurrentPres(game).team).toBe(Team.FASC)
      expect(logicService.getCurrentChan(game).team).toBe(Team.FASC)
      game.chanClaim = CHAN2.RR
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB)
      game.chanClaim = CHAN2.RB
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB)
      game.chanClaim = CHAN2.BB
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.BBB)
      expect(defaultActionService.getPresClaimWithLibProbs).toBeCalledTimes(0)
      expect(defaultActionService.getPresClaimWithFascProbs).toBeCalledTimes(3)
    })

    it('claims inline with chan and doesnt change when failing testprob', () => {
      jest.spyOn(defaultActionService, 'getPresClaimWithFascProbs').mockImplementation(() => [0,0])

      game.currentPres = player3.name
      game.currentChan = player2.name
      game.presCards = [B, B, B]
      expect(logicService.getCurrentPres(game).team).toBe(Team.FASC)
      expect(logicService.getCurrentChan(game).team).toBe(Team.FASC)
      game.chanClaim = CHAN2.RR
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRR)
      game.chanClaim = CHAN2.RB
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB)
      game.chanClaim = CHAN2.BB
      expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RBB)
      expect(defaultActionService.getPresClaimWithLibProbs).toBeCalledTimes(0)
      expect(defaultActionService.getPresClaimWithFascProbs).toBeCalledTimes(3)
    })
  })
})


describe('getFascLieOnInvProb', () => {

  let underclaimTotal: number
  let is3Red: boolean
  let isDoubleDipping: boolean


  beforeEach( () => {
    jest.resetAllMocks()
    jest.spyOn(defaultActionService, 'underclaimTotal').mockImplementation(() => underclaimTotal)
    jest.spyOn(defaultActionService, 'is3Red').mockImplementation(() => is3Red)
    jest.spyOn(defaultActionService, 'doubleDipping').mockImplementation(() => isDoubleDipping)
  })

  it('lies about a fasc role (says lib) 60% of time if underclaim and 3red conditions met', () => {
    is3Red = true
    underclaimTotal = 2
    expect(defaultActionService.getFascLieOnInvProb(game, player2, player3)).toEqual(.6)
  })

  it('lies about a fasc role (says lib) 100% of time if conditions arent met of underclaim and lib3red', () => {
    is3Red = false
    underclaimTotal = 3
    expect(defaultActionService.getFascLieOnInvProb(game, player2, player3)).toEqual(1)
    is3Red = true
    underclaimTotal = 1
    expect(defaultActionService.getFascLieOnInvProb(game, player2, player3)).toEqual(1)
  })

  it('lies 50% of time double dipping inv a lib as hitler or vanilla', () => {
    isDoubleDipping = true
    expect(defaultActionService.getFascLieOnInvProb(game, player2, player1)).toEqual(.5)
    expect(defaultActionService.getFascLieOnInvProb(game, player3, player1)).toEqual(.5)
  })

  it('returns the proper hitlerProb based on number of blues', () => {
    isDoubleDipping = false
    let hitlerInvLibLieProbs = [.55, .65, .75, .85, 1]
    for(let blues = 0; blues <= 4; blues++){
      game.LibPoliciesEnacted = blues
      expect(defaultActionService.getFascLieOnInvProb(game, player3, player1)).toEqual(hitlerInvLibLieProbs[blues])
    }
  })

  it('returns the proper vanilla Prob based on number of blues', () => {
    isDoubleDipping = false
    let vanillaFascInvLibLieProbs = [.85, .95, 1, 1, 1]
    for(let blues = 0; blues <= 4; blues++){
      game.LibPoliciesEnacted = blues
      expect(defaultActionService.getFascLieOnInvProb(game, player2, player1)).toEqual(vanillaFascInvLibLieProbs[blues])
    }
  })



describe('getSimpleFascLieOnInvProb', () => {

  it('lies about a fasc role 100% of time', () => {
    expect(defaultActionService.getSimpleFascLieOnInvProb(game, player2, player3)).toEqual(1)
    expect(defaultActionService.getSimpleFascLieOnInvProb(game, player3, player2)).toEqual(1)
  })


  it('returns the proper hitlerProb based on number of blues', () => {
    isDoubleDipping = false
    let hitlerInvLibLieProbs = [.55, .8, 1, 1, 1]
    for(let blues = 0; blues <= 4; blues++){
      game.LibPoliciesEnacted = blues
      expect(defaultActionService.getSimpleFascLieOnInvProb(game, player3, player1)).toEqual(hitlerInvLibLieProbs[blues])
    }
  })

  it('returns 1 for vanilla fasc', () => {
    isDoubleDipping = false
    for(let blues = 0; blues <= 4; blues++){
      game.LibPoliciesEnacted = blues
      expect(defaultActionService.getSimpleFascLieOnInvProb(game, player2, player1)).toEqual(1)
    }
  })

})
})



})


  /**

   */







