// import { Test, TestingModule } from "@nestjs/testing";
// import { Player } from "../models/player.model";
// import { PlayerMockFactory } from "../test/PlayerMockFactory";
// import { Game } from "../models/game.model";
// import { GameMockFactory } from "../test/GameMockFactory";
// import { Color, GameSettings, GameType, Policy, Role, Status, Team, Vote } from "../consts";
// import { Card } from "../models/card.model";

// describe("Deck", () => {
//   let deck: Deck

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [],
//     }).compile();

//     deck = new Deck()
//   })

//   describe('build deck', () => {
//     it('properly builds the deck', () => {
//       expect(deck.drawPile).toHaveLength(17)
//       expect(deck.discardPile).toHaveLength(0)
//       const fascPolicies = deck.drawPile.filter(card => card.policy === Policy.FASC)
//       const libPolicies = deck.drawPile.filter(card => card.policy === Policy.LIB)
//       expect(fascPolicies).toHaveLength(11)
//       expect(libPolicies).toHaveLength(6)
//       expect(deck.deckNum).toEqual(1)
//     })
//   })

//   describe('reshuffle', () => {

//     beforeEach(async () => {
//       jest.spyOn(deck, 'shuffleDeck')
//       deck.reshuffle()
//     })
//     it('increases the deckNum', ()=>{
//       expect(deck.deckNum).toEqual(2)
//     })

//     it('combines the cards back into the drawPile', ()=>{
//       for(let i = 0; i < 15; i ++){
//         deck.discardPile.push(deck.drawPile.pop())
//       }
//       expect(deck.drawPile).toHaveLength(2)
//       expect(deck.discardPile).toHaveLength(15)
//       deck.reshuffle()
//       expect(deck.drawPile).toHaveLength(17)
//       expect(deck.discardPile).toHaveLength(0)
//     })

//     it('calls shuffleDeck', ()=>{
//       expect(deck.shuffleDeck).toBeCalled()
//     })
//   })

//   describe('topDeck', () =>{

//     it('it removes and returns a card', ()=>{
//       const card: Card = deck.topDeck()
//       expect(card).toBeDefined()
//       expect(deck.drawPile).toHaveLength(16)
//     })
//   })

//     it('calls reshuffle when needed', ()=>{
//       jest.spyOn(deck, 'reshuffle')
//       for(let i = 0; i < 14; i++){
//         deck.discardPile.push(deck.drawPile.pop())
//       }
//       deck.topDeck()
//       expect(deck.reshuffle).not.toBeCalled()
//       const card: Card = deck.topDeck()
//       expect(deck.reshuffle).toBeCalled()
//       expect(card).toBeDefined()
//     })


//     describe('draw3', () => {

//       it('calls reshuffle when needed', ()=>{
//         jest.spyOn(deck, 'reshuffle')
//         for(let i = 0; i < 14; i++){
//           deck.discardPile.push(deck.drawPile.pop())
//         }
//         deck.draw3()
//         expect(deck.reshuffle).not.toBeCalled()
//         deck.draw3()
//         expect(deck.reshuffle).toBeCalled()
//       })

//       it('removes and returns 3 cards', ()=>{
//         const cards: Card[] = deck.draw3()
//         expect(cards).toBeDefined()
//         expect(cards).toHaveLength(3)
//         expect(deck.drawPile).toHaveLength(14)
//       })
//     })

//     describe('inspect3', () => {

//       it('calls reshuffle when needed', ()=>{
//         jest.spyOn(deck, 'reshuffle')
//         for(let i = 0; i < 14; i++){
//           deck.discardPile.push(deck.drawPile.pop())
//         }
//         deck.inspect3()
//         expect(deck.reshuffle).not.toBeCalled()
//         deck.discardPile.push(deck.drawPile.pop())
//         deck.inspect3()
//         expect(deck.reshuffle).toBeCalled()
//       })

//       it('returns last 3 cards', ()=>{
//         const cards: Card[] = deck.inspect3()
//         expect(cards).toBeDefined()
//         expect(cards).toHaveLength(3)
//         expect(deck.drawPile).toHaveLength(17)
//         let top3 = [deck.drawPile.pop(), deck.drawPile.pop(), deck.drawPile.pop()]
//         expect(top3.every(card => cards.includes(card))).toBe(true)
//       })
//     })

//     describe('removeRed', () => {

//       it('puts a red card in the discard', ()=>{
//         jest.spyOn(deck, 'shuffleDeck')
//         deck.removeRed()
//         expect(deck.discardPile).toHaveLength(1)
//         expect(deck.drawPile).toHaveLength(16)
//         expect(deck.discardPile[0].policy).toEqual(Policy.FASC)
//         expect(deck.shuffleDeck).toBeCalled()

//       })
//     })

//     describe('discard', () => {

//       it('puts the card in the discard', ()=>{
//         const card: Card = {policy: Policy.FASC, color: Color.RED}
//         deck.discard(card)
//         expect(deck.discardPile).toHaveLength(1)
//         expect(deck.discardPile[0]).toEqual(card)
//       })
//     })
//   })
