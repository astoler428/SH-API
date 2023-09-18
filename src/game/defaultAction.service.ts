import { Injectable } from "@nestjs/common";
import { Game } from "../models/game.model";
import { CHAN2, Color, Conf, PRES3, Policy, Role, Team, draws2, draws3 } from "../consts";
import { Card } from "../models/card.model";
import { LogicService } from "./logic.service";
import { ProbabilityService } from "./probability.service";
import { Player } from "../models/player.model";


@Injectable()
export class DefaultActionService{

  constructor(private logicService: LogicService){}

  defaultPresDiscard(game: Game): Color{
    const currentPresPlayer = this.logicService.getCurrentPres(game)
    if(currentPresPlayer.team === Team.LIB){
      return game.presCards.some(card => card.policy === Policy.FASC) ? Color.RED : Color.BLUE
    }
    const pres3 = this.determine3Cards(game.presCards)
    const [fascPresRBBDropProb, fascPresRRBDropProb] = this.getPresDropProbs(game)
    if(pres3 === PRES3.BBB){
      return Color.BLUE
    }
    else if(pres3 === PRES3.RBB){
      return this.testProb(fascPresRBBDropProb) ? Color.BLUE : Color.RED
    }
    else if(pres3 === PRES3.RRB){
      return this.testProb(fascPresRRBDropProb) ? Color.BLUE : Color.RED
    }
    else{ //RRR
      return Color.RED
    }
  }

  defaultChanPlay(game: Game): Color{
    const currentChanPlayer = this.logicService.getCurrentChan(game)
    if(currentChanPlayer.team === Team.LIB){
      return game.chanCards.some(card => card.policy === Policy.LIB) ? Color.BLUE : Color.RED
    }
    const chan2 = this.determine2Cards(game.chanCards)
    const fascChanDropProb = this.getChanDropProbs(game)

    if(chan2 === CHAN2.BB){
      return Color.BLUE
    }
    else if(chan2 === CHAN2.RB){
      return this.testProb(fascChanDropProb) ? Color.RED : Color.BLUE
    }
    else{ //RR
      return Color.RED
    }
  }

  defaultChanClaim(game: Game): CHAN2{
    return CHAN2.BB
  }

  defaultPresClaim(game: Game): PRES3{
    return PRES3.BBB
  }


  defaultInvClaim(game: Game): Team{
    const currentPresPlayer = this.logicService.getCurrentPres(game)
    const investigatedName = currentPresPlayer.investigations.slice(-1)[0]
    const investigatedPlayer = this.logicService.findPlayerIngame(game, investigatedName)
    const fascLieOnInvProb = this.getFascLieOnInvProb(game, currentPresPlayer, investigatedPlayer)

    if(currentPresPlayer.team === Team.FASC && this.testProb(fascLieOnInvProb)){
      return investigatedPlayer.team === Team.FASC ? Team.LIB : Team.FASC
    }
    else{
      return investigatedPlayer.team
    }
  }

  /**
   * truth unless it's 1 or 0 blues and enough underclaims for RBB to be believable as outing on 2 topDecks is worth it
   * also unlikely BBB should be RBB to avoid auto 3 topdecks
   */

  defaultInspect3Claim(game: Game): PRES3{
    const top3Cards = this.logicService.inspect3(game.deck)
    const top3 = this.determine3Cards(top3Cards)
    const BBoverclaimInspect3Prob = this.getBBoverClaimInspect3Prob()
    const currentPresPlayer = this.logicService.getCurrentPres(game)
    if(currentPresPlayer.team === Team.FASC){
      if(top3 === PRES3.RRR && this.underclaimTotal(game) >= 2 || top3 === PRES3.RRB && this.underclaimTotal(game) >= 1){
        console.log(this.testProb(BBoverclaimInspect3Prob))
        return this.testProb(BBoverclaimInspect3Prob) ? PRES3.RBB : top3
      }
      else if(top3 === PRES3.BBB){
        return PRES3.RBB
      }
    }
    return top3
  }

  determine3Cards(cards3: Card[]){
    const blues = cards3.reduce((acc, card) => card.policy === Policy.LIB ? acc+1 : acc, 0)
    return draws3[blues]
  }

  determine2Cards(cards2: Card[]){
    const blues = cards2.reduce((acc, card) => card.policy === Policy.LIB ? acc+1 : acc, 0)
    return draws2[blues]
  }

  lib3RedOnThisDeck(game: Game){
    return game.govs.find(gov => {
      const presPlayer = this.logicService.findPlayerIngame(game, gov.pres)
      return gov.deckNum === game.deck.deckNum && presPlayer.team === Team.LIB && gov.presClaim === PRES3.RRR
    }) !== undefined
  }

  //checks if they have been a 3 red president
  is3Red(game: Game, playerName: string){
    return game.govs.find(gov => gov.pres === playerName && gov.presClaim === PRES3.RRR) !== undefined
  }

  underclaimTotal(game: Game){
    return game.govs.reduce((acc, gov) => gov.deckNum === game.deck.deckNum ? acc + gov.underclaim : acc, 0)
  }


  isCucu(game: Game){
    return game.invClaims.find(inv => inv.investigator === game.currentChan && inv.investigatee === game.currentPres && inv.claim === Team.LIB) !== undefined
  }

  isAntiDD(game: Game){
    const confsToCurrentPres = game.confs.filter(conf => conf.confee === game.currentPres)
    const confsToCurrentChanAndPres = confsToCurrentPres.find(conf1 => game.confs.find(conf2 => conf1.confer === conf2.confer && conf2.confee === game.currentChan) !== undefined
    )
    return confsToCurrentChanAndPres !== undefined
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

  //already assumes conditions are met of fasc player who is in the middle of investigating
  doubleDipping(game: Game){
    return game.confs.find(conf => conf.confer === game.currentPres && conf.confee === game.currentChan && conf.type === Conf.POLICY) !== undefined
  }

  //prob calculators


    /**
   * lies based on probabilities that account for hitler vs vanilla and number of blues down
   * If double dipping and inv a lib - 50%
   * If inv a fasc and low blue count and you are 3 red - 40% conf to look bad
   */
  getFascLieOnInvProb(game: Game, currentPresPlayer: Player, investigatedPlayer: Player){
    let fascLieOnInvProb: number
    let vanillaFascInvLibLieProbs = [.85, .95, 1, 1, 1] //based on number of blues down
    let hitlerInvLibLieProbs = [.55, .65, .75, .85, 1] //based on number of blues down

    if(investigatedPlayer.team === Team.FASC){
      //create a fasc fasc conf 40% of the time if you look super bad as a 3 red with underclaim
      fascLieOnInvProb = this.underclaimTotal(game) >= 2 && this.is3Red(game, game.currentPres) ? .6 : 1
      return fascLieOnInvProb
    }

    fascLieOnInvProb = currentPresPlayer.role === Role.HITLER ? hitlerInvLibLieProbs[game.LibPoliciesEnacted] : vanillaFascInvLibLieProbs[game.LibPoliciesEnacted]

    if(this.doubleDipping(game)){
      fascLieOnInvProb = .5
    }
    return fascLieOnInvProb
  }

  getBBoverClaimInspect3Prob(){
    return .7
  }


  /**
   *
   * vanilla RBB drop:
   *  .5 unless lib drawn 3 red, then .8
   *  1 if 4 blues played (avoid auto loss)
   *  1 if chan is fasc - offer double drop (on the player to force manually if it looks bad to drop as a fasc)
   * Hitler RBB drop:
   * .6
   * .9 if 2 blues down in case chan is fasc
   * 1 if 3 blues down to hope chan is fasc (on player to manually force if it looks bad to drop)
   * 1 if 4 blues down
   *
   * vanilla RRB drop:
   * 1 unless fasc fasc
   *  0 with vanilla chan (they can drop)
   *  0 with early hitler and no power
   *  .4 with medium hitler and no power
   *
   * Hitler RRB drop:
   * matrix based on blues played and powers
   *
   * Both always take the gun or auto win
   */
  getPresDropProbs(game: Game){
    const currentPresPlayer = this.logicService.getCurrentPres(game)
    const currentChanPlayer = this.logicService.getCurrentChan(game)
    const bluesPlayedByPres = currentPresPlayer.bluesPlayed

    let vanillaFascPresRBBDropProb: number, hitlerPresRBBDropProb: number, vanillaFascPresRRBDropProb: number, hitlerPresRRBDropProb: number

    vanillaFascPresRBBDropProb = .5
    if(this.lib3RedOnThisDeck(game)){
      vanillaFascPresRBBDropProb = .9
    }
    if(currentChanPlayer.team === Team.FASC){
      vanillaFascPresRBBDropProb = 1
    }

    hitlerPresRBBDropProb = game.LibPoliciesEnacted === 2 ? .9 : game.LibPoliciesEnacted === 3 ? 1 : .6


    if(game.LibPoliciesEnacted === 4){
      vanillaFascPresRBBDropProb = 1
      hitlerPresRBBDropProb = 1
    }

    vanillaFascPresRRBDropProb = 1
    if(currentChanPlayer.team === Team.FASC){
      //if chan is not hitler or they are hitler but it's an early blue for no power, always pass blue
      if(currentChanPlayer.role !== Role.HITLER || (game.LibPoliciesEnacted <= 1 && !this.isPower(game))){
        vanillaFascPresRRBDropProb = 0
      }
      else if(game.LibPoliciesEnacted <= 3 && !this.isPower(game)){
        //chan is hitler and 2 or 3 blues down, .6 pass the blue because hitler dropping allows them to confirm they are hitler and you are their fasc
        vanillaFascPresRRBDropProb = .4
      }
    }

    const ifPower = this.isPower(game) ? .3 : 0

    const hitlerPresRRBDropProbs = [[.25, null, null, null, null],
                                    [.4, .3, null, null, null],
                                    [.9 + ifPower, .5 + ifPower, .7 + ifPower, null, null],
                                    [1, 1, 1, 1, null],
                                    [1, 1, 1, 1, 1]]

    hitlerPresRRBDropProb = hitlerPresRRBDropProbs[game.LibPoliciesEnacted][bluesPlayedByPres]

    if(game.FascPoliciesEnacted >= 3){
      //auto win or take gun
      vanillaFascPresRRBDropProb = 1
      hitlerPresRRBDropProb = 1
    }
    const RBBDropProb = currentPresPlayer.role === Role.HITLER ? hitlerPresRBBDropProb : vanillaFascPresRBBDropProb
    const RRBDropProb = currentPresPlayer.role === Role.HITLER ? hitlerPresRRBDropProb: vanillaFascPresRRBDropProb
    return [RBBDropProb, RRBDropProb]
  }

  /**
   *
   * Vanilla:
   * matrix mostly dropping
   * if fasc pres - for sure drop to give power (designed where pres will pass a blue assuming you will drop it)
   * if no power and 0 or 1 blues down, .15 drop for credit
   * if 0 or 1 blues down and pres is on inv - less likely to give it (varies in number of players)
   * cucu variations and ensure win or avoid loss
   */
  getChanDropProbs(game: Game){
    const currentPresPlayer = this.logicService.getCurrentPres(game)
    const currentChanPlayer = this.logicService.getCurrentChan(game)
    const bluesPlayedByChan = currentChanPlayer.bluesPlayed
    let vanillaFascChanDropProb: number, hitlerChanDropProb: number

    //hilterChanDropProbs[blues on board][blues played by chan already]
    const hilterChanDropProbs = [[.25, null, null, null, null],
                                 [.3, .15, null, null, null],
                                 [.7, .4, .3, null, null],
                                 [.85, .75, .5, .1, null],
                                 [1, 1, 1, 1, 1]]

    const vanillaFascChanDropProbs = [[.75, null, null, null, null],
                                      [.85, .85, null, null, null],
                                      [.9, .9, .9, null, null],
                                      [.95, .95, .95, .95, null],
                                      [1, 1, 1, 1, 1]]

    hitlerChanDropProb = hilterChanDropProbs[game.LibPoliciesEnacted][bluesPlayedByChan]
    vanillaFascChanDropProb = vanillaFascChanDropProbs[game.LibPoliciesEnacted][bluesPlayedByChan]

    //fasc fasc and power - drop, otherwise play blue
    if(currentPresPlayer.team === Team.FASC){
      if(this.isPower(game)){
        vanillaFascChanDropProb = 1
      }
      else if(game.LibPoliciesEnacted <= 1){
        vanillaFascChanDropProb = .15
      }
    }
    else{
      //less likely to give inv
      if(game.LibPoliciesEnacted <= 1 && this.invPower(game)){
        vanillaFascChanDropProb = game.players.length <= 8 ? .3 : .65  //in 9 and 10, more likely to give inv
      }
    }
    //vanilla should fail cucu with hihg prob
    //cucu
    if(this.isCucu(game)){
      if(currentPresPlayer.team === Team.LIB){
        hitlerChanDropProb = 0 //don't out
        //vanillaFascDrop prob is pretty much the same - high
      }
      else{
        //fasc fasc cucu - you already know you are fasc since you inved a fasc as lib...but you don't know if you are hitler
        if(game.FascPoliciesEnacted >= 3 || game.LibPoliciesEnacted >= 3){
          vanillaFascChanDropProb = 1
          hitlerChanDropProb = 1
        }
        else{
          hitlerChanDropProb = .3   //chan looks terrible if cucu fails
          vanillaFascChanDropProb = .5  //random in this stage
        }
      }
    }

    //antiDD
    //honestly nothing different - don't really pass it

    if(game.LibPoliciesEnacted === 4 || game.FascPoliciesEnacted === 5){
      hitlerChanDropProb = 1
      vanillaFascChanDropProb = 1
    }
    return currentPresPlayer.role === Role.HITLER ? hitlerChanDropProb : vanillaFascChanDropProb
  }

  testProb(threshold: number){
    const randomProb = Math.random()
    return randomProb < threshold
  }







/**
 *
 * vanilla drops unless it's fasc fasc and low blue count
 * hitler has same matrix, but doesn't drop in lib cucu (outs) and less likely to drop in fasc fasc cucu (as they look bad)
 */
  getLessSmartChanDropProbs(game: Game){
    const currentPresPlayer = this.logicService.getCurrentPres(game)
    const currentChanPlayer = this.logicService.getCurrentChan(game)
    const bluesPlayedByChan = currentChanPlayer.bluesPlayed
    let vanillaFascChanDropProb: number, hitlerChanDropProb: number

    //hilterChanDropProbs[blues on board][blues played by chan already]
    const hilterChanDropProbs = [[.25, null, null, null, null],
                                 [.3, .15, null, null, null],
                                 [.7, .4, .3, null, null],
                                 [.85, .75, .5, .1, null],
                                 [1, 1, 1, 1, 1]]


    hitlerChanDropProb = hilterChanDropProbs[game.LibPoliciesEnacted][bluesPlayedByChan]
    vanillaFascChanDropProb = 1

    //fasc fasc and low blue - play blue
    if(currentPresPlayer.team === Team.FASC && game.LibPoliciesEnacted <= 1){
      vanillaFascChanDropProb = .15
    }
    if(this.isCucu(game)){
      if(currentPresPlayer.team === Team.LIB){
        hitlerChanDropProb = 0 //don't out
        //vanillaFascDrop prob is pretty much the same - high
      }
      else{
        //fasc fasc cucu - you already know you are fasc since you inved a fasc as lib...but you don't know if you are hitler
        if(game.FascPoliciesEnacted >= 3 || game.LibPoliciesEnacted >= 3){
          vanillaFascChanDropProb = 1
          hitlerChanDropProb = 1
        }
        else{
          hitlerChanDropProb = .3   //chan looks terrible if cucu fails
          vanillaFascChanDropProb = 1
        }
      }
    }

    if(game.LibPoliciesEnacted === 4 || game.FascPoliciesEnacted === 5){
      hitlerChanDropProb = 1
      vanillaFascChanDropProb = 1
    }
    return currentPresPlayer.role === Role.HITLER ? hitlerChanDropProb : vanillaFascChanDropProb
  }


  /**
   *
   * RBB always drop
   * RRB vanilla always drop unless fasc fasc
   * Hitler on RRB has a mix
   */

  getLessSmartPresDropProbs(game: Game){
    const currentPresPlayer = this.logicService.getCurrentPres(game)
    const currentChanPlayer = this.logicService.getCurrentChan(game)
    const bluesPlayedByPres = currentPresPlayer.bluesPlayed

    let vanillaFascPresRBBDropProb: number, hitlerPresRBBDropProb: number, vanillaFascPresRRBDropProb: number, hitlerPresRRBDropProb: number

    vanillaFascPresRBBDropProb = 1
    hitlerPresRBBDropProb = 1

    vanillaFascPresRRBDropProb = 1
    if(currentChanPlayer.team === Team.FASC){
      //if chan is not hitler or they are hitler but it's an early blue for no power, always pass blue
      if(currentChanPlayer.role !== Role.HITLER || (game.LibPoliciesEnacted <= 1 && !this.isPower(game))){
        vanillaFascPresRRBDropProb = 0
      }
      else if(game.LibPoliciesEnacted <= 3 && !this.isPower(game)){
        //chan is hitler and 2 or 3 blues down, .6 pass the blue because hitler dropping allows them to confirm they are hitler and you are their fasc
        vanillaFascPresRRBDropProb = .4
      }
    }

    const ifPower = this.isPower(game) ? .3 : 0

    const hitlerPresRRBDropProbs = [[.25, null, null, null, null],
                                    [.4, .3, null, null, null],
                                    [.9 + ifPower, .5 + ifPower, .7 + ifPower, null, null],
                                    [1, 1, 1, 1, null],
                                    [1, 1, 1, 1, 1]]

    hitlerPresRRBDropProb = hitlerPresRRBDropProbs[game.LibPoliciesEnacted][bluesPlayedByPres]

    if(game.FascPoliciesEnacted >= 3){
      //auto win or take gun
      vanillaFascPresRRBDropProb = 1
      hitlerPresRRBDropProb = 1
    }
    const RBBDropProb = currentPresPlayer.role === Role.HITLER ? hitlerPresRBBDropProb : vanillaFascPresRBBDropProb
    const RRBDropProb = currentPresPlayer.role === Role.HITLER ? hitlerPresRRBDropProb: vanillaFascPresRRBDropProb
    return [RBBDropProb, RRBDropProb]

  }

}