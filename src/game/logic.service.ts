import { BadRequestException, Injectable } from "@nestjs/common";
import { CHAN2, Color, Conf, GameType, PRES3, Policy, RRR, Role, Status, Team, Vote, draws2, draws3, gameRoles, gameTeams } from "../consts";
import { Game } from "../models/game.model";
import { Card } from "src/models/card.model";
import { Deck } from "src/models/deck.model";

@Injectable()
export class LogicService{

  //initialize the deck here
  startGame(game: Game){
    game.status = Status.CHOOSE_CHAN
    this.initPlayers(game)
    game.currentPres = game.players[game.presIdx].name
    this.initDeck(game)
    if(game.settings.redDown){
      this.removeRed(game.deck)
      game.FascPoliciesEnacted = 1
    }
  }

  initPlayers(game: Game){
    const teams = gameTeams.slice(1, game.players.length)
    const roles = gameRoles.slice(1, game.players.length)

    // let i = 0
    // for(; i < game.players.length / 2 - 1; i++){
    //   game.players[i].team = Team.FASC
    //   // game.players[i].role = Role.FASC
    // }
    // for(; i < game.players.length; i++){
    //   game.players[i].team = Team.LIB
    //   // game.players[i].role = Role.LIB
    // }
    game.players.sort(() => Math.random() - .5)
    game.players[0].role = Role.HITLER
    game.players[0].team = Team.FASC
    const nonHitlerPlayers = game.players.slice(1)


    if(game.settings.type === GameType.LIB_SPY){
      roles[1] = Role.LIB_SPY
    }
    else if(game.settings.type === GameType.MIXED_ROLES){
      roles.sort(() => Math.random() - .5)
    }
    nonHitlerPlayers.sort(() => Math.random() - .5)
    nonHitlerPlayers.forEach((player, idx) => {
      player.team = teams[idx]
      player.role = roles[idx]
    })

    if(game.settings.type === GameType.BLIND){
      nonHitlerPlayers[0].omniFasc = true
    }

    game.players.sort(() => Math.random() - .5)
  }

  initDeck(game: Game){
    this.buildDeck(game.deck)
    this.shuffleDeck(game.deck)
  }

  chooseChan(game: Game, chanName: string){
    // const chanPlayer = this.findPlayerIngame(game, chanName)
    game.currentChan = chanName
    this.resetVotes(game)
    game.log.push(`${game.currentPres} chooses ${chanName} as chancellor.`)
    game.status = Status.VOTE
  }

  vote(game: Game, name: string, vote: Vote){
    const player = this.findPlayerIngame(game, name)
    if(player.vote !== vote){
      player.vote = vote
    }
    else{
      player.vote = null
    }
    this.countVotes(game)
  }

  countVotes(game: Game){
    const numVotes = game.players.reduce((acc, player) => player.vote ? acc+1 : acc, 0)

    // if(this.numAlivePlayers(game) === numVotes){
    //   game.status = Status.VOTE_RESULT
    // }
    if(numVotes > 0){
      game.status = Status.VOTE_RESULT
    }
  }

  presDiscard(game: Game, cardColor: string){
    game.presDiscard = game.presCards.find(card => card.color === cardColor)
    game.chanCards = game.presCards.filter(card => card !== game.presDiscard)
    this.discard(game.presDiscard, game.deck)
    game.status = Status.CHAN_PLAY
  }

  chanPlay(game: Game, cardColor: string){
    game.chanPlay = game.chanCards.find(card => card.color === cardColor)
    const chanDiscard = game.chanCards.find(card => card !== game.chanPlay)
    this.discard(chanDiscard, game.deck)
    this.enactPolicy(game, game.chanPlay, false)
  }

  determineResultofVote(game: Game){
    const jas = game.players.reduce((acc, player) => player.vote === Vote.JA ? acc+1 : acc, 0)

    // if(jas > this.numAlivePlayers(game) / 2){
    if(jas > 0){
      if(this.checkHitler(game)){
        game.log.push(`${game.currentChan} is Hitler. Fascists win!`)
        game.status = Status.END_FASC
      }
      else{
        this.presDraw3(game)
      }
    }
    else{
      //vote didn't pass
      game.log.push(`Vote does not pass.`)
      this.advanceTracker(game)
    }
  }

  presDraw3(game: Game){
    game.presCards = this.draw3(game.deck)
    game.status = Status.PRES_DISCARD
  }

  advanceTracker(game: Game){
    game.tracker++
    if(game.tracker === 3){
      this.topDeck(game)
    }
    //topdecking may have led to gameover
    if(!this.gameOver(game)){
      this.nextPres(game)
    }
  }

  nextPres(game: Game){
    do{
      game.presIdx = (game.presIdx + 1) % game.players.length
    }
    while(!game.players[game.presIdx].alive)
    game.currentPres = game.players[game.presIdx].name
    game.currentChan = null
    game.status = Status.CHOOSE_CHAN
  }

  resetVotes(game: Game){
    for(const player of game.players){
      player.vote = null
    }
  }


  gameOver(game: Game){
    return game.status === Status.END_FASC || game.status === Status.END_LIB
  }

  topDeck(game: Game){
    const card = this.topDeckCard(game.deck)

    //enacting policy always resets tracker
    this.enactPolicy(game, card, true)
    this.removePrevLocks(game)
  }

  enactPolicy(game: Game, card: Card, topDeck: boolean){
    game.log.push(`${topDeck ? 'Topdecking. ' : ''}A ${card.policy} policy is enacted.`)
    if(card.policy === Policy.LIB){
      game.LibPoliciesEnacted++
      if(game.LibPoliciesEnacted === 5){
        if(game.settings.type === GameType.LIB_SPY && !this.libSpyCondition(game)){
          game.status = Status.END_FASC
          game.log.push(`The liberal spy did not play a red. Fascists win!`)
        }
        else{
          game.status = Status.END_LIB
          game.log.push(`Liberals win!`)
        }
      }
    }
    else{
      game.FascPoliciesEnacted++
      if(game.FascPoliciesEnacted === 6){
        game.status = Status.END_FASC
        game.log.push(`Fascists win!`)
      }
    }

    if(!this.gameOver(game) && !topDeck){
      this.setPrevLocks(game) //was settting in after pres claim
      game.status = Status.CHAN_CLAIM
    }
    this.resetTracker(game)
    if(game.deck.drawPile.length < 3){
      this.reshuffle(game.deck)
    }
  }

  presClaim(game: Game, claim: PRES3){
    game.presClaim = claim
    game.log.push(`${game.currentPres} claims ${game.presClaim}`)
    this.addGov(game)
    this.determinePolicyConf(game)
    this.determineNextStatus(game)
  }

  addGov(game: Game){
    game.govs.push({
      deckNum: game.deck.deckNum,
      pres: game.currentPres,
      chan: game.currentChan,
      policyPlayed: game.chanPlay,
      presCards: game.presCards,
      chanCards: game.chanCards,
      presClaim: game.presClaim,
      chanClaim: game.chanClaim,
      underclaim: this.determineUnderClaim(game)
    })
  }

  determinePolicyConf(game: Game){
    //chan claims 0 blues, pres claims at least 1 blue
    if(draws2.indexOf(game.chanClaim) === 0 && draws3.indexOf(game.presClaim) > 0){
      game.confs.push({confer: game.currentPres, confee: game.currentChan, type: Conf.POLICY})
    }
  }

  determineUnderClaim(game: Game): number{
    const bluesDrawn = game.presCards.reduce((acc, card) => card.policy === Policy.LIB ? acc+1 : acc, 0)
    return bluesDrawn - draws3.indexOf(game.presClaim)
  }

  determineNextStatus(game: Game){
    if(game.chanPlay.policy === Policy.FASC){
      if(game.FascPoliciesEnacted === 1 && game.players.length >= 9){
        return game.status = Status.INV
      }
      else if(game.FascPoliciesEnacted === 2 && game.players.length >= 7){
        return game.status = Status.INV
      }
      else if(game.FascPoliciesEnacted === 3 && game.players.length >= 7){
        return game.status = Status.SE
      }
      else if(game.FascPoliciesEnacted === 3 && game.players.length < 7){
        game.top3 = this.inspect3(game.deck)
        return game.status = Status.INSPECT_TOP3
      }
      else if(game.FascPoliciesEnacted === 4 || game.FascPoliciesEnacted === 5){
        return game.status = Status.GUN
      }
    }
    this.nextPres(game)
  }

  setPrevLocks(game: Game){
    game.prevChan = game.currentChan
    game.prevPres = this.numAlivePlayers(game) > 5 ? game.currentPres : null
  }

  chanClaim(game: Game, claim: CHAN2){
    game.chanClaim = claim
    game.log.push(`${game.currentChan} claims ${game.chanClaim}`)
    game.status = Status.PRES_CLAIM
  }

  chooseInv(game: Game, invName: string){
    const invPlayer = this.findPlayerIngame(game, invName)
    invPlayer.investigated = true
    this.getCurrentPres(game).investigations.push(invName)
    game.status = Status.INV_CLAIM
  }

  invClaim(game: Game, claim: Role){
    const investigatee = this.getCurrentPres(game).investigations.slice(-1)[0]
    game.log.push(`${game.currentPres} claims ${investigatee} is a ${claim}`)
    game.invClaims.push({investigator: game.currentPres, investigatee, claim })
    if(claim === Role.FASC){
      game.confs.push({confer: game.currentPres, confee: this.getCurrentPres(game).investigations.slice(-1)[0], type: Conf.INV})
    }
    this.nextPres(game)
  }

  //here in testing
  chooseSE(game: Game, seName: string){
    game.log.push(`${game.currentPres} special elects ${seName}`)
    game.currentPres = seName
    game.status = Status.CHOOSE_CHAN
  }

  shootPlayer(game: Game, shotName: string){
    game.log.push(`${game.currentPres} shoots ${shotName}`)

    const shotPlayer = this.findPlayerIngame(game, shotName)
    shotPlayer.alive = false
    if(this.numAlivePlayers(game) <= 5){
      game.prevPres = null
    }
    if(shotPlayer.role === Role.HITLER){
      game.status = Status.END_LIB
      game.log.push(`${shotName} was Hitler. Liberals win!`)
    }
    else{
      this.nextPres(game)
    }
  }

  vetoRequest(game: Game){
    game.log.push(`${game.currentChan} requests a veto.`)
    game.status = Status.VETO_REQUEST
  }

  vetoReply(game: Game, vetoAccepted: boolean){
    if(vetoAccepted){
      game.log.push(`${game.currentPres} agrees to a veto.`)
      game.chanCards.forEach(card => this.discard(card, game.deck))
      this.setPrevLocks(game)
      this.advanceTracker(game)
    }
    else{
      game.log.push(`${game.currentPres} declines a veto.`)
      game.status = Status.VETO_DECLINED
    }
  }

  inspect3Claim(game: Game, claim: PRES3){
    game.log.push(`${game.currentPres} claims the top 3 are ${claim}. Policies are shuffled.`)
    this.nextPres(game)
  }

  removePrevLocks(game: Game){
    game.prevChan = null
    game.prevPres = null
  }

  resetTracker(game: Game){
    game.tracker = 0
  }

  checkHitler(game: Game){
    return game.FascPoliciesEnacted >= 3 && this.getCurrentChan(game).role === Role.HITLER
  }

  libSpyCondition(game: Game){
    //return boolean
    const libSpy = game.players.find(player => player.role === Role.LIB_SPY)
    return game.govs.find(gov => gov.policyPlayed.policy === Policy.FASC && (libSpy.name === gov.pres || libSpy.name === gov.chan)) !== undefined
  }

  findPlayerIngame(game: Game, name: string){
    const player = game.players.find(player => player.name === name)
    if(!player){
      throw new BadRequestException(`${name} is not a player in this game`)
    }
    return player
  }

  numAlivePlayers(game: Game){
    return game.players.reduce((n, player) => player.alive ? n + 1 : n, 0)
  }

  getCurrentPres(game: Game){
    return this.findPlayerIngame(game, game.currentPres)
  }

  getCurrentChan(game: Game){
    return this.findPlayerIngame(game, game.currentChan)
  }
  //likely used later when I want to know what the pres cards were for determining claim, etc
  determinePresCards(cards3: Card[]){
    let blues = 0
    cards3.forEach(card => {
      if(card.policy === Policy.LIB){
        blues++
      }
    })
    const draw = draws3[blues]
    return draw
  }

  buildDeck(deck: Deck){
    for(let i = 0; i < 6; i++){
      deck.drawPile.push({policy: Policy.LIB, color: Color.BLUE })
    }
    for(let i = 0; i < 11; i++){
      deck.drawPile.push({policy: Policy.FASC, color: Color.RED })
    }
  }

  shuffleDeck(deck: Deck){
    deck.drawPile.sort(()=> Math.random() - .5)
    deck.drawPile.sort(()=> Math.random() - .5)
  }

  reshuffle(deck: Deck){
    console.log('reshuffling the deck')
    deck.deckNum++
    deck.drawPile = [...deck.drawPile, ...deck.discardPile]
    deck.discardPile = []
    this.shuffleDeck(deck)
  }

  topDeckCard(deck: Deck){
    // if(deck.drawPile.length < 3){
    //   this.reshuffle(deck)
    // }
    return deck.drawPile.pop()
  }

  draw3(deck: Deck){
    // if(deck.drawPile.length < 3){
    //   this.reshuffle(deck)
    // }
    const card1 = deck.drawPile.pop()
    const card2 = deck.drawPile.pop()
    const card3 = deck.drawPile.pop()
    const top3 = [card1, card2, card3]
    return top3
  }

  inspect3(deck: Deck){
    // if(deck.drawPile.length < 3){
    //   this.reshuffle(deck)
    // }
    const n = deck.drawPile.length
    const card1 = deck.drawPile[n-1]
    const card2 = deck.drawPile[n-2]
    const card3 = deck.drawPile[n-3]
    const top3 = [card1, card2, card3].sort(()=> Math.random() - .5)
    return top3
  }

  removeRed(deck: Deck){
    const redCard = deck.drawPile.find(card => card.policy === Policy.FASC)
    deck.drawPile = deck.drawPile.filter(card => card !== redCard)
    deck.discardPile.push(redCard)
    this.shuffleDeck(deck)
  }

  discard(card: Card, deck: Deck){
    deck.discardPile.push(card)
  }
}