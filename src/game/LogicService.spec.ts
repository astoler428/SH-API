import { Test, TestingModule } from "@nestjs/testing";
import { LogicService } from "./logic.service";
import { Player } from "../models/player.model";
import { PlayerMockFactory } from "../test/PlayerMockFactory";
import { Game } from "../models/game.model";
import { GameMockFactory } from "../test/GameMockFactory";
import { Color, GameSettings, GameType, Policy, Role, Status, Team, Vote } from "../consts";
import { CardMockFactory } from "../test/CardMockFactory";
import { Card } from "../models/card.model";
import { Deck } from "../models/deck.model";
import { DeckMockFactory } from "../test/DeckMockFactory";

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
      expect(player1.vote).toEqual(undefined)
      expect(player2.vote).toEqual(undefined)
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

  describe('build deck', () => {
    it('properly builds the deck', () => {
      expect(deck.drawPile).toHaveLength(17)
      expect(deck.discardPile).toHaveLength(0)
      const fascPolicies = deck.drawPile.filter(card => card.policy === Policy.FASC)
      const libPolicies = deck.drawPile.filter(card => card.policy === Policy.LIB)
      expect(fascPolicies).toHaveLength(11)
      expect(libPolicies).toHaveLength(6)
      expect(deck.deckNum).toEqual(1)
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

    it('calls reshuffle when needed', ()=>{
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

      it('calls reshuffle when needed', ()=>{
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

      it('calls reshuffle when needed', ()=>{
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
