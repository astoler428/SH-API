import { Injectable } from "@nestjs/common";
import { Game } from "../models/game.model";
import { CHAN2, Color, PRES3, Policy, Role, Team, draws2, draws3 } from "../consts";
import { Card } from "../models/card.model";
import { LogicService } from "./logic.service";

@Injectable()
export class DefaultActionService{

  constructor(private logicService: LogicService){}

  defaultPresDiscard(game: Game): Color{
    return Color.BLUE
  }

  defaultChanPlay(game: Game): Color{
    return Color.BLUE

  }

  defaultChanClaim(game: Game): CHAN2{
    return CHAN2.BB


  }

  defaultPresClaim(game: Game): PRES3{
    return PRES3.BBB
  }

  defaultInvClaim(game: Game): Role{
    return Role.LIB
  }

  defaultInspect3Claim(game: Game): PRES3{
    return PRES3.BBB
  }


  determinePresCards(cards3: Card[]){
    // let blues = 0
    // cards3.forEach(card => {
    //   if(card.policy === Policy.LIB){
    //     blues++
    //   }
    // })
    const blues = cards3.reduce((acc, card) => card.policy === Policy.LIB ? acc+1 : acc, 0)
    return draws3[blues]
  }

  determineChanCards(cards2: Card[]){
    // let blues = 0
    // cards2.forEach(card => {
    //   if(card.policy === Policy.LIB){
    //     blues++
    //   }
    // })
    const blues = cards2.reduce((acc, card) => card.policy === Policy.LIB ? acc+1 : acc, 0)
    return draws2[blues]
  }

  lib3Red(game: Game){
    return game.govs.find(gov => {
      const presPlayer = this.logicService.findPlayerIngame(game, gov.pres)
      const presCards = this.determinePresCards(gov.presCards)
      return gov.deckNum === game.deck.deckNum && presPlayer.team === Team.LIB && presCards === PRES3.RRR
    }) !== undefined
  }

  underclaimTotal(game: Game){
    // let underclaimTotal = 0
    // for(const gov of game.govs){
    //   if(gov.deckNum === game.deck.deckNum){
    //     underclaimTotal += gov.underclaim
    //   }
    // }
    // return underclaimTotal
    return game.govs.reduce((acc, gov) => gov.deckNum === game.deck.deckNum ? acc + gov.underclaim : acc, 0)
  }


  isCucu(game: Game){
    return game.invClaims.find(inv => inv.investigator === game.currentChan && inv.investigatee === game.currentPres && inv.claim === Role.LIB) !== undefined
  }

  isAntiDD(game: Game){
    const confsToCurrentPres = game.confs.filter(conf => conf.confee === game.currentPres)
    const confsToCurrentChanAndPres = confsToCurrentPres.filter(conf1 => {
      return game.confs.find(conf2 => conf1.confer === conf2.confer && conf2.confee === game.currentChan) !== undefined
    })
    return confsToCurrentChanAndPres.length > 0
  }

  //this is will there be a power if a red gets played
  isPower(game: Game){
    const redsDown = game.FascPoliciesEnacted
    const numPlayers = game.players.length
    return (numPlayers >= 9) || (numPlayers >= 7 && redsDown >= 1) || (redsDown >= 2)
  }

  invPower(game: Game){
    const redsDown = game.FascPoliciesEnacted
    const numPlayers = game.players.length
    return (numPlayers >= 9 && redsDown <= 1) || (numPlayers >= 7 && redsDown === 1)
  }

  gunPower(game: Game){
    const redsDown = game.FascPoliciesEnacted
    return redsDown === 3 || redsDown === 4
  }

}