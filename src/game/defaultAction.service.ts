import { Injectable } from '@nestjs/common';
import { Game } from '../models/game.model';
import {
  CHAN2,
  Color,
  Conf,
  DefaultAction,
  PRES3,
  Policy,
  Role,
  Status,
  Team,
  draws2,
  draws3,
} from '../consts';
import { Card } from '../models/card.model';
import { LogicService } from './logic.service';
import { Player } from '../models/player.model';
import { log } from 'console';

@Injectable()
export class DefaultActionService {
  constructor(private logicService: LogicService) {}

  defaultPresDiscard(game: Game): Color {
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const pres3 = this.determine3Cards(game.presCards);
    if (currentPresPlayer.team === Team.LIB) {
      return pres3 === PRES3.BBB ? Color.BLUE : Color.RED;
    }
    const [fascPresRBBDropProb, fascPresRRBDropProb] = game.settings.simpleBlind
      ? this.getSimplePresDropProbs(game)
      : this.getPresDropProbs(game);
    if (pres3 === PRES3.BBB) {
      return Color.BLUE;
    } else if (pres3 === PRES3.RBB) {
      return this.testProb(
        fascPresRBBDropProb,
        game,
        currentPresPlayer.name,
        DefaultAction.PRES_DISCARD,
        'fascPresRBBDropProb',
      )
        ? Color.BLUE
        : Color.RED;
    } else if (pres3 === PRES3.RRB) {
      return this.testProb(
        fascPresRRBDropProb,
        game,
        currentPresPlayer.name,
        DefaultAction.PRES_DISCARD,
        'fascPresRRBDropProb',
      )
        ? Color.BLUE
        : Color.RED;
    } else {
      //RRR
      return Color.RED;
    }
  }

  defaultChanPlay(game: Game): Color {
    const currentChanPlayer = this.logicService.getCurrentChan(game);
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const chan2 = this.determine2Cards(game.chanCards);

    //default vetos
    if (
      game.FascPoliciesEnacted === 5 &&
      game.status !== Status.VETO_DECLINED
    ) {
      if (currentChanPlayer.team === Team.LIB && chan2 === CHAN2.RR) {
        return null; //no color means veto
      } else if (
        currentChanPlayer.team === Team.FASC &&
        currentPresPlayer.team === Team.FASC &&
        chan2 === CHAN2.BB
      ) {
        return null;
      }
    }
    if (currentChanPlayer.team === Team.LIB) {
      return chan2 === CHAN2.RR ? Color.RED : Color.BLUE;
    }
    const fascChanDropProb = game.settings.simpleBlind
      ? this.getSimpleChanDropProbs(game)
      : this.getChanDropProbs(game);
    if (chan2 === CHAN2.BB) {
      return Color.BLUE;
    } else if (chan2 === CHAN2.RB) {
      return this.testProb(
        fascChanDropProb,
        game,
        currentChanPlayer.name,
        DefaultAction.CHAN_PLAY,
        'fascChanDropProb',
      )
        ? Color.RED
        : Color.BLUE;
    } else {
      //RR
      return Color.RED;
    }
  }

  defaultChanClaim(game: Game): CHAN2 {
    const currentChanPlayer = this.logicService.getCurrentChan(game);
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const chan2 = this.determine2Cards(game.chanCards);
    //lib tells truth
    if (currentChanPlayer.role === Role.LIB) {
      return chan2;
    }
    //always claim RR on a red play
    if (game.chanPlay.policy === Policy.FASC) {
      return CHAN2.RR;
    }
    //if chan hitler or pres lib, can't lie together
    if (
      currentChanPlayer.role === Role.HITLER ||
      currentPresPlayer.team === Team.LIB
    ) {
      return chan2;
    }
    //chan is vanilla fasc with a fasc pres (could be hitler) and you played a blue - advanced feature to change claim based on blue count and who had drawn 3R
    const [BBUnderclaimProb, RBOverclaimProb] = game.settings.simpleBlind
      ? this.getSimpleFascFascBlueChanClaim(game, chan2)
      : this.getFascFascBlueChanClaim(game, chan2);

    if (chan2 === CHAN2.BB) {
      return this.testProb(
        BBUnderclaimProb,
        game,
        currentChanPlayer.name,
        DefaultAction.CHAN_CLAIM,
        'BBUnderclaimProb',
      )
        ? CHAN2.RB
        : CHAN2.BB;
    } else {
      //chan2 === CHAN2.RB
      return this.testProb(
        RBOverclaimProb,
        game,
        currentChanPlayer.name,
        DefaultAction.CHAN_CLAIM,
        'RBOverclaimProb',
      )
        ? CHAN2.BB
        : CHAN2.RB;
    }
  }

  defaultPresClaim(game: Game): PRES3 {
    const currentChanPlayer = this.logicService.getCurrentChan(game);
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const pres3 = this.determine3Cards(game.presCards);

    if (currentPresPlayer.team === Team.LIB) {
      return pres3;
    }

    //fasc pres, lib chan
    if (currentChanPlayer.team === Team.LIB) {
      const [
        fascRRBconfProb,
        fascBBBunderclaimProb,
        fascRRRconfProb,
        fascRRBoverclaimProb,
        fascRBBoverclaimProb,
      ] = game.settings.simpleBlind
        ? this.getSimplePresClaimWithLibProbs(game)
        : this.getPresClaimWithLibProbs(game);
      //discarding a B
      if (game.presDiscard.policy === Policy.LIB) {
        if (pres3 === PRES3.RRB) {
          return this.testProb(
            fascRRBconfProb,
            game,
            currentPresPlayer.name,
            DefaultAction.PRES_CLAIM,
            'fascRRBconfProb',
          )
            ? PRES3.RRB
            : PRES3.RRR;
        } else if (pres3 === PRES3.RBB) {
          //passing RRB to a lib - no fasc will agree if they test with BB
          return PRES3.RRB;
        } else {
          //BBB
          //passing RBB to a lib - no fasc will agree if they test with RB
          return this.testProb(
            fascBBBunderclaimProb,
            game,
            currentPresPlayer.name,
            DefaultAction.PRES_CLAIM,
            'fascBBBunderclaimProb',
          )
            ? PRES3.RBB
            : PRES3.BBB;
        }
      }

      //discarding a R
      if (game.presDiscard.policy === Policy.FASC) {
        if (pres3 === PRES3.RRR) {
          return this.testProb(
            fascRRRconfProb,
            game,
            currentPresPlayer.name,
            DefaultAction.PRES_CLAIM,
            'fascRRRconfProb',
          )
            ? PRES3.RRB
            : PRES3.RRR;
        } else if (pres3 === PRES3.RRB) {
          //UPDATE: this prob is set to 0, so it will never happen
          //this case has a risk of failing a hitler / fasc test - you pass the blue, they claim 2, and you decide to claim two to overclaim, you think you are agreeing with them
          //but player hitler testing would have to know they are lib or else they think they got lucky as a fasc...
          return this.testProb(
            fascRRBoverclaimProb,
            game,
            currentPresPlayer.name,
            DefaultAction.PRES_CLAIM,
            'fascRRBoverclaimProb',
          )
            ? PRES3.RBB
            : PRES3.RRB;
        } else {
          //RBB
          return this.testProb(
            fascRBBoverclaimProb,
            game,
            currentPresPlayer.name,
            DefaultAction.PRES_CLAIM,
            'fascRBBoverclaimProb',
          )
            ? PRES3.BBB
            : PRES3.RBB;
        }
      }
    }

    //fasc pres and fasc chan - hitler doesn't matter since chan is signalling
    //except in case of giving RR, then whether to conf or not
    if (currentChanPlayer.team === Team.FASC) {
      const [fascFascConfProb, RBBoverclaimProb] = game.settings.simpleBlind
        ? this.getSimplePresClaimWithFascProbs(game)
        : this.getPresClaimWithFascProbs(game);
      if (game.chanClaim === CHAN2.RR) {
        return this.testProb(
          fascFascConfProb,
          game,
          currentPresPlayer.name,
          DefaultAction.PRES_CLAIM,
          'fascFascConfProb',
        )
          ? PRES3.RRB
          : PRES3.RRR;
      } else if (game.chanClaim === CHAN2.RB) {
        return PRES3.RRB;
      } else {
        //BB
        return this.testProb(
          RBBoverclaimProb,
          game,
          currentPresPlayer.name,
          DefaultAction.PRES_CLAIM,
          'RBBoverclaimProb',
        )
          ? PRES3.BBB
          : PRES3.RBB;
      }
    }
  }

  defaultInvClaim(game: Game): Team {
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const investigatedName = currentPresPlayer.investigations.slice(-1)[0];
    const investigatedPlayer = this.logicService.findPlayerIngame(
      game,
      investigatedName,
    );

    if (currentPresPlayer.team === Team.LIB) {
      return investigatedPlayer.team;
    }

    const fascConfProb = game.settings.simpleBlind
      ? this.getSimpleFascInvConfProb(
          game,
          currentPresPlayer,
          investigatedPlayer,
        )
      : this.getFascInvConfProb(game, currentPresPlayer, investigatedPlayer);

    if (
      this.testProb(
        fascConfProb,
        game,
        currentPresPlayer.name,
        DefaultAction.INV_CLAIM,
        'fascInvConfProb',
      )
    ) {
      return Team.FASC;
    } else {
      return Team.LIB;
    }
  }

  /**
   * truth unless it's 1 or 0 blues and enough underclaims for RBB to be believable as outing on 2 topDecks is worth it
   * also unlikely BBB should be RBB to avoid auto 3 topdecks
   */

  /**
   *
   * @param game         (top3 === PRES3.RRR && this.underclaimTotal(game) >= 2) ||
        (top3 === PRES3.RRB && this.underclaimTotal(game) >= 1)
   * @returns
   */
  defaultInspect3Claim(game: Game): PRES3 {
    const top3Cards = this.logicService.inspect3(game.deck);
    const top3 = this.determine3Cards(top3Cards);

    const currentPresPlayer = this.logicService.getCurrentPres(game);
    if (currentPresPlayer.team === Team.LIB) {
      return top3;
    }
    const [overclaimToRBBInspect3Prob, underclaimBBBInspect3Prob] =
      this.getInspect3ClaimProbs(game);

    if (top3 === PRES3.RRR || top3 === PRES3.RRB) {
      return this.testProb(
        overclaimToRBBInspect3Prob,
        game,
        currentPresPlayer.name,
        DefaultAction.INSPECT_TOP3_CLAIM,
        'overclaimToRBBInspect3Prob',
      )
        ? PRES3.RBB
        : top3;
    } else if (top3 === PRES3.BBB) {
      return this.testProb(
        underclaimBBBInspect3Prob,
        game,
        currentPresPlayer.name,
        DefaultAction.INSPECT_TOP3_CLAIM,
        'underclaimBBBInspect3Prob',
      )
        ? PRES3.RBB
        : top3;
    } else {
      //top3 === PRES3.RBB
      return top3;
    }
  }

  defaultVetoReply(game: Game): boolean {
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const chan2 = this.determine2Cards(game.chanCards);
    return (
      (currentPresPlayer.team === Team.LIB && chan2 === CHAN2.RR) ||
      (currentPresPlayer.team === Team.FASC && chan2 === CHAN2.BB)
    );
  }

  //prob calculators

  /**
   * lies based on probabilities that account for hitler vs vanilla and number of blues down
   * If double dipping and inv a lib - 50%
   * If inv a fasc and low blue count and you are 3 red - 40% conf to look bad
   */
  getFascInvConfProb(
    game: Game,
    currentPresPlayer: Player,
    investigatedPlayer: Player,
  ) {
    let fascInvConfProb: number;
    let vanillaFascInvLibConfProbs = [0.85, 0.95, 1, 1, 1]; //based on number of blues down
    let hitlerInvLibConfProbs = [0.55, 0.65, 0.75, 0.85, 1]; //based on number of blues down
    const currentChanPlayer = this.logicService.getCurrentChan(game);

    if (this.inConflict(game, currentPresPlayer, investigatedPlayer)) {
      return (fascInvConfProb = 1);
    }
    if (this.doubleDipping(game)) {
      if (currentChanPlayer.team === Team.LIB) {
        //conf another lib 60%, conf hitler 20%, conf vanilla 40%
        fascInvConfProb =
          investigatedPlayer.team === Team.LIB
            ? 0.6
            : investigatedPlayer.role === Role.HITLER
            ? 0.15
            : 0.33;
      } else {
        //if confed a fasc, 100% conf a lib, 0% conf another fasc
        fascInvConfProb = investigatedPlayer.team === Team.LIB ? 1 : 0;
      }
      return fascInvConfProb;
    }

    if (investigatedPlayer.team === Team.LIB) {
      fascInvConfProb =
        currentPresPlayer.role === Role.HITLER
          ? hitlerInvLibConfProbs[game.LibPoliciesEnacted]
          : vanillaFascInvLibConfProbs[game.LibPoliciesEnacted];
    } else {
      //investigating a fellow fasc
      const underclaimTotal = this.underclaimTotal(game);
      fascInvConfProb = 0;
      if (this.is3Red(game, game.currentPres)) {
        //if 3 red and more than 2 underclaims - create fasc fasc conf
        //if 3 red and 2 underclaims - create fasc fasc conf 60%
        if (underclaimTotal > 2) {
          fascInvConfProb = 1;
        } else if (underclaimTotal === 2) {
          fascInvConfProb = 0.6;
        }
      }
    }
    return fascInvConfProb;
  }

  getInspect3ClaimProbs(game: Game) {
    let overclaimToRBBInspect3Prob = 0;
    let underclaimBBBInspect3Prob = 1;

    const deck1OverclaimCondition =
      game.deck.deckNum === 1 &&
      game.deck.drawPile.length <= 5 &&
      this.blueCountOnThisDeck(game) <= 4;
    const deck2OverclaimCondition =
      game.deck.deckNum === 2 &&
      this.bluesToBeginTheDeck(game, 2) - this.blueCountOnThisDeck(game) >= 2;

    if (deck1OverclaimCondition || deck2OverclaimCondition) {
      overclaimToRBBInspect3Prob = 0.9;
    }

    return [overclaimToRBBInspect3Prob, underclaimBBBInspect3Prob];
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
  getPresDropProbs(game: Game) {
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const currentChanPlayer = this.logicService.getCurrentChan(game);
    const bluesPlayedByPres = currentPresPlayer.bluesPlayed;

    let vanillaFascPresRBBDropProb: number,
      hitlerPresRBBDropProb: number,
      vanillaFascPresRRBDropProb: number,
      hitlerPresRRBDropProb: number;

    //vanillaFasc RBB

    vanillaFascPresRBBDropProb = 0.5;
    if (this.lib3RedOnThisDeck(game)) {
      vanillaFascPresRBBDropProb = 0.9;
    }

    if (currentChanPlayer.team === Team.FASC) {
      if (!this.isPower(game) && game.LibPoliciesEnacted <= 1) {
        vanillaFascPresRBBDropProb = 0.25;
      } else {
        vanillaFascPresRBBDropProb = 1;
      }
    }

    //hitler RBB
    //could make this depend on the to underclaim type of conditions (underclaims, blue count ,etc.)

    hitlerPresRBBDropProb =
      game.LibPoliciesEnacted === 2
        ? 0.9
        : game.LibPoliciesEnacted === 3
        ? 1
        : 0.6;

    //hitler knows the chan is fasc since the person that conflicted hitler also conflicted them, same with cucu

    //RBB special cases

    if (
      (this.isAntiDD(game) && currentChanPlayer.team === Team.FASC) ||
      this.isCucu(game)
    ) {
      hitlerPresRBBDropProb = 1;
      vanillaFascPresRBBDropProb = 1; //why not here before, just added
    }

    if (game.LibPoliciesEnacted === 4) {
      vanillaFascPresRBBDropProb = 1;
      hitlerPresRBBDropProb = 1;
    }

    //vanillaFasc RRB

    vanillaFascPresRRBDropProb = 1;
    if (currentChanPlayer.team === Team.FASC) {
      //if chan is not hitler or they are hitler but it's an early blue for no power, always pass blue
      //don't pass in cucu because you were inved lib, think you are lib, you need to drop to show you are fasc
      if (currentChanPlayer.role !== Role.HITLER) {
        vanillaFascPresRRBDropProb = 0;
      } else if (game.LibPoliciesEnacted <= 1 && !this.isPower(game)) {
        vanillaFascPresRRBDropProb = 0;
      } else if (game.LibPoliciesEnacted <= 3 && !this.isPower(game)) {
        vanillaFascPresRRBDropProb = 0.4;
      }

      if (this.isAntiDD(game) || this.isCucu(game)) {
        vanillaFascPresRRBDropProb = 1;
      }
    }

    //hilter RRB

    const ifPower = this.isPower(game) ? 0.3 : 0;

    const hitlerPresRRBDropProbs = [
      [0.25, null, null, null, null],
      [0.4, 0.3, null, null, null],
      [0.9 + ifPower, 0.5 + ifPower, 0.7 + ifPower, null, null],
      [1, 1, 1, 1, null],
      [1, 1, 1, 1, 1],
    ];

    hitlerPresRRBDropProb =
      hitlerPresRRBDropProbs[game.LibPoliciesEnacted][bluesPlayedByPres];

    //pass the blue to your fasc chan
    if (this.isAntiDD(game) && currentChanPlayer.team === Team.FASC) {
      hitlerPresRRBDropProb = 0;
    }
    if (this.isCucu(game)) {
      hitlerPresRRBDropProb = 1;
    }

    if (game.FascPoliciesEnacted >= 3) {
      //auto win or take gun
      //vanillaFascPresRRBDropProb = 1 already prob 1 unless it's fasc fasc anyway and the chancellor drops with prob 1 in this scenario
      hitlerPresRRBDropProb = 1;
    }
    const RBBDropProb =
      currentPresPlayer.role === Role.HITLER
        ? hitlerPresRBBDropProb
        : vanillaFascPresRBBDropProb;
    const RRBDropProb =
      currentPresPlayer.role === Role.HITLER
        ? hitlerPresRRBDropProb
        : vanillaFascPresRRBDropProb;
    return [RBBDropProb, RRBDropProb];
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
  getChanDropProbs(game: Game) {
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const currentChanPlayer = this.logicService.getCurrentChan(game);
    const bluesPlayedByChan = currentChanPlayer.bluesPlayed;
    let vanillaFascChanDropProb: number, hitlerChanDropProb: number;

    //hilterChanDropProbs[blues on board][blues played by chan already]
    const hilterChanDropProbs = [
      [0.2, null, null, null, null],
      [0.3, 0.15, null, null, null],
      [0.7, 0.4, 0.3, null, null],
      [0.85, 0.75, 0.5, 0.25, null], //used to be .1
      [1, 1, 1, 1, 1],
    ];

    const vanillaFascChanDropProbs = [
      [0.75, null, null, null, null],
      [0.85, 0.85, null, null, null],
      [0.9, 0.9, 0.9, null, null],
      [0.95, 0.95, 0.95, 0.95, null],
      [1, 1, 1, 1, 1],
    ];

    hitlerChanDropProb =
      hilterChanDropProbs[game.LibPoliciesEnacted][bluesPlayedByChan];
    vanillaFascChanDropProb =
      vanillaFascChanDropProbs[game.LibPoliciesEnacted][bluesPlayedByChan];

    //fasc fasc and power - drop, otherwise play blue
    if (currentPresPlayer.team === Team.FASC) {
      if (this.isPower(game)) {
        vanillaFascChanDropProb = 1;
      } else if (game.LibPoliciesEnacted <= 1) {
        vanillaFascChanDropProb = 0.1;
      }
    } else {
      //less likely to give inv
      if (game.LibPoliciesEnacted <= 1 && this.invPower(game)) {
        vanillaFascChanDropProb = game.players.length <= 8 ? 0.3 : 0.65; //in 9 and 10, more likely to give inv
      }
    }
    //vanilla should fail cucu with high prob
    //cucu
    if (this.isCucu(game)) {
      if (currentPresPlayer.team === Team.LIB) {
        hitlerChanDropProb = 0; //don't out
        //vanillaFascDrop prob is pretty much the same - high
      } else {
        //fasc fasc cucu - you already know you are fasc since you inved a fasc as lib...but you don't know if you are hitler
        if (game.FascPoliciesEnacted >= 3 || game.LibPoliciesEnacted >= 3) {
          vanillaFascChanDropProb = 1;
          hitlerChanDropProb = 1;
        } else {
          hitlerChanDropProb = 0.3; //chan looks terrible if cucu fails
          vanillaFascChanDropProb = 0.5; //random in this stage
        }
      }
    }

    //antiDD
    //honestly nothing different - don't really pass it

    //under the gun not in a 9/10 player game - just get shot there

    if (
      this.gunPower(game) &&
      currentPresPlayer.team === Team.LIB &&
      game.players.length <= 8
    ) {
      if (game.LibPoliciesEnacted === 3) {
        vanillaFascChanDropProb = 0.8;
      } else {
        vanillaFascChanDropProb = 0.1 * game.FascPoliciesEnacted + 0.05;
      }
      //confirmed lib
      if (this.confirmedLib(game, currentPresPlayer)) {
        vanillaFascChanDropProb -= 0.2;
      }

      if (this.inAnyConflict(game, currentChanPlayer)) {
        vanillaFascChanDropProb -= 0.2;
      }

      if (this.presAgainWithoutTopDeck(game) && game.LibPoliciesEnacted === 3) {
        //depend on probabiilty of drawing a blue
        vanillaFascChanDropProb += 0.3;
      } else {
        vanillaFascChanDropProb -= 0.3;
      }

      //super low blue count - really afford to play blue no matter what
      if (game.LibPoliciesEnacted <= 1) {
        vanillaFascChanDropProb = 0.05;
      }

      // goal is to make conf look good
      if (this.inFascFascConflict(game, currentChanPlayer)) {
        vanillaFascChanDropProb = 1;
      }

      //if no lib majority, play blue to keep it that way
      if (
        this.numAliveOnTeam(game, Team.FASC) >=
        this.numAliveOnTeam(game, Team.LIB)
      ) {
        vanillaFascChanDropProb = 0;
      }
    }

    if (game.LibPoliciesEnacted === 4 || game.FascPoliciesEnacted === 5) {
      hitlerChanDropProb = 1;
      vanillaFascChanDropProb = 1;
    }
    return currentChanPlayer.role === Role.HITLER
      ? hitlerChanDropProb
      : vanillaFascChanDropProb;
  }

  testProb(
    threshold: number,
    game: Game,
    playerName: string,
    actionName: DefaultAction,
    probabilityName: string,
  ) {
    const randomProb = Math.random();
    game.defaultProbabilityLog.push({
      randomProb,
      threshold,
      playerName,
      actionName,
      probabilityName,
    });
    return randomProb < threshold;
  }

  /**
   *
   * underclaim if no underlcaims already or a lib drew 3 red
   * overclaim if too many underclaims or some underclaims but no lib 3 red
   */
  getFascFascBlueChanClaim(game: Game, chan2: CHAN2) {
    const underclaimTotal = this.underclaimTotal(game);

    let RBOverclaimProb: number, BBUnderclaimProb: number;
    if (chan2 === CHAN2.BB) {
      if (underclaimTotal <= -1) {
        BBUnderclaimProb = 1;
      } else if (
        underclaimTotal <= 1 &&
        this.lib3RedOnThisDeck(game) &&
        !this.fasc3RedOnThisDeck(game)
      ) {
        BBUnderclaimProb = 0.9;
      } else {
        BBUnderclaimProb = 0;
      }
    } else {
      // if(chan2 === CHAN2.RB){
      if (
        underclaimTotal === 0 &&
        game.deck.deckNum === 1 &&
        this.deck1BlueCount(game) <= 2
      ) {
        RBOverclaimProb = 0.75;
      } else if (underclaimTotal === 1 && !this.lib3RedOnThisDeck(game)) {
        RBOverclaimProb = 0.9;
      } else if (underclaimTotal >= 2) {
        RBOverclaimProb = 1;
      } else {
        RBOverclaimProb = 0;
      }
    }
    return [BBUnderclaimProb, RBOverclaimProb];
  }

  /**
   *
   * Always change the count to signal
   */
  getSimpleFascFascBlueChanClaim(game: Game, chan2: CHAN2) {
    const BBUnderclaimProb = 1;
    const RBOverclaimProb = 1;
    return [BBUnderclaimProb, RBOverclaimProb];
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
  getSimpleFascInvConfProb(
    game: Game,
    currentPresPlayer: Player,
    investigatedPlayer: Player,
  ) {
    let fascInvConfProb: number;
    let hitlerInvLibConfProbs = [0.55, 0.8, 1, 1, 1]; //based on number of blues down

    if (this.inConflict(game, currentPresPlayer, investigatedPlayer)) {
      //if they are lib - have to lie and call fasc
      //if they are fasc - have to tell the truth that they are fasc
      return (fascInvConfProb = 1);
    }

    if (investigatedPlayer.team === Team.LIB) {
      fascInvConfProb =
        currentPresPlayer.role === Role.HITLER
          ? hitlerInvLibConfProbs[game.LibPoliciesEnacted]
          : 1;
    } else {
      fascInvConfProb = 0;
    }

    return fascInvConfProb;
  }

  /**
   *
   * vanilla drops unless it's fasc fasc and low blue count
   * hitler has same matrix, but doesn't drop in lib cucu (outs) and less likely to drop in fasc fasc cucu (as they look bad)
   */
  getSimpleChanDropProbs(game: Game) {
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const currentChanPlayer = this.logicService.getCurrentChan(game);
    const bluesPlayedByChan = currentChanPlayer.bluesPlayed;
    let vanillaFascChanDropProb: number, hitlerChanDropProb: number;

    //hilterChanDropProbs[blues on board][blues played by chan already]
    const hilterChanDropProbs = [
      [0.25, null, null, null, null],
      [0.3, 0.15, null, null, null],
      [0.7, 0.4, 0.3, null, null],
      [0.85, 0.75, 0.5, 0.1, null],
      [1, 1, 1, 1, 1],
    ];

    hitlerChanDropProb =
      hilterChanDropProbs[game.LibPoliciesEnacted][bluesPlayedByChan];
    vanillaFascChanDropProb = 1;

    //fasc fasc and low blue - play blue
    if (currentPresPlayer.team === Team.FASC && game.LibPoliciesEnacted <= 1) {
      vanillaFascChanDropProb = 0.15;
    }
    if (this.isCucu(game)) {
      if (currentPresPlayer.team === Team.LIB) {
        hitlerChanDropProb = 0; //don't out
        //vanillaFascDrop prob is pretty much the same - high
      } else {
        //fasc fasc cucu - you already know you are fasc since you inved a fasc as lib...but you don't know if you are hitler
        if (game.FascPoliciesEnacted >= 3 || game.LibPoliciesEnacted >= 3) {
          vanillaFascChanDropProb = 1;
          hitlerChanDropProb = 1;
        } else {
          hitlerChanDropProb = 0.3; //chan looks terrible if cucu fails
          vanillaFascChanDropProb = 1;
        }
      }
    }

    if (game.LibPoliciesEnacted === 4 || game.FascPoliciesEnacted === 5) {
      hitlerChanDropProb = 1;
      vanillaFascChanDropProb = 1;
    }
    return currentChanPlayer.role === Role.HITLER
      ? hitlerChanDropProb
      : vanillaFascChanDropProb;
  }

  /**
   *
   * RBB always drop
   * RRB vanilla always drop unless fasc fasc
   * Hitler on RRB has a mix
   */

  getSimplePresDropProbs(game: Game) {
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const currentChanPlayer = this.logicService.getCurrentChan(game);
    const bluesPlayedByPres = currentPresPlayer.bluesPlayed;

    let vanillaFascPresRBBDropProb: number,
      hitlerPresRBBDropProb: number,
      vanillaFascPresRRBDropProb: number,
      hitlerPresRRBDropProb: number;

    vanillaFascPresRBBDropProb = 1;
    hitlerPresRBBDropProb = 1;

    vanillaFascPresRRBDropProb = 1;
    if (currentChanPlayer.team === Team.FASC) {
      //if chan is not hitler or they are hitler but it's an early blue for no power, always pass blue
      if (
        currentChanPlayer.role !== Role.HITLER ||
        (game.LibPoliciesEnacted <= 1 && !this.isPower(game))
      ) {
        vanillaFascPresRRBDropProb = 0;
      } else if (game.LibPoliciesEnacted <= 3 && !this.isPower(game)) {
        //chan is hitler and 2 or 3 blues down, .6 pass the blue because hitler dropping allows them to confirm they are hitler and you are their fasc
        vanillaFascPresRRBDropProb = 0.4;
      }
    }

    const ifPower = this.isPower(game) ? 0.3 : 0;

    const hitlerPresRRBDropProbs = [
      [0.25, null, null, null, null],
      [0.4, 0.3, null, null, null],
      [0.9 + ifPower, 0.5 + ifPower, 0.7 + ifPower, null, null],
      [1, 1, 1, 1, null],
      [1, 1, 1, 1, 1],
    ];

    hitlerPresRRBDropProb =
      hitlerPresRRBDropProbs[game.LibPoliciesEnacted][bluesPlayedByPres];

    if (game.FascPoliciesEnacted >= 3) {
      //auto win or take gun
      vanillaFascPresRRBDropProb = 1;
      hitlerPresRRBDropProb = 1;
    }
    const RBBDropProb =
      currentPresPlayer.role === Role.HITLER
        ? hitlerPresRBBDropProb
        : vanillaFascPresRBBDropProb;
    const RRBDropProb =
      currentPresPlayer.role === Role.HITLER
        ? hitlerPresRRBDropProb
        : vanillaFascPresRRBDropProb;
    return [RBBDropProb, RRBDropProb];
  }

  getPresClaimWithLibProbs(game: Game) {
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const currentChanPlayer = this.logicService.getCurrentChan(game);
    const underclaimTotal = this.underclaimTotal(game);
    const blueCount = this.blueCountOnThisDeck(game);

    const fascBBBunderclaimProb = this.lib3RedOnThisDeck(game) ? 1 : 0.75;
    const fascRRBoverclaimProb = 0; //this.lib3RedOnThisDeck(game)
    // ? 0
    // : underclaimTotal >= 2
    // ? 0.9
    // : underclaimTotal === 1
    // ? 0.25
    // : 0;

    const fascRBBoverclaimProb = this.lib3RedOnThisDeck(game)
      ? 0
      : underclaimTotal >= 2
      ? 1
      : underclaimTotal === 1
      ? 0.75
      : 0;

    const fascRRRconfProbs = [0.4, 0.6, 0.8, 0.9, 1]; //100% in simple
    let fascRRRconfProb = fascRRRconfProbs[game.LibPoliciesEnacted];

    if (underclaimTotal >= 1 && !this.lib3RedOnThisDeck(game)) {
      fascRRRconfProb += 0.25 * underclaimTotal;
    }

    if (blueCount >= this.bluesToBeginTheDeck(game, game.deck.deckNum)) {
      fascRRRconfProb = 0;
    }

    const fascRRBconfProbs = [0.75, 0.85, 0.95, 1, 1]; //100% in simple
    let fascRRBconfProb = fascRRBconfProbs[game.LibPoliciesEnacted];

    if (this.invPower(game)) {
      fascRRBconfProb = 0.5;
      fascRRRconfProb = Math.min(fascRRRconfProb, 0.5);
    }

    if (game.players.length < 7 || game.players.length === 8) {
      fascRRBconfProb = 0.2;
      fascRRRconfProb = 0.1;
    }

    if (currentPresPlayer.role === Role.HITLER) {
      if (this.knownLibToHitler(game, currentChanPlayer)) {
        //keep same as vanilla fasc
      } else {
        [fascRRBconfProb, fascRRRconfProb] = this.getHitlerBlindConfProbs(game);
      }
    }

    //can't conf someone you investigated as lib or a confirmed lib
    if (
      game.invClaims.some(
        (inv) =>
          inv.investigator === game.currentPres &&
          inv.investigatee === game.currentChan &&
          inv.claim === Team.LIB,
      )
    ) {
      fascRRBconfProb = 0;
      fascRRRconfProb = 0;
    } else if (this.confirmedLib(game, currentChanPlayer)) {
      fascRRBconfProb = 0;
      fascRRRconfProb = 0;
    }

    return [
      fascRRBconfProb,
      fascBBBunderclaimProb,
      fascRRRconfProb,
      fascRRBoverclaimProb,
      fascRBBoverclaimProb,
    ];
  }

  getSimplePresClaimWithLibProbs(game: Game) {
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const currentChanPlayer = this.logicService.getCurrentChan(game);
    const underclaimTotal = this.underclaimTotal(game);

    const fascBBBunderclaimProb = 1;
    const fascRRBoverclaimProb = this.lib3RedOnThisDeck(game)
      ? 0
      : underclaimTotal >= 2
      ? 0.9
      : underclaimTotal === 1
      ? 0.25
      : 0;
    const fascRBBoverclaimProb = this.lib3RedOnThisDeck(game)
      ? 0
      : underclaimTotal >= 2
      ? 0.9
      : underclaimTotal === 1
      ? 0.6
      : 0;
    let fascRRRconfProb = 1;

    let fascRRBconfProb = 1; //know your are fasc, if you don't want to conf, you can choose not to

    if (currentPresPlayer.role === Role.HITLER) {
      fascRRBconfProb = 0;
      fascRRRconfProb =
        underclaimTotal >= 2 ? 0.9 : underclaimTotal === 1 ? 0.5 : 0.1;
    }

    //can't conf someone you investigated as lib
    if (
      game.invClaims.some(
        (inv) =>
          inv.investigator === game.currentPres &&
          inv.investigatee === game.currentChan &&
          inv.claim === Team.LIB,
      )
    ) {
      fascRRBconfProb = 0;
      fascRRRconfProb = 0;
    } else if (this.confirmedLib(game, currentChanPlayer)) {
      fascRRBconfProb = 0;
      fascRRRconfProb = 0;
    }

    return [
      fascRRBconfProb,
      fascBBBunderclaimProb,
      fascRRRconfProb,
      fascRRBoverclaimProb,
      fascRBBoverclaimProb,
    ];
  }

  getPresClaimWithFascProbs(game: Game) {
    const currentChanPlayer = this.logicService.getCurrentChan(game);
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const pres3 = this.determine3Cards(game.presCards);
    const underclaimTotal = this.underclaimTotal(game);
    const bluesDrawn = draws3.indexOf(pres3);
    const BBBOverclaimAmount = 3 - bluesDrawn;
    const RBBoverclaimProb =
      underclaimTotal >= BBBOverclaimAmount + 1 ||
      (underclaimTotal === BBBOverclaimAmount && !this.lib3RedOnThisDeck(game))
        ? 0.9
        : 0;
    let fascFascConfProb = 0;

    //need to conf if 3 blues underclaimed
    // (pres3 === PRES3.RBB && underclaimTotal >= 1) ||
    // (PRES3.RRB && underclaimTotal >= 2)
    if (underclaimTotal + bluesDrawn >= 3) {
      fascFascConfProb = 0.9;
    }

    if (underclaimTotal + bluesDrawn === 2) {
      fascFascConfProb = 0.33;
    }

    if (this.isCucu(game) && currentChanPlayer.role === Role.HITLER) {
      fascFascConfProb = 0;
    }

    //when to conf the cucu
    if (this.isCucu(game) && currentChanPlayer.role !== Role.HITLER) {
      if (underclaimTotal + bluesDrawn >= 2) {
        //basically total underclaim including what's dropped in this gov
        fascFascConfProb = 0.9;
      } else if (underclaimTotal + bluesDrawn === 1) {
        fascFascConfProb = 0.4;
      }
    }

    if (this.isAntiDD(game)) {
      fascFascConfProb = 0;
    }

    if (game.FascPoliciesEnacted > 3) {
      fascFascConfProb = 0;
    }

    //this is missing a case in claiWithLibs about whether the blue count already equals or exceeds
    //the count for the deck

    if (currentPresPlayer.role === Role.HITLER) {
      if (this.knownFascistToHitler(game, currentChanPlayer)) {
        //keep same as vanilla fasc
      } else {
        const [fascRRBconfProb, fascRRRconfProb] =
          this.getHitlerBlindConfProbs(game);
        fascFascConfProb =
          pres3 === PRES3.RRR ? fascRRRconfProb : fascRRBconfProb;
        //this will be returning based on RRR and RRB...
      }
    }

    //can't conf someone you investigated as lib
    if (
      game.invClaims.some(
        (inv) =>
          inv.investigator === game.currentPres &&
          inv.investigatee === game.currentChan &&
          inv.claim === Team.LIB,
      )
    ) {
      fascFascConfProb = 0;
    }

    return [fascFascConfProb, RBBoverclaimProb];
  }

  getSimplePresClaimWithFascProbs(game: Game) {
    // const RBBoverclaimProb = 0
    const RBBoverclaimProb = this.underclaimTotal(game) >= 1 ? 1 : 0;
    const fascFascConfProb = 0;

    return [fascFascConfProb, RBBoverclaimProb];
  }

  getHitlerBlindConfProbs(game: Game) {
    //blind confing
    const blueCount = this.blueCountOnThisDeck(game);
    //adjust later to depend on deck
    const RRRHitlerBlindConfProbs = [0.3, 0.3, 0.4, 0.6, 0.8];
    let RRRHitlerBlindConfProb =
      RRRHitlerBlindConfProbs[game.LibPoliciesEnacted];

    //change this to be blue count low
    const countTooLowOnDeck1 =
      game.deck.deckNum === 1 &&
      game.deck.drawPile.length <= 5 &&
      this.blueCountOnThisDeck(game) <= 4;
    if (countTooLowOnDeck1) {
      RRRHitlerBlindConfProb = 0.8;
    }
    if (blueCount >= this.bluesToBeginTheDeck(game, game.deck.deckNum)) {
      RRRHitlerBlindConfProb = 0;
    }

    const RRBHitlerBlindConfProbs = [0.1, 0.2, 0.5, 0.7, 0.8];
    let RRBHitlerBlindConfProb =
      RRBHitlerBlindConfProbs[game.LibPoliciesEnacted];

    if (this.invPower(game)) {
      RRRHitlerBlindConfProb = Math.min(RRRHitlerBlindConfProb, 0.5);
      RRBHitlerBlindConfProb = Math.min(RRBHitlerBlindConfProb, 0.5);
    }

    if (game.players.length < 7 || game.players.length === 8) {
      RRRHitlerBlindConfProb = 0.1;
      RRBHitlerBlindConfProb = 0.1;
    }
    return [RRBHitlerBlindConfProb, RRRHitlerBlindConfProb];
  }

  /**
   * Helper functions
   */

  determine3Cards(cards3: Card[]) {
    const blues = cards3.reduce(
      (acc, card) => (card.policy === Policy.LIB ? acc + 1 : acc),
      0,
    );
    return draws3[blues];
  }

  determine2Cards(cards2: Card[]) {
    const blues = cards2.reduce(
      (acc, card) => (card.policy === Policy.LIB ? acc + 1 : acc),
      0,
    );
    return draws2[blues];
  }

  lib3RedOnThisDeck(game: Game) {
    return game.govs.some((gov) => {
      const presPlayer = this.logicService.findPlayerIngame(game, gov.pres);
      return (
        gov.deckNum === game.deck.deckNum &&
        presPlayer.team === Team.LIB &&
        gov.presClaim === PRES3.RRR
      );
    });
  }

  fasc3RedOnThisDeck(game: Game) {
    return game.govs.some((gov) => {
      const presPlayer = this.logicService.findPlayerIngame(game, gov.pres);
      return (
        gov.deckNum === game.deck.deckNum &&
        presPlayer.team === Team.FASC &&
        gov.presClaim === PRES3.RRR
      );
    });
  }

  //checks if they have been a 3 red president
  is3Red(game: Game, playerName: string) {
    return game.govs.some(
      (gov) => gov.pres === playerName && gov.presClaim === PRES3.RRR,
    );
  }

  underclaimTotal(game: Game) {
    return game.govs.reduce(
      (acc, gov) =>
        gov.deckNum === game.deck.deckNum ? acc + gov.underclaim : acc,
      0,
    );
  }

  deck1BlueCount(game: Game) {
    return this.deckNBlueCount(game, 1);
  }

  blueCountOnThisDeck(game: Game) {
    return this.deckNBlueCount(game, game.deck.deckNum);
  }

  deckNBlueCount(game: Game, N: number) {
    return game.govs.reduce(
      (acc, gov) =>
        gov.deckNum === N ? acc + draws3.indexOf(gov.presClaim) : acc,
      0,
    );
  }

  bluesEnactedInDeck(game: Game, deckNum: number) {
    return game.govs.reduce(
      (acc, gov) =>
        gov.deckNum === deckNum && gov.policyPlayed.policy === Policy.LIB
          ? acc + 1
          : acc,
      0,
    );
  }

  bluesToBeginTheDeck(game: Game, deckNum: number) {
    return (
      6 -
      game.govs.reduce(
        (acc, gov) =>
          gov.deckNum < deckNum && gov.policyPlayed.policy === Policy.LIB
            ? acc + 1
            : acc,
        0,
      )
    );
  }

  isCucu(game: Game) {
    return game.invClaims.some(
      (inv) =>
        inv.investigator === game.currentChan &&
        inv.investigatee === game.currentPres &&
        inv.claim === Team.LIB,
    );
  }

  isAntiDD(game: Game) {
    const confsToCurrentPres = game.confs.filter(
      (conf) => conf.confee === game.currentPres,
    );
    const confsToCurrentChanAndPres = confsToCurrentPres.some((conf1) =>
      game.confs.some(
        (conf2) =>
          conf1.confer === conf2.confer && conf2.confee === game.currentChan,
      ),
    );
    return confsToCurrentChanAndPres;
  }

  //this is will there be a power if a red gets played
  isPower(game: Game) {
    const redsDown = game.FascPoliciesEnacted;
    const numPlayers = game.players.length;
    return (
      numPlayers >= 9 || (numPlayers >= 7 && redsDown >= 1) || redsDown >= 2
    );
  }

  invPower(game: Game) {
    const redsDown = game.FascPoliciesEnacted;
    const numPlayers = game.players.length;
    return (
      (numPlayers >= 9 && redsDown <= 1) || (numPlayers >= 7 && redsDown === 1)
    );
  }

  gunPower(game: Game) {
    const redsDown = game.FascPoliciesEnacted;
    return redsDown === 3 || redsDown === 4;
  }

  //already assumes conditions are met of fasc player who is in the middle of investigating
  doubleDipping(game: Game) {
    return game.confs.some(
      (conf) =>
        conf.confer === game.currentPres &&
        conf.confee === game.currentChan &&
        conf.type === Conf.POLICY,
    );
  }

  inConflict(game: Game, player1: Player, player2: Player) {
    return game.confs.some(
      (conf) =>
        (conf.confer === player2.name && conf.confee === player1.name) ||
        (conf.confer === player1.name && conf.confee === player2.name),
    );
  }

  inAnyConflict(game: Game, player: Player) {
    return game.players.some((otherPlayer) =>
      this.inConflict(game, player, otherPlayer),
    );
  }

  inFascFascConflict(game: Game, player: Player) {
    return (
      player.team === Team.FASC &&
      game.players.some(
        (otherPlayer) =>
          this.inConflict(game, player, otherPlayer) &&
          otherPlayer.team === Team.FASC,
      )
    );
  }

  numAliveOnTeam(game: Game, team: Team) {
    return game.players.reduce(
      (n, player) => (player.alive && player.team === team ? n + 1 : n),
      0,
    );
  }

  safeToOverClaimOnDeck1(game: Game, desiredBlueClaim: number) {
    const underclaimTotal = this.underclaimTotal(game);
    const blueCount = this.blueCountOnThisDeck(game);
    return (
      game.deck.deckNum === 1 &&
      (underclaimTotal >= 1 || blueCount + desiredBlueClaim <= 5)
    );
  }

  safeToDropOrUnderclaimOnDeck1(game: Game) {
    return (
      game.deck.deckNum === 1 &&
      !this.fasc3RedOnThisDeck(game) &&
      this.underclaimTotal(game) <= 1
    );
  }

  confirmedLib(game: Game, player: Player, fromHitlerPOV?: boolean) {
    //adding the fromHitlerPOV flag checks if the player is confirmed lib to Hitler (since hitler knows they are fasc)
    if (player.team !== Team.LIB) {
      return false;
    } else if (this.inAnyConflict(game, player)) {
      return false;
    }
    const allPossibleLines = this.allPossibleLines(game, fromHitlerPOV);
    if (allPossibleLines.every((line) => !line.includes(player.name))) {
      return true;
    }

    if (
      game.players.length <= 6 &&
      player.confirmedNotHitler &&
      // player.alive &&
      this.bothSidesOfAConflictShot(game)
    ) {
      return true;
    }

    return false;
  }

  bothSidesOfAConflictShot(game: Game) {
    return game.confs.some((conf) => {
      const conferPlayer = this.logicService.findPlayerIngame(
        game,
        conf.confer,
      );
      const confeePlayer = this.logicService.findPlayerIngame(
        game,
        conf.confee,
      );
      return !conferPlayer.alive && !confeePlayer.alive;
    });
  }

  allPossibleLines(game: Game, fromHitlerPOV?: boolean) {
    const possibleLines: string[][] = [];
    for (let i = 0; i < Math.pow(2, game.players.length); i++) {
      let fascists = [];
      let liberals = [];
      for (let j = 0; j < game.players.length; j++) {
        if ((i & (1 << j)) > 0) {
          liberals.push(game.players[j].name);
        } else {
          fascists.push(game.players[j].name);
        }
      }
      if (this.isPossibleLine(game, liberals, fascists, fromHitlerPOV)) {
        possibleLines.push(fascists);
      }
    }
    return possibleLines;
  }

  isPossibleLine(
    game: Game,
    liberals: string[],
    fascists: string[],
    fromHitlerPOV?: boolean,
  ) {
    const hitlerPlayer = this.logicService.getHitler(game);
    return !(
      fascists.length > (game.players.length - 1) / 2 ||
      game.confs.some(
        (conf) =>
          liberals.includes(conf.confer) && liberals.includes(conf.confee),
      ) ||
      game.invClaims.some(
        (invClaim) =>
          (invClaim.claim === Team.LIB &&
            liberals.includes(invClaim.investigator) &&
            fascists.includes(invClaim.investigatee)) ||
          (invClaim.claim === Team.FASC &&
            liberals.includes(invClaim.investigator) &&
            liberals.includes(invClaim.investigatee)),
      ) ||
      // all known fascists must be in the fascist list
      (fromHitlerPOV && !fascists.includes(hitlerPlayer.name))
    );
  }

  presAgainWithoutTopDeck(game: Game) {
    const SEIndex = game.players.findIndex(
      (player) => player.name === game.currentPres,
    );

    //not an SE choice

    if (SEIndex === game.presIdx) {
      return this.logicService.numAlivePlayers(game) <= 3;
    }
    let distanceBackToSE = 0;
    let presIdx = game.presIdx;
    while (game.players[presIdx].name !== game.currentPres) {
      do {
        presIdx = (presIdx + 1) % game.players.length;
      } while (!game.players[presIdx].alive);
      distanceBackToSE++;
    }
    return distanceBackToSE <= 3;
  }

  knownLibToHitler(game: Game, player: Player) {
    return this.confirmedLib(game, player, true);
  }

  knownFascistToHitler(game: Game, player: Player) {
    const hitlerPlayer = this.logicService.getHitler(game);
    let knownFascist = false;

    if (
      game.invClaims.some(
        (invClaim) =>
          invClaim.investigator === hitlerPlayer.name &&
          invClaim.investigatee === player.name,
      )
    ) {
      //hitler investigated the player (saw role) regardless of claim
      knownFascist = true;
    } else if (
      game.invClaims.some(
        (invClaim) =>
          invClaim.investigator === player.name &&
          invClaim.investigatee === hitlerPlayer.name &&
          invClaim.claim === Team.LIB,
      )
    ) {
      //player investigated hitler as lib
      knownFascist = true;
    } else if (
      game.govs.some((gov) => {
        const bluesGivenToChan = gov.chanCards.reduce(
          (acc, card) => (card.policy === Policy.LIB ? acc + 1 : acc),
          0,
        );
        return (
          gov.pres === hitlerPlayer.name &&
          gov.chan === player.name &&
          draws2.indexOf(gov.chanClaim) !== bluesGivenToChan
        );
      })
    ) {
      //hitler is pres and chancellor's claim does not match what they had RB -> BB or RR, BB to RB
      knownFascist = true;
    }
    return knownFascist;
  }
}
