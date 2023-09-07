import {Card} from '../models/card.model'
import {Policy, Color} from '../consts'

export default class Deck {
  drawPile: Card[]
  discardPile: Card[]
  deckNum: number

  constructor(){
    this.drawPile = []
    this.discardPile = []
    this.deckNum = 1
    this.buildDeck()
    this.shuffleDeck()
  }

  buildDeck(){
    for(let i = 0; i < 6; i++){
      this.drawPile.push({policy: Policy.LIB, color: Color.BLUE })
    }
    for(let i = 0; i < 11; i++){
      this.drawPile.push({policy: Policy.FASC, color: Color.RED })
    }
  }

  shuffleDeck(){
    this.drawPile.sort(()=> Math.random() - .5)
    this.drawPile.sort(()=> Math.random() - .5)
  }

  reshuffle(){
    console.log('reshuffling the deck')
    this.deckNum++
    this.drawPile = [...this.drawPile, ...this.discardPile]
    this.shuffleDeck()
  }

  public topDeck(){
    if(this.drawPile.length < 3){
      this.reshuffle()
    }
    return this.drawPile.pop()
  }

  draw3(){
    if(this.drawPile.length < 3){
      this.reshuffle()
    }
    const card1 = this.drawPile.pop()
    const card2 = this.drawPile.pop()
    const card3 = this.drawPile.pop()
    const top3 = [card1, card2, card3]
    return top3
  }

  inspect3(){
    if(this.drawPile.length < 3){
      this.reshuffle()
    }

    const n = this.drawPile.length
    const card1 = this.drawPile[n-1]
    const card2 = this.drawPile[n-2]
    const card3 = this.drawPile[n-3]
    const top3 = [card1, card2, card3].sort(()=> Math.random() - .5)
    return top3
  }

  discard(card: Card){
    this.discardPile.push(card)
  }
}