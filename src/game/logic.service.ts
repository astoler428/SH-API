import { BadRequestException, Injectable } from "@nestjs/common";
import { CHAN2, Conf, PRES3, Policy, Role, Status, Vote, draws2, draws3 } from "../consts";
import { Game } from "../models/game.model";
import { Player } from "../models/player.model";
import { Card } from "src/models/card.model";

@Injectable()
export class LogicService{

  startGame(game: Game){
    game.status = Status.CHOOSE_CHAN
    this.initPlayers(game)
    game.alivePlayers = [...game.players]
    game.currentPres = game.players[game.presIdx]
  }

  initPlayers(game: Game){
    game.players.sort(() => Math.random() - .5)
    let i = 0
    for(; i < game.players.length / 2 - 1; i++){
      game.players[i].role = Role.FASC
    }
    game.players[0].hitler = true
    game.players[1].omniFasc = true
    for(; i < game.players.length; i++){
      game.players[i].role = Role.LIB
    }
    game.players.sort(() => Math.random() - .5)
  }

  chooseChan(game: Game, chanName: string){
    const chanPlayer = this.findPlayerIngame(game, chanName)
    game.currentChan = chanPlayer
    this.resetVotes(game)
    game.log.push(`${game.currentPres.name} chooses ${chanName} as chancellor.`)
    game.status = Status.VOTE
  }

  vote(game: Game, name: string, vote: Vote){
    const player = this.findPlayerIngame(game, name)
    if(player.vote !== vote){
      player.vote = vote
    }
    else{
      player.vote = undefined
    }
    this.countVotes(game)

  }

  presDiscard(game: Game, cardColor: string){
    game.presDiscard = game.presCards.find(card => card.color === cardColor)
    game.chanCards = game.presCards.filter(card => card !== game.presDiscard)
    game.deck.discard(game.presDiscard)
    game.status = Status.CHAN_PLAY
  }

  //need to handle VETO IN HERE
  chanPlay(game: Game, cardColor: string){
    game.chanPlay = game.chanCards.find(card => card.color === cardColor)
    const chanDiscard = game.chanCards.find(card => card !== game.chanPlay)
    game.deck.discard(chanDiscard)
    this.enactPolicy(game, game.chanPlay, false)
  }

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


  countVotes(game: Game){
    let votes = 0
    game.players.forEach(player => player.vote ? votes++ : '')
    if(game.alivePlayers.length === votes){
      game.status = Status.VOTE_RESULT
    }
  }

  determineResultofVote(game: Game){
    let jas = 0
    game.players.forEach(player => player.vote === Vote.JA ? jas++ : '')

    if(jas > game.alivePlayers.length / 2){
      if(this.checkHitler(game)){
        game.log.push(`${game.currentChan.name} is Hitler. Fascists win!`)
        game.status === Status.END_FASC
      }
      else{
        this.presDraw3(game)
        game.status = Status.PRES_DISCARD
      }
    }
    else{
      //vote didn't pass
      game.log.push(`Vote does not pass.`)
      this.advanceTracker(game)
    }
  }

  presDraw3(game: Game){
    game.presCards = game.deck.draw3()
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
    game.presIdx = (game.presIdx + 1) % game.alivePlayers.length
    game.currentPres = game.alivePlayers[game.presIdx]
    game.currentChan = undefined
    game.status = Status.CHOOSE_CHAN
  }

  resetVotes(game: Game){
    for(const player of game.players){
      player.vote = undefined
    }
  }

  gameOver(game: Game){
    return game.status === Status.END_FASC || game.status === Status.END_LIB
  }

  topDeck(game: Game){
    const card = game.deck.topDeck()

    //enacting policy always resets tracker
    this.enactPolicy(game, card, true)
    this.removePrevLocks(game)
  }

  enactPolicy(game: Game, card: Card, topDeck: boolean){
    game.log.push(`${topDeck ? 'Topdecking. ' : ' '} A ${card.policy} policy is enacted.`)
    if(card.policy === Policy.LIB){
      game.LibPoliciesEnacted++
      if(game.LibPoliciesEnacted === 5){
        game.status === Status.END_LIB
        game.log.push(`Liberals win!`)
      }
    }
    else{
      game.FascPoliciesEnacted++
      if(game.FascPoliciesEnacted === 6){
        game.status === Status.END_FASC
        game.log.push(`Fascists win!`)
      }
    }
    if(!topDeck){
      game.status = Status.CHAN_CLAIM
    }
    this.resetTracker(game)
  }

  presClaim(game: Game, claim: PRES3){
    game.presClaim = claim
    game.log.push(`${game.currentPres.name} claims ${game.presClaim}`)
    this.addGov(game)
    this.determinePolicyConf(game)
    if(!this.gameOver(game)){
      this.setPrevLocks(game) //only time locks won't be set here is if a veto occurs
     this.determineNextStatus(game)
    }
  }

  addGov(game: Game){
    game.govs.push({
      deckNum: game.deck.deckNum,
      pres: game.currentPres,
      chan: game.currentChan,
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
    let bluesDrawn = 0
    game.presCards.forEach(card => card.policy === Policy.LIB ? bluesDrawn++ : '' )
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
        game.top3 = game.deck.inspect3()
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
    game.prevPres = game.alivePlayers.length > 5 ? game.currentPres : undefined
  }

  chanClaim(game: Game, claim: CHAN2){
    game.chanClaim = claim
    game.log.push(`${game.currentChan.name} claims ${game.chanClaim}`)
    game.status = Status.PRES_CLAIM
  }

  chooseInv(game: Game, invName: string){
    const invPlayer = this.findPlayerIngame(game, invName)
    invPlayer.investigated = true
    game.currentPres.investigations.push(invPlayer)
    game.status = Status.INV_CLAIM
  }

  invClaim(game: Game, claim: Role){
    const investigatee = game.currentPres.investigations.slice(-1)[0]
    game.log.push(`${game.currentPres.name} claims ${investigatee.name} is a ${claim}`)
    game.invClaims.push({investigator: game.currentPres, investigatee, claim })
    this.determineInvConf(game, claim)
    this.nextPres(game)
  }

  determineInvConf(game: Game, claim: Role){
    if(claim === Role.FASC){
      game.confs.push({confer: game.currentPres, confee: game.currentPres.investigations.slice(-1)[0], type: Conf.INV})
    }
  }

  chooseSE(game: Game, seName: string){
    const sePlayer = this.findPlayerIngame(game, seName)
    game.log.push(`${game.currentPres.name} special elects ${seName}`)

    game.currentPres = sePlayer
    game.status = Status.CHOOSE_CHAN
  }

  shootPlayer(game: Game, shotName: string){
    game.log.push(`${game.currentPres.name} shoots ${shotName}.`)

    const shotPlayer = this.findPlayerIngame(game, shotName)
    game.alivePlayers = game.alivePlayers.filter(player => player !== shotPlayer)
    if(shotPlayer.hitler){
      game.status = Status.END_LIB
      game.log.push(`${shotName} as Hitler. Liberals win!`)
    }
    else{
      this.nextPres(game)
    }
  }

  vetoRequest(game: Game){
    game.status = Status.VETO_REQUEST
    game.log.push(`${game.currentChan.name} requests a veto.`)
  }

  vetoReply(game: Game, vetoAccepted: boolean){
    if(vetoAccepted){
      game.log.push(`${game.currentPres.name} agrees to a veto.`)
      game.chanCards.forEach(card => game.deck.discard(card))
      this.setPrevLocks(game)
      this.advanceTracker(game)
    }
    else{
      game.log.push(`${game.currentPres.name} declines a veto.`)
      game.status = Status.VETO_DECLINED
    }
  }

  inspect3Claim(game: Game, claim: PRES3){
    //do something with the claim
    this.nextPres(game)
  }


  removePrevLocks(game: Game){
    game.prevChan = undefined
    game.prevPres = undefined
  }

  resetTracker(game: Game){
    game.tracker = 0
  }

  checkHitler(game: Game){
    return game.FascPoliciesEnacted >= 3 && game.currentChan.hitler
  }

  findPlayerIngame(game: Game, name: string){
    const player = game.alivePlayers.find(player => player.name === name)
    if(!player){
      throw new BadRequestException(`${name} is not a player in this game`)
    }
    return player
  }
}