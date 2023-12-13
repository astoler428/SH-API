import { Injectable } from "@nestjs/common";
import { Game } from "../models/game.model";
import { CHAN2, Color, Conf, PRES3, Policy, Role, Status, Team, draws2, draws3 } from "../consts";
import { Card } from "../models/card.model";
import { LogicService } from "./logic.service";
import { Player } from "../models/player.model";


@Injectable()
export class DefaultActionService{

  constructor(private logicService: LogicService){}

  defaultPresDiscard(game: Game): Color{
    const currentPresPlayer = this.logicService.getCurrentPres(game)
    const pres3 = this.determine3Cards(game.presCards)
    if(currentPresPlayer.team === Team.LIB){
      return pres3 === PRES3.BBB ? Color.BLUE : Color.RED
    }
    const [fascPresRBBDropProb, fascPresRRBDropProb] = game.settings.simpleBlind ? this.getSimplePresDropProbs(game) : this.getPresDropProbs(game)
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
    const currentPresPlayer = this.logicService.getCurrentPres(game)
    const chan2 = this.determine2Cards(game.chanCards)

    //default vetos
    if(game.FascPoliciesEnacted === 5 && game.status !== Status.VETO_DECLINED){
      if(currentChanPlayer.team === Team.LIB && chan2 === CHAN2.RR){
        return null //no color means veto
      }
      else if(currentChanPlayer.team === Team.FASC && currentPresPlayer.team === Team.FASC && chan2 === CHAN2.BB){
        return null
      }
    }
    if(currentChanPlayer.team === Team.LIB){
      return chan2 === CHAN2.RR ? Color.RED : Color.BLUE
    }
    const fascChanDropProb = game.settings.simpleBlind ? this.getSimpleChanDropProbs(game) : this.getChanDropProbs(game)
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
    const currentChanPlayer = this.logicService.getCurrentChan(game)
    const currentPresPlayer = this.logicService.getCurrentPres(game)
    const chan2 = this.determine2Cards(game.chanCards)
      //lib tells truth
      if(currentChanPlayer.role === Role.LIB){
        return chan2
      }
      //always claim RR on a red play
      if(game.chanPlay.policy === Policy.FASC){
        return CHAN2.RR
      }
      //if chan hitler or pres lib, can't lie together
      if(currentChanPlayer.role === Role.HITLER || currentPresPlayer.team === Team.LIB){
        return chan2
      }
      //chan is vanilla fasc with a fasc pres (could be hitler) and you played a blue - advanced feature to change claim based on blue count and who had drawn 3R
      const [BBUnderclaimProb, RBOverclaimProb] = game.settings.simpleBlind ? this.getSimpleFascFascBlueChanClaim(game, chan2) : this.getFascFascBlueChanClaim(game, chan2)

      if(chan2 === CHAN2.BB){
        return this.testProb(BBUnderclaimProb) ? CHAN2.RB : CHAN2.BB
      }
      else{ //chan2 === CHAN2.RB
        return this.testProb(RBOverclaimProb) ? CHAN2.BB : CHAN2.RB
      }
  }


  defaultPresClaim(game: Game): PRES3{
    const currentChanPlayer = this.logicService.getCurrentChan(game)
    const currentPresPlayer = this.logicService.getCurrentPres(game)
    const pres3 = this.determine3Cards(game.presCards)

    if(currentPresPlayer.team === Team.LIB){
      return pres3
    }

    //fasc pres, lib chan
    if(currentChanPlayer.team === Team.LIB){
      const [fascRRBconfProb, fascBBBunderclaimProb, fascRRRconfProb, fascRRBoverclaimProb, fascRBBoverclaimProb] = game.settings.simpleBlind ? this.getSimplePresClaimWithLibProbs(game) : this.getPresClaimWithLibProbs(game)
      //discarding a B
      if(game.presDiscard.policy === Policy.LIB){
        if(pres3 === PRES3.RRB){
          return this.testProb(fascRRBconfProb) ? PRES3.RRB : PRES3.RRR
        }
        else if(pres3 === PRES3.RBB){
          return PRES3.RRB
        }
        else{ //BBB
          return this.testProb(fascBBBunderclaimProb) ? PRES3.RBB : PRES3.BBB
        }
      }

      //discarding a R
      if(game.presDiscard.policy === Policy.FASC){
        if(pres3 === PRES3.RRR){
          return this.testProb(fascRRRconfProb) ? PRES3.RRB : PRES3.RRR
        }
        else if(pres3 === PRES3.RRB){
          //this case has a risk of failing a hitler / fasc test - you pass the blue, they claim 2, and you decide to claim two to overclaim, you think you are agreeing with them
          //but player hitler testing would have to know they are lib or else they think they got lucky as a fasc...
          return this.testProb(fascRRBoverclaimProb) ? PRES3.RBB : PRES3.RRB
        }
        else{ //RBB
          return this.testProb(fascRBBoverclaimProb) ? PRES3.BBB : PRES3.RBB
        }
      }
    }


    //fasc pres and fasc chan - hitler doesn't matter since chan is signalling
    if(currentChanPlayer.team === Team.FASC){
      const [fascFascConfProb, RBBoverclaimProb] = game.settings.simpleBlind ? this.getSimplePresClaimWithFascProbs(game) : this.getPresClaimWithFascProbs(game)
      if(game.chanClaim === CHAN2.RR){
        return this.testProb(fascFascConfProb) ? PRES3.RRB : PRES3.RRR
      }
      else if(game.chanClaim === CHAN2.RB){
        return PRES3.RRB
      }
      else{ //BB
        return this.testProb(RBBoverclaimProb) ? PRES3.BBB : PRES3.RBB
      }
    }
  }

  defaultInvClaim(game: Game): Team{
    const currentPresPlayer = this.logicService.getCurrentPres(game)
    const investigatedName = currentPresPlayer.investigations.slice(-1)[0]
    const investigatedPlayer = this.logicService.findPlayerIngame(game, investigatedName)
    const fascLieOnInvProb = game.settings.simpleBlind ? this.getSimpleFascLieOnInvProb(game, currentPresPlayer, investigatedPlayer) : this.getFascLieOnInvProb(game, currentPresPlayer, investigatedPlayer)

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
        return this.testProb(BBoverclaimInspect3Prob) ? PRES3.RBB : top3
      }
      else if(top3 === PRES3.BBB){
        return PRES3.RBB
      }
    }
    return top3
  }

  defaultVetoReply(game: Game): boolean{
    const currentPresPlayer = this.logicService.getCurrentPres(game)
    const chan2 = this.determine2Cards(game.chanCards)
    return (currentPresPlayer.team === Team.LIB && chan2 === CHAN2.RR) || (currentPresPlayer.team === Team.FASC && chan2 === CHAN2.BB)
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
    return .9
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
    //edited from just fasc
    if(currentChanPlayer.team === Team.FASC){
      if(!this.isPower(game) && game.LibPoliciesEnacted <= 1){
        vanillaFascPresRBBDropProb = .25
      }
      else{
        vanillaFascPresRBBDropProb = 1
      }
    }

    hitlerPresRBBDropProb = game.LibPoliciesEnacted === 2 ? .9 : game.LibPoliciesEnacted === 3 ? 1 : .6

    //hitler knows the chan is fasc since the person that conflicted hitler also conflicted them, same with cucu
    if((this.isAntiDD(game) && currentChanPlayer.team === Team.FASC) || this.isCucu(game)){
      hitlerPresRBBDropProb = 1
    }


    if(game.LibPoliciesEnacted === 4){
      vanillaFascPresRBBDropProb = 1
      hitlerPresRBBDropProb = 1
    }

    vanillaFascPresRRBDropProb = 1
    if(currentChanPlayer.team === Team.FASC){
      //if chan is not hitler or they are hitler but it's an early blue for no power, always pass blue
      //don't pass in cucu because you were inved lib, think you are lib, you need to drop to show you are fasc
      if((currentChanPlayer.role !== Role.HITLER && !this.isCucu(game)) || (game.LibPoliciesEnacted <= 1 && !this.isPower(game))){
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

    //pass the blue to your fasc chan
    if(this.isAntiDD(game) && currentChanPlayer.team === Team.FASC){
      hitlerPresRRBDropProb = 0
    }

    if(game.FascPoliciesEnacted >= 3){
      //auto win or take gun
      //vanillaFascPresRRBDropProb = 1 already prob 1 unless it's fasc fasc anyway and the chancellor drops with prob 1 in this scenario
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
    const hilterChanDropProbs = [[.2, null, null, null, null],
                                 [.3, .15, null, null, null],
                                 [.7, .4, .3, null, null],
                                 [.85, .75, .5, .25, null], //used to be .1
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
    //vanilla should fail cucu with high prob
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
    return currentChanPlayer.role === Role.HITLER ? hitlerChanDropProb : vanillaFascChanDropProb
  }

  testProb(threshold: number){
    const randomProb = Math.random()
    return randomProb < threshold
  }





  /**
   *
   * underclaim if no underlcaims already or a lib drew 3 red
   * overclaim if too many underclaims or some underclaims but no lib 3 red
   */
  getFascFascBlueChanClaim(game: Game, chan2: CHAN2){
    const underclaimTotal = this.underclaimTotal(game)

    let RBOverclaimProb: number, BBUnderclaimProb: number
    if(chan2 === CHAN2.BB){
      if(underclaimTotal <= -1){
        BBUnderclaimProb = 1
      }
      else if(underclaimTotal <= 1 && this.lib3RedOnThisDeck(game) && !this.fasc3RedOnThisDeck(game)){
        BBUnderclaimProb = .9
      }
      else{
        BBUnderclaimProb = 0
      }
    }
    else{// if(chan2 === CHAN2.RB){
      if(underclaimTotal === 0 && this.blueCount(game) <= 2){
        RBOverclaimProb = .75
      }
      else if(underclaimTotal === 1 && !this.lib3RedOnThisDeck(game)){
        RBOverclaimProb = .9
      }
      else if(underclaimTotal >= 2){
        RBOverclaimProb = 1
      }
      else{
        RBOverclaimProb = 0
      }
    }
    return [BBUnderclaimProb, RBOverclaimProb]
  }

  /**
   *
   * Always change the count to signal
   */
  getSimpleFascFascBlueChanClaim(game: Game, chan2: CHAN2){
    const BBUnderclaimProb = 1
    const RBOverclaimProb = 1
    return [BBUnderclaimProb, RBOverclaimProb]
    // if(chan2 === CHAN2.BB){
    //   return CHAN2.RB
    // }
    // else if(chan2 === CHAN2.RB){
    //   return CHAN2.BB
    // }
    // else{
    //   //chan2 === CHAN2.RR
    //   //THIS SHOULD NEVER HAPPEN
    //   return CHAN2.RR
    // }
  }



/**
 * no fasc fasc conflicts ever
 * vanilla lie on everything, hitler lies for sure when 2 blues are down
 * If double dipping, 50%
 */
  getSimpleFascLieOnInvProb(game: Game, currentPresPlayer: Player, investigatedPlayer: Player){
    let hitlerInvLibLieProbs = [.55, .8, 1, 1, 1] //based on number of blues down
    let fascLieOnInvProb = currentPresPlayer.role === Role.HITLER ? hitlerInvLibLieProbs[game.LibPoliciesEnacted] : 1

    if(investigatedPlayer.team === Team.FASC){
      return 1
    }

    // if(this.doubleDipping(game)){
    //   fascLieOnInvProb = .5
    // }

    return fascLieOnInvProb
  }



/**
 *
 * vanilla drops unless it's fasc fasc and low blue count
 * hitler has same matrix, but doesn't drop in lib cucu (outs) and less likely to drop in fasc fasc cucu (as they look bad)
 */
  getSimpleChanDropProbs(game: Game){
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
    return currentChanPlayer.role === Role.HITLER ? hitlerChanDropProb : vanillaFascChanDropProb
  }


  /**
   *
   * RBB always drop
   * RRB vanilla always drop unless fasc fasc
   * Hitler on RRB has a mix
   */

  getSimplePresDropProbs(game: Game){
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


  getPresClaimWithLibProbs(game: Game){
    const currentPresPlayer = this.logicService.getCurrentPres(game)
    const underclaimTotal = this.underclaimTotal(game)

    const fascBBBunderclaimProb = this.lib3RedOnThisDeck(game) ? 1 : .75            //make this 100% in simple
    const fascRRBoverclaimProb = this.lib3RedOnThisDeck(game) ? 0 : underclaimTotal >= 2 ? .9 : underclaimTotal === 1 ? .25 : 0
    const fascRBBoverclaimProb = this.lib3RedOnThisDeck(game) ? 0 : underclaimTotal >= 2 ? .9 : underclaimTotal === 1 ? .6 : 0

    const fascRRRconfProbs = [.4, .6, .8, 1, 1]  //100% in simple
    let fascRRRconfProb = fascRRRconfProbs[game.LibPoliciesEnacted]                 // make this 100% in simple too

    if(underclaimTotal >= 1 && !this.lib3RedOnThisDeck(game)){
      fascRRRconfProb += .5
    }

    const fascRRBconfProbs = [.75, .85, .95, 1, 1]  //100% in simple
    let fascRRBconfProb = fascRRBconfProbs[game.LibPoliciesEnacted]

    if(this.invPower(game)){
      fascRRBconfProb = .5
    }

    if(game.players.length < 7 || game.players.length === 8){
      fascRRBconfProb = .2
      fascRRRconfProb = .1
    }

    if(currentPresPlayer.role === Role.HITLER){
      fascRRBconfProb = 0
      fascRRRconfProb = 0
    }

    return [fascRRBconfProb, fascBBBunderclaimProb, fascRRRconfProb, fascRRBoverclaimProb, fascRBBoverclaimProb]
  }

  getSimplePresClaimWithLibProbs(game: Game){
    const currentPresPlayer = this.logicService.getCurrentPres(game)
    const underclaimTotal = this.underclaimTotal(game)

    const fascBBBunderclaimProb = 1
    const fascRRBoverclaimProb = this.lib3RedOnThisDeck(game) ? 0 : underclaimTotal >= 2 ? .9 : underclaimTotal === 1 ? .25 : 0
    const fascRBBoverclaimProb = this.lib3RedOnThisDeck(game) ? 0 : underclaimTotal >= 2 ? .9 : underclaimTotal === 1 ? .6 : 0
    let fascRRRconfProb = 1

    let fascRRBconfProb = 1 //know your are fasc, if you don't want to conf, you can choose not to

    if(currentPresPlayer.role === Role.HITLER){
      fascRRBconfProb = 0
      fascRRRconfProb = underclaimTotal >= 2 ? .9 : underclaimTotal === 1 ? .5 : .1
    }

    return [fascRRBconfProb, fascBBBunderclaimProb, fascRRRconfProb, fascRRBoverclaimProb, fascRBBoverclaimProb]
  }

  getPresClaimWithFascProbs(game: Game){
    const currentChanPlayer = this.logicService.getCurrentChan(game)
    const pres3 = this.determine3Cards(game.presCards)
    const underclaimTotal = this.underclaimTotal(game)

    const RBBoverclaimProb = underclaimTotal >= 2 || (underclaimTotal === 1 && !this.lib3RedOnThisDeck(game)) ? .9 : 0
    let fascFascConfProb = 0


    //need to conf if 3 blues underclaimed
    if((pres3 === PRES3.RBB && underclaimTotal >= 1) || (PRES3.RRB && underclaimTotal >= 2)){
      fascFascConfProb = .9
    }

    if(this.isCucu(game) && currentChanPlayer.role === Role.HITLER){
      fascFascConfProb = 0
    }

    //when to conf the cucu
    if(this.isCucu(game) && currentChanPlayer.role !== Role.HITLER){
      if(underclaimTotal + draws3.indexOf(pres3) >= 2){ //basically total underclaim including what's dropped in this deck
        fascFascConfProb = .9
      }
      else if(underclaimTotal + draws3.indexOf(pres3) === 1){
        fascFascConfProb = .4
      }
    }

    if(this.isAntiDD(game)){
      fascFascConfProb = 0
    }

    return [fascFascConfProb, RBBoverclaimProb]
  }

  getSimplePresClaimWithFascProbs(game: Game){
    // const RBBoverclaimProb = 0
    const RBBoverclaimProb = this.underclaimTotal(game) >= 1 ? 1 : 0
    const fascFascConfProb = 0

    return [fascFascConfProb, RBBoverclaimProb]
  }

  /**
   * Helper functions
   */


  determine3Cards(cards3: Card[]){
    const blues = cards3.reduce((acc, card) => card.policy === Policy.LIB ? acc+1 : acc, 0)
    return draws3[blues]
  }

  determine2Cards(cards2: Card[]){
    const blues = cards2.reduce((acc, card) => card.policy === Policy.LIB ? acc+1 : acc, 0)
    return draws2[blues]
  }

  lib3RedOnThisDeck(game: Game){
    return game.govs.some(gov => {
      const presPlayer = this.logicService.findPlayerIngame(game, gov.pres)
      return gov.deckNum === game.deck.deckNum && presPlayer.team === Team.LIB && gov.presClaim === PRES3.RRR
    })
  }

  fasc3RedOnThisDeck(game: Game){
    return game.govs.some(gov => {
      const presPlayer = this.logicService.findPlayerIngame(game, gov.pres)
      return gov.deckNum === game.deck.deckNum && presPlayer.team === Team.FASC && gov.presClaim === PRES3.RRR
    })
  }

  //checks if they have been a 3 red president
  is3Red(game: Game, playerName: string){
    return game.govs.some(gov => gov.pres === playerName && gov.presClaim === PRES3.RRR)
  }

  underclaimTotal(game: Game){
    return game.govs.reduce((acc, gov) => gov.deckNum === game.deck.deckNum ? acc + gov.underclaim : acc, 0)
  }

  blueCount(game: Game){
    return game.govs.reduce((acc, gov) => gov.deckNum === game.deck.deckNum ? acc + draws3.indexOf(gov.presClaim) : acc, 0)
  }

  isCucu(game: Game){
    return game.invClaims.some(inv => inv.investigator === game.currentChan && inv.investigatee === game.currentPres && inv.claim === Team.LIB)
  }

  isAntiDD(game: Game){
    const confsToCurrentPres = game.confs.filter(conf => conf.confee === game.currentPres)
    const confsToCurrentChanAndPres = confsToCurrentPres.some(conf1 => game.confs.some(conf2 => conf1.confer === conf2.confer && conf2.confee === game.currentChan)
    )
    return confsToCurrentChanAndPres
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
    return game.confs.some(conf => conf.confer === game.currentPres && conf.confee === game.currentChan && conf.type === Conf.POLICY)
  }

}