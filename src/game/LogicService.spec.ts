import { Test, TestingModule } from "@nestjs/testing";
import { LogicService } from "./logic.service";
import { Player } from "../models/player.model";
import { PlayerMockFactory } from "../test/PlayerMockFactory";
import { Game } from "../models/game.model";
import { GameMockFactory } from "../test/GameMockFactory";
import { CHAN2, Color, GameSettings, GameType, PRES3, Policy, Role, Status, Team, Vote } from "../consts";
import { CardMockFactory } from "../test/CardMockFactory";
import { Card } from "../models/card.model";
import { Deck } from "../models/deck.model";
import { DeckMockFactory } from "../test/DeckMockFactory";
import { log } from "console";

describe("Logic Service", () => {
  let logicService: LogicService
  let players: Player[]
  let game: Game
  let gameSettings: GameSettings
  let mockStartGame: jest.SpyInstance

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
    mockStartGame = jest.spyOn(logicService, 'startGame')
    logicService.startGame(game)
  })

  describe('startGame', ()=>{

    it('sets game status', ()=>{
      expect(game.status).toEqual(Status.CHOOSE_CHAN)
    })

    it('starts with a red down in redDown setting', ()=> {
      for(let i = 1; i <= 5; i++){
        players.push(new PlayerMockFactory().create(({name: `player-${i}`})))
      }
      game = new GameMockFactory().create({players, settings: {
        type: GameType.BLIND,
        redDown: true,
        libSpy: false,
        hitlerKnowsFasc: false
      }, })
      logicService.startGame(game)
      expect(game.FascPoliciesEnacted).toEqual(1)
      expect(game.deck.discardPile).toHaveLength(1)
      expect(game.deck.drawPile).toHaveLength(16)
      expect(game.deck.discardPile[0].policy).toEqual(Policy.FASC)
    })

    it('calls init deck', () => {
      expect(mockStartGame).toBeCalled()
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
      const alive: Player[] = game.players.filter(player => player.alive)
      expect(hitler).toHaveLength(1)
      expect(omniFasc).toHaveLength(1)
      expect(libs).toHaveLength(6)
      expect(fascs).toHaveLength(4)
      expect(alive).toHaveLength(10)
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

  describe('choose chan', ()=> {

    beforeEach(()=>{
      jest.spyOn(logicService, 'resetVotes')
      logicService.chooseChan(game, 'player-2')
    })

    it('sets the current chan', () => {
      expect(game.currentChan).toBeDefined()
      expect(game.currentChan.name).toEqual('player-2')
    })

    it('calls to reset votes', () => {
      expect(logicService.resetVotes).toBeCalled()
    })

    it('adds to the log', () => {
      expect(game.log).toHaveLength(1)
      expect(game.log[0]).toEqual(`${game.currentPres.name} chooses player-2 as chancellor.`)
    })

    it('sets the status to VOTE', ()=> {
      expect(game.status).toEqual(Status.VOTE)
    })
  })

  describe('vote', ()=>{
    let player1: Player, player2: Player


    beforeEach(()=>{
      jest.spyOn(logicService, 'countVotes')
      logicService.vote(game, 'player-1', Vote.JA)
      logicService.vote(game, 'player-2', Vote.NEIN)
      player1 = game.players.find(player => player.name === 'player-1')
      player2 = game.players.find(player => player.name === 'player-2')
    })

    it('assigns votes', () => {
      expect(logicService.countVotes).toBeCalled()
      expect(player1.vote).toEqual(Vote.JA)
      expect(player2.vote).toEqual(Vote.NEIN)
    })

    it('changes votes', () => {
      logicService.vote(game, 'player-1', Vote.NEIN)
      logicService.vote(game, 'player-2', Vote.JA)
      expect(player1.vote).toEqual(Vote.NEIN)
      expect(player2.vote).toEqual(Vote.JA)
    })

    it('removes votes', () => {
      logicService.vote(game, 'player-1', Vote.JA)
      logicService.vote(game, 'player-2', Vote.NEIN)
      expect(player1.vote).toBeNull()
      expect(player2.vote).toBeNull()
    })
  })

  describe('countVotes', ()=>{

    beforeEach(()=>{
      logicService.vote(game, 'player-1', Vote.JA)
      logicService.vote(game, 'player-2', Vote.JA)
      logicService.vote(game, 'player-3', Vote.NEIN)
      logicService.vote(game, 'player-4', Vote.NEIN)
      logicService.countVotes(game)
    })

    it('correctly determines when all votes are in', ()=>{
      expect(game.status).not.toEqual(Status.VOTE_RESULT)
      logicService.vote(game, 'player-4', Vote.NEIN)
      logicService.vote(game, 'player-5', Vote.JA)
      expect(game.status).not.toEqual(Status.VOTE_RESULT)
      logicService.vote(game, 'player-4', Vote.NEIN)
      expect(game.status).toEqual(Status.VOTE_RESULT)
    })
  })

  describe('PresDiscard', ()=>{
    let card1: Card, card2: Card, card3: Card

    beforeEach(()=>{
      card1 = new CardMockFactory().createLib()
      card2 = new CardMockFactory().createFasc()
      card3 = new CardMockFactory().createFasc()
      game.presCards = [card1, card2, card3]
      jest.spyOn(logicService, 'discard')
      logicService.presDiscard(game, Color.BLUE)
    })

    it('sets the pres discard and chan cards', ()=>{
      expect(game.presDiscard).toBeDefined()
      expect(game.presDiscard.policy).toEqual(Policy.LIB)
      expect(game.chanCards).toBeDefined()
      expect(game.chanCards).toHaveLength(2)
      const blue = game.chanCards.find(card => card.color === Color.BLUE)
      expect(blue).toBeUndefined()
    })

    it('sets the correct status', () => {
      expect(game.status).toEqual(Status.CHAN_PLAY)
    })

    it('it discards the pres discard', () => {
      expect(logicService.discard).toBeCalledWith(card1, game.deck)
    })
  })

  describe('chanPlay', ()=>{
    let card1: Card, card2: Card

    beforeEach(()=>{
      card1 = new CardMockFactory().createLib()
      card2 = new CardMockFactory().createFasc()
      game.chanCards = [card1, card2]
      jest.spyOn(logicService, 'enactPolicy')
      jest.spyOn(logicService, 'discard')
      logicService.chanPlay(game, Color.BLUE)
    })

    it('sets chanPlay', ()=>{
      expect(game.chanPlay).toBeDefined()
      expect(game.chanPlay.policy).toEqual(Policy.LIB)
    })

    it('discards the correct card', () => {
      expect(logicService.discard).toBeCalledWith(card2, game.deck)
    })

    it('enacts the policy', () => {
      expect(logicService.enactPolicy).toBeCalledWith(game, card1, false)
    })
  })

  describe('determineResultsOfVote', () => {

    beforeEach(()=>{
      logicService.vote(game, 'player-1', Vote.JA)
      logicService.vote(game, 'player-2', Vote.JA)
      logicService.vote(game, 'player-3', Vote.NEIN)
      logicService.vote(game, 'player-4', Vote.NEIN)
      logicService.vote(game, 'player-5', Vote.JA)
      jest.spyOn(logicService, 'presDraw3')
      jest.spyOn(logicService, 'advanceTracker')
    })

    it('passes the vote in an odd number of players', ()=> {
      logicService.determineResultofVote(game)
      expect(logicService.presDraw3).toBeCalledWith(game)
    })

    it('passes the vote in an even number of players', ()=> {
      game.players.push(new PlayerMockFactory().create({name: 'player-6', vote: Vote.JA}))
      expect(game.players).toHaveLength(6)
      logicService.determineResultofVote(game)
      expect(logicService.presDraw3).toBeCalledWith(game)
    })

    it('does not pass in odd number of players', () => {
      logicService.vote(game, 'player-5', Vote.NEIN)
      logicService.determineResultofVote(game)
      expect(game.log.includes('Vote does not pass.')).toBeTruthy()
      expect(logicService.advanceTracker).toBeCalledWith(game)
    })

    it('does not pass in even number of players', () => {
      game.players.push(new PlayerMockFactory().create({name: 'player-6', vote: Vote.NEIN}))
      expect(game.players).toHaveLength(6)
      const jas = game.players.filter(player => player.vote === Vote.JA)
      const neins = game.players.filter(player => player.vote === Vote.NEIN)
      expect(jas).toHaveLength(3)
      expect(neins).toHaveLength(3)
      logicService.determineResultofVote(game)
      expect(game.log.includes('Vote does not pass.')).toBeTruthy()
      expect(logicService.advanceTracker).toBeCalledWith(game)
    })

    it('it checks hitler condition and makes appropriate calls', () => {
      const mockCheckHitler = jest.spyOn(logicService, 'checkHitler').mockImplementation(() => true)
      game.currentChan = new PlayerMockFactory().create({name: 'player-1'})
      logicService.determineResultofVote(game)
      expect(mockCheckHitler).toBeCalledWith(game)
      expect(game.status).toEqual(Status.END_FASC)
      expect(game.log.includes(`player-1 is Hitler. Fascists win!`)).toBeTruthy()
    })
  })

  describe('presDraw3', () => {

    beforeEach(() => {
      jest.spyOn(logicService, 'draw3')
      logicService.presDraw3(game)
    })

    it('calls draw3 passing in the deck', () => {
      expect(logicService.draw3).toBeCalledWith(game.deck)
      expect(logicService.draw3).toBeCalledTimes(1)
    })

    it('sets the status to pres discard', () => {
      expect(game.status).toBe(Status.PRES_DISCARD)
    })
  })

  describe('advanceTracker', () => {

    beforeEach(() => {
      jest.spyOn(logicService, 'draw3')
      jest.spyOn(logicService, 'topDeck')
      jest.spyOn(logicService, 'nextPres')
      game.tracker = 0
      logicService.advanceTracker(game)
    })

    it('advances the tracker', () => {
      expect(game.tracker).toEqual(1)
    })

    it('calls topDeck if tracker is 3', () => {
      logicService.advanceTracker(game)
      expect(logicService.topDeck).not.toBeCalled()
      logicService.advanceTracker(game)
      expect(logicService.topDeck).toBeCalledTimes(1)
    })

    it('calls nextPres if the game does not end on top deck', ()=>{
      jest.spyOn(logicService, 'gameOver').mockImplementation(() => false)
      expect(logicService.nextPres).toBeCalledTimes(1)
    })
  })

  describe('nextPres', () => {

    beforeEach(() => {
      game.presIdx = 3
      game.currentChan = new PlayerMockFactory().create({name: 'player-1'})
      logicService.nextPres(game)
    })

    it('assigns the next president', () => {
      expect(game.presIdx).toEqual(4)
      expect(game.currentPres).toBe(game.players[4])
      // expect(game.currentPres.name).toBe('player-5')
      logicService.nextPres(game)
      expect(game.presIdx).toBe(0)
      expect(game.currentPres).toBe(game.players[0])
    })

    it('assigns the next president if someone is dead', () => {
      expect(game.presIdx).toEqual(4)
      game.players[0].alive = false
      logicService.nextPres(game)
      expect(game.presIdx).toBe(1)
      expect(game.currentPres).toBe(game.players[1])
    })

    it('removes the currentChan and sets the status', ()=>{
      expect(game.currentChan).toBeNull()
      expect(game.status).toBe(Status.CHOOSE_CHAN)
    })
  })

  describe('resetVotes', () => {

    beforeEach(() => {
      for(const player of game.players){
        player.vote = Math.random() - .5 < 0 ? Vote.JA : Vote.NEIN
      }
    })

    it('sets everyones vote to undefined', () => {
      for(const player of game.players){
        expect(player.vote).toBeDefined()
      }
      logicService.resetVotes(game)
      for(const player of game.players){
        expect(player.vote).toBeNull()
      }
    })
  })

  describe('gameOver', () => {
    it('determines of the game is over', () => {
      game.status = Status.END_FASC
      expect(logicService.gameOver(game)).toBe(true)
      game.status = Status.END_LIB
      expect(logicService.gameOver(game)).toBe(true)
      game.status = Status.CHOOSE_CHAN
      expect(logicService.gameOver(game)).toBe(false)
    })
  })

  describe('gameOver', () => {

    let topDeckedCard: Card
    beforeEach(()=> {
      topDeckedCard = new CardMockFactory().createFasc()
      jest.spyOn(logicService, 'topDeckCard').mockImplementation(() => topDeckedCard)
      jest.spyOn(logicService, 'enactPolicy')
      jest.spyOn(logicService, 'removePrevLocks')
      logicService.topDeck(game)
    })
    it('calls the appropriate functions', () => {
     expect(logicService.topDeckCard).toBeCalledTimes(1)
     expect(logicService.enactPolicy).toBeCalledWith(game, topDeckedCard, true)
     expect(logicService.removePrevLocks).toBeCalledWith(game)
    })
  })

  describe('enactPolicy', () => {
    let fascCard: Card
    let libCard: Card

    beforeEach(()=> {
      fascCard = new CardMockFactory().createFasc()
      libCard = new CardMockFactory().createLib()
      jest.clearAllMocks()
      jest.spyOn(logicService, 'libSpyCondition').mockImplementation((game) => false)

      // jest.spyOn(logicService, 'enactPolicy')
      // jest.spyOn(logicService, 'removePrevLocks')
      game.FascPoliciesEnacted = 0
      game.LibPoliciesEnacted = 0
    })
    it('logs the correct statement', () => {
      logicService.enactPolicy(game, fascCard, true)
      expect(game.log[0]).toBe(`Topdecking. A Fascist policy is enacted.`)
      logicService.enactPolicy(game, libCard, false)
      expect(game.log[1]).toBe(`A Liberal policy is enacted.`)
    })

    it('increments the policy played', () => {
      logicService.enactPolicy(game, fascCard, true)
      expect(game.FascPoliciesEnacted).toEqual(1)
      logicService.enactPolicy(game, libCard, false)
      expect(game.LibPoliciesEnacted).toEqual(1)
    })

    it('determines a fascist win in a regular game', () => {
      game.FascPoliciesEnacted = 5
      logicService.enactPolicy(game, fascCard, true)
      expect(game.status).toBe(Status.END_FASC)
      expect(game.log[1]).toBe(`Fascists win!`)
    })

    it('determines a fascist win in a libSpy game', () => {
      game.LibPoliciesEnacted = 4
      game.settings.libSpy = true
      logicService.enactPolicy(game, libCard, true)
      expect(game.settings.libSpy).toBe(true)
      expect(logicService.libSpyCondition).toBeCalledTimes(1)
      expect(game.status).toBe(Status.END_FASC)
      expect(game.log[1]).toBe(`The liberal spy did not play a red. Fascists win!`)
    })

    it('determines a lib win in a regular game', () => {
      game.LibPoliciesEnacted = 4
      logicService.enactPolicy(game, libCard, true)
      expect(game.status).toBe(Status.END_LIB)
      expect(game.log[1]).toBe(`Liberals win!`)
    })

    it('determines a liberal win in a libSpy game', () => {
      game.LibPoliciesEnacted = 4
      game.settings.libSpy = true
      jest.spyOn(logicService, 'libSpyCondition').mockImplementation((game) => true)
      logicService.enactPolicy(game, libCard, true)
      expect(game.settings.libSpy).toBe(true)
      expect(game.status).toBe(Status.END_LIB)
      expect(game.log[1]).toBe(`Liberals win!`)
    })

    it('calls reset tracker', () => {
      jest.spyOn(logicService, 'resetTracker').mockImplementation(() => {})
      logicService.enactPolicy(game, libCard, true)
      expect(logicService.resetTracker).toBeCalledTimes(1)
    })

    it('sets status and setsPrevLocks if game not over and not topdeck', () => {
      jest.spyOn(logicService, 'gameOver').mockImplementation(() => false)
      jest.spyOn(logicService, 'setPrevLocks')
      logicService.enactPolicy(game, libCard, false)
      expect(game.status).toBe(Status.CHAN_CLAIM)
      expect(logicService.gameOver).toBeCalledTimes(1)
      expect(logicService.setPrevLocks).toBeCalledTimes(1)
    })

    it('calls reshuffle if under 3 cards in the deck', () => {
      jest.spyOn(logicService, 'reshuffle').mockImplementation(() => {})
      game.deck.drawPile = [0, 1, 2].map(i => new CardMockFactory().createFasc())
      logicService.enactPolicy(game, libCard, false)
      expect(logicService.reshuffle).not.toBeCalled()
      game.deck.drawPile = [0, 1].map(i => new CardMockFactory().createFasc())
      logicService.enactPolicy(game, libCard, false)
      expect(logicService.reshuffle).toBeCalledTimes(1)
    })
  })

  describe('presClaim', () => {
    const claim = PRES3.RRR
    beforeEach(()=> {
      game.currentPres.name = 'player-1'
      jest.spyOn(logicService, 'addGov').mockImplementation((game) => {})
      jest.spyOn(logicService, 'determinePolicyConf').mockImplementation((game) => {})
      jest.spyOn(logicService, 'determineNextStatus').mockImplementation((game) => Status.INV)
      logicService.presClaim(game, claim)
    })

    it('sets the claim and adds it to the log', () => {
      expect(game.presClaim).toEqual(claim)
      expect(game.log[0]).toBe('player-1 claims RRR')
    })

    it('calls the right functions', () => {
      expect(logicService.addGov).toBeCalledTimes(1)
      expect(logicService.determinePolicyConf).toBeCalledTimes(1)
      expect(logicService.determineNextStatus).toBeCalledTimes(1)
    })
  })



  describe('addGov', () => {
    let chanPlay = new CardMockFactory().createFasc()
    let presCards = [0,1,2].map( i => new CardMockFactory().createFasc())
    let chanCards = [0,1].map( i => new CardMockFactory().createFasc())
    beforeEach(()=> {
      game.currentPres =  game.players[0]
      game.currentChan = game.players[1]
      game.chanPlay = chanPlay
      game.presCards = presCards
      game.chanCards = chanCards
      game.presClaim = PRES3.RRR
      game.chanClaim = CHAN2.RR
      jest.spyOn(logicService, 'determineUnderClaim').mockImplementation((game) => 2)
      logicService.addGov(game)
    })

    it('calls determineUnderClaim', () => {
      expect(logicService.determineUnderClaim).toBeCalledTimes(1)
    })

    it('adds the corect values to the gov', () => {
      expect(game.govs[0].deckNum).toEqual(1)
      expect(game.govs[0].pres).toBe(game.players[0])
      expect(game.govs[0].chan).toBe(game.players[1])
      expect(game.govs[0].policyPlayed).toBe(chanPlay)
      expect(game.govs[0].presCards).toBe(presCards)
      expect(game.govs[0].chanCards).toBe(chanCards)
      expect(game.govs[0].presClaim).toBe(PRES3.RRR)
      expect(game.govs[0].chanClaim).toBe(CHAN2.RR)
      expect(game.govs[0].underclaim).toEqual(2)
    })
  })

  /**

   */

  /**
   * Testing deck
   */

  describe("Deck", () => {
  let deck: Deck

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    deck = new DeckMockFactory().createFullDeck()
  })

  describe('initDeck', () => {

    it('calls build deck and shuffle deck', () => {
      const game = new GameMockFactory().create()
      jest.spyOn(logicService, 'buildDeck')
      jest.spyOn(logicService, 'shuffleDeck')
      logicService.initDeck(game)
      expect(logicService.buildDeck).toBeCalledWith(game.deck)
      expect(logicService.shuffleDeck).toBeCalledWith(game.deck)
    })
  })

  describe('build deck', () => {
    it('properly builds the deck', () => {
      const game = new GameMockFactory().create()
      logicService.buildDeck(game.deck)
      expect(game.deck.drawPile).toHaveLength(17)
      expect(game.deck.discardPile).toHaveLength(0)
      const fascPolicies = game.deck.drawPile.filter(card => card.policy === Policy.FASC)
      const libPolicies = game.deck.drawPile.filter(card => card.policy === Policy.LIB)
      expect(fascPolicies).toHaveLength(11)
      expect(libPolicies).toHaveLength(6)
      expect(game.deck.deckNum).toEqual(1)
    })
  })

  describe('reshuffle', () => {

    beforeEach(async () => {
      jest.spyOn(logicService, 'shuffleDeck')
      logicService.reshuffle(deck)
    })
    it('increases the deckNum', ()=>{
      expect(deck.deckNum).toEqual(2)
    })

    it('combines the cards back into the drawPile', ()=>{
      for(let i = 0; i < 15; i ++){
        deck.discardPile.push(deck.drawPile.pop())
      }
      expect(deck.drawPile).toHaveLength(2)
      expect(deck.discardPile).toHaveLength(15)
      logicService.reshuffle(deck)
      expect(deck.drawPile).toHaveLength(17)
      expect(deck.discardPile).toHaveLength(0)
    })

    it('calls shuffleDeck', ()=>{
      expect(logicService.shuffleDeck).toBeCalled()
    })
  })

  describe('topDeck', () =>{

    it('it removes and returns a card', ()=>{
      const card: Card = logicService.topDeckCard(deck)
      expect(card).toBeDefined()
      expect(deck.drawPile).toHaveLength(16)
    })
  })

    it.skip('calls reshuffle when needed', ()=>{
      jest.spyOn(logicService, 'reshuffle')
      for(let i = 0; i < 14; i++){
        deck.discardPile.push(deck.drawPile.pop())
      }
      logicService.topDeckCard(deck)
      expect(logicService.reshuffle).not.toBeCalled()
      const card: Card = logicService.topDeckCard(deck)
      expect(logicService.reshuffle).toBeCalled()
      expect(card).toBeDefined()
    })


    describe('draw3', () => {

      it.skip('calls reshuffle when needed', ()=>{
        jest.spyOn(logicService, 'reshuffle')
        for(let i = 0; i < 14; i++){
          deck.discardPile.push(deck.drawPile.pop())
        }
        logicService.draw3(deck)
        expect(logicService.reshuffle).not.toBeCalled()
        logicService.draw3(deck)
        expect(logicService.reshuffle).toBeCalled()
      })

      it('removes and returns 3 cards', ()=>{
        const cards: Card[] = logicService.draw3(deck)
        expect(cards).toBeDefined()
        expect(cards).toHaveLength(3)
        expect(deck.drawPile).toHaveLength(14)
      })
    })

    describe('inspect3', () => {

      it.skip('calls reshuffle when needed', ()=>{
        jest.spyOn(logicService, 'reshuffle')
        for(let i = 0; i < 14; i++){
          deck.discardPile.push(deck.drawPile.pop())
        }
        logicService.inspect3(deck)
        expect(logicService.reshuffle).not.toBeCalled()
        deck.discardPile.push(deck.drawPile.pop())
        logicService.inspect3(deck)
        expect(logicService.reshuffle).toBeCalled()
      })

      it('returns last 3 cards', ()=>{
        const cards: Card[] = logicService.inspect3(deck)
        expect(cards).toBeDefined()
        expect(cards).toHaveLength(3)
        expect(deck.drawPile).toHaveLength(17)
        let top3 = [deck.drawPile.pop(), deck.drawPile.pop(), deck.drawPile.pop()]
        expect(top3.every(card => cards.includes(card))).toBe(true)
      })
    })

    describe('removeRed', () => {

      it('puts a red card in the discard', ()=>{
        jest.spyOn(logicService, 'shuffleDeck')
        logicService.removeRed(deck)
        expect(deck.discardPile).toHaveLength(1)
        expect(deck.drawPile).toHaveLength(16)
        expect(deck.discardPile[0].policy).toEqual(Policy.FASC)
        expect(logicService.shuffleDeck).toBeCalled()

      })
    })

    describe('discard', () => {

      it('puts the card in the discard', ()=>{
        const card: Card = {policy: Policy.FASC, color: Color.RED}
        logicService.discard(card, deck)
        expect(deck.discardPile).toHaveLength(1)
        expect(deck.discardPile[0]).toEqual(card)
      })
    })
  })
})
