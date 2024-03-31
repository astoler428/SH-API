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
import { DefaultProbabilityLogItem } from 'src/models/defaultProbabilityLogItem.model';

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
        currentPresPlayer.role,
        game.govs.length + 1,
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
        currentPresPlayer.role,
        game.govs.length + 1,
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
        currentChanPlayer.role,
        game.govs.length + 1,
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
      (currentChanPlayer.role === Role.HITLER &&
        !this.knownFascistToHitler(game, currentPresPlayer)) ||
      currentPresPlayer.team === Team.LIB
    ) {
      return chan2;
    }
    //chan is vanilla fasc (or hitler who knows fasc) with a fasc pres (could be hitler) and you played a blue - advanced feature to change claim based on blue count and who had drawn 3R
    const [BBUnderclaimProb, RBOverclaimProb] = game.settings.simpleBlind
      ? this.getSimpleFascFascBlueChanClaim(game)
      : this.getFascFascBlueChanClaim(game);

    if (chan2 === CHAN2.BB) {
      return this.testProb(
        BBUnderclaimProb,
        game,
        currentChanPlayer.name,
        DefaultAction.CHAN_CLAIM,
        'BBUnderclaimProb',
        currentChanPlayer.role,
        game.govs.length + 1,
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
        currentChanPlayer.role,
        game.govs.length + 1,
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
            currentPresPlayer.role,
            game.govs.length + 1,
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
            currentPresPlayer.role,
            game.govs.length + 1,
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
            currentPresPlayer.role,
            game.govs.length + 1,
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
            currentPresPlayer.role,
            game.govs.length + 1,
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
            currentPresPlayer.role,
            game.govs.length + 1,
          )
            ? PRES3.BBB
            : PRES3.RBB;
        }
      }
    }

    //fasc pres and fasc chan - hitler doesn't matter since chan is signalling
    //except in case of giving RR, then whether to conf or not
    if (currentChanPlayer.team === Team.FASC) {
      const [fascFascConfProb, BBBfromBBclaimProb] = game.settings.simpleBlind
        ? this.getSimplePresClaimWithFascProbs(game)
        : this.getPresClaimWithFascProbs(game);
      if (game.chanClaim === CHAN2.RR) {
        return this.testProb(
          fascFascConfProb,
          game,
          currentPresPlayer.name,
          DefaultAction.PRES_CLAIM,
          'fascFascConfProb',
          currentPresPlayer.role,
          game.govs.length + 1,
        )
          ? PRES3.RRB
          : PRES3.RRR;
      } else if (game.chanClaim === CHAN2.RB) {
        return PRES3.RRB;
      } else {
        //BB
        return this.testProb(
          BBBfromBBclaimProb,
          game,
          currentPresPlayer.name,
          DefaultAction.PRES_CLAIM,
          'BBBfromBBclaimProb',
          currentPresPlayer.role,
          game.govs.length + 1,
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
        currentPresPlayer.role,
        game.govs.length,
      )
    ) {
      return Team.FASC;
    } else {
      return Team.LIB;
    }
  }

  defaultInspect3Claim(game: Game): PRES3 {
    const top3Cards = this.logicService.inspect3(game.deck);
    const top3 = this.determine3Cards(top3Cards);

    const currentPresPlayer = this.logicService.getCurrentPres(game);
    if (currentPresPlayer.team === Team.LIB) {
      return top3;
    }
    const [overclaimFromRRRtoRBBInspect3Prob, underclaimBBBInspect3Prob] = game
      .settings.simpleBlind
      ? this.getSimpleInspect3ClaimProbs(game)
      : this.getInspect3ClaimProbs(game);

    if (top3 === PRES3.RRR) {
      //usd to be or RRB
      return this.testProb(
        overclaimFromRRRtoRBBInspect3Prob,
        game,
        currentPresPlayer.name,
        DefaultAction.INSPECT_TOP3_CLAIM,
        'overclaimFromRRRtoRBBInspect3Prob',
        currentPresPlayer.role,
        game.govs.length,
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
        currentPresPlayer.role,
        game.govs.length,
      )
        ? PRES3.RBB
        : top3;
    } else {
      //top3 === PRES3.RBB or RRB
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

  getFascInvConfProb(
    game: Game,
    currentPresPlayer: Player,
    investigatedPlayer: Player,
  ) {
    let fascInvConfProb: number;
    let hitlerInvConfProb: number;
    let vanillaFascInvLibConfProbs = [0.85, 0.95, 1, 1, 1]; //based on number of blues down
    let hitlerInvLibConfProbs = [0.65, 0.8, 0.9, 0.95, 1]; //based on number of blues down
    const currentChanPlayer = this.logicService.getCurrentChan(game);

    if (this.inConflict(game, currentPresPlayer, investigatedPlayer)) {
      return (fascInvConfProb = 1);
    }
    if (this.doubleDipping(game)) {
      if (
        currentPresPlayer.role !== Role.HITLER ||
        this.knownRoleToHitler(game, currentChanPlayer)
      ) {
        if (currentChanPlayer.team === Team.LIB) {
          //conf another lib 60%, conf hitler 20%, conf vanilla 40%
          fascInvConfProb =
            investigatedPlayer.team === Team.LIB
              ? 0.6
              : investigatedPlayer.role === Role.HITLER
              ? 0.15
              : 0.33;
          hitlerInvConfProb = investigatedPlayer.team === Team.LIB ? 0.4 : 0.2;
        } else {
          //if confed a fasc, 100% conf a lib, 0% conf another fasc
          fascInvConfProb = investigatedPlayer.team === Team.LIB ? 1 : 0;
          hitlerInvConfProb = fascInvConfProb;
        }
      } else {
        //hitler and blind. Less likely to double conf. Definitely don't fasc fasc conf after blind conflicting someone else
        hitlerInvConfProb = investigatedPlayer.team === Team.LIB ? 0.5 : 0;
      }
      return currentPresPlayer.role === Role.HITLER
        ? hitlerInvConfProb
        : fascInvConfProb;
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
      if (game.deck.deckNum === 1) {
        //must be claiming 3 red because otherwise double dipping
        //if 3 red and more than 2 underclaims - create fasc fasc conf
        //if 3 red and 2 underclaims - create fasc fasc conf 60%
        if (underclaimTotal > 2) {
          fascInvConfProb = 1;
        } else if (underclaimTotal === 2) {
          fascInvConfProb = 0.6;
        }
      }
    }

    //can't have a confirm lib if all inv's haven't taken place yet since can't have enough confs before 2 reds down
    return fascInvConfProb;
  }

  getInspect3ClaimProbs(game: Game) {
    let overclaimFromRRRtoRBBInspect3Prob = 0;
    let underclaimBBBInspect3Prob = 1;
    if (game.deck.justReshuffled) {
      game.deck.deckNum++;
    }

    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const blueProbs = this.probabilityofDrawingBlues(game);
    const underclaimTotal = this.underclaimTotal(game);
    //I think only if 3R ? If one B doesn't seem worth it
    if (currentPresPlayer.role !== Role.HITLER && blueProbs[2] !== 0) {
      overclaimFromRRRtoRBBInspect3Prob = 0.6 + 0.2 * underclaimTotal;
    }

    if (game.deck.justReshuffled) {
      game.deck.deckNum--;
    }
    return [overclaimFromRRRtoRBBInspect3Prob, underclaimBBBInspect3Prob];
  }

  getPresDropProbs(game: Game) {
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const currentChanPlayer = this.logicService.getCurrentChan(game);
    const bluesPlayedByPres = currentPresPlayer.bluesPlayed;
    const numberOf3RedLibs = this.numberOf3RedLibsOnThisDeck(game);
    const numberOf3RedFascs = this.numberOf3RedFascsOnThisDeck(game);
    const underclaimTotal = this.underclaimTotal(game);
    const blueProbs = this.probabilityofDrawingBlues(game);

    let vanillaFascPresRBBDropProb: number,
      hitlerPresRBBDropProb: number,
      vanillaFascPresRRBDropProb: number,
      hitlerPresRRBDropProb: number;

    //vanillaFasc RBB and Hitler RBB

    switch (game.deck.deckNum) {
      case 1:
        vanillaFascPresRBBDropProb =
          numberOf3RedFascs > numberOf3RedLibs
            ? 0
            : underclaimTotal >= 2
            ? 0
            : underclaimTotal === 1
            ? 0.25
            : underclaimTotal <= -1
            ? 1
            : 0.5 + 0.25 * (numberOf3RedLibs - numberOf3RedFascs);

        hitlerPresRBBDropProb =
          game.LibPoliciesEnacted === 2
            ? 0.9
            : game.LibPoliciesEnacted === 3
            ? 1
            : 0.6;

        if (this.deck1FinalGovBlueCountTooLow(game, 2)) {
          hitlerPresRBBDropProb = 0;
        }

        break;
      case 2:
        vanillaFascPresRBBDropProb = 0.9;
        hitlerPresRBBDropProb = 0.9;
        break;
      default:
    }

    if (
      (currentChanPlayer.role === Role.FASC ||
        (currentChanPlayer.role === Role.HITLER &&
          this.knownFascistToHitler(game, currentPresPlayer))) &&
      (this.isPower(game) || game.LibPoliciesEnacted > 1)
    ) {
      vanillaFascPresRBBDropProb = 1;
    }

    if (
      this.knownFascistToHitler(game, currentChanPlayer) &&
      (this.isPower(game) || game.LibPoliciesEnacted > 1)
    ) {
      hitlerPresRBBDropProb = 1;
    }

    if (game.LibPoliciesEnacted === 3 && currentChanPlayer.team === Team.LIB) {
      vanillaFascPresRBBDropProb = 0.1;
    }
    if (
      game.LibPoliciesEnacted === 3 &&
      this.knownLibToHitler(game, currentChanPlayer)
    ) {
      hitlerPresRBBDropProb = 0.1;
    }

    //hitler knows the chan is fasc since the person that conflicted hitler also conflicted them, same with cucu

    //RBB special cases

    //if in anti dd with a lib and deck count low, bad to drop if a blue going down anyway
    if (this.isAntiDD(game)) {
      hitlerPresRBBDropProb = 1;
      vanillaFascPresRBBDropProb = 1;
    }

    if (this.isCucu(game)) {
      hitlerPresRBBDropProb = 1;
      vanillaFascPresRBBDropProb = 1;
    }

    if (game.LibPoliciesEnacted === 4) {
      hitlerPresRBBDropProb = 1;
      vanillaFascPresRBBDropProb = 1;
    }

    //vanillaFasc RRB

    vanillaFascPresRRBDropProb = 1;
    if (currentChanPlayer.team === Team.FASC) {
      //if chan is not hitler or they are hitler but it's an early blue for no power, always pass blue
      //don't pass in cucu because you were inved lib, think you are lib, you need to drop to show you are fasc
      if (
        currentChanPlayer.role !== Role.HITLER ||
        this.knownFascistToHitler(game, currentPresPlayer)
      ) {
        vanillaFascPresRRBDropProb = 0;
      } else if (game.LibPoliciesEnacted <= 1 && !this.isPower(game)) {
        vanillaFascPresRRBDropProb = 0;
      } else if (game.LibPoliciesEnacted <= 3 && !this.isPower(game)) {
        vanillaFascPresRRBDropProb = 0.4;
      }

      if (this.isAntiDD(game)) {
        //if antiDD with a lib, drop, otherwise pass to fasc
        vanillaFascPresRRBDropProb =
          currentChanPlayer.role === Role.LIB ? 1 : 0;
      }
      if (this.isCucu(game)) {
        //dropping here helps confirm you are fasc since you were inved lib
        vanillaFascPresRRBDropProb = 1;
      }
    }

    //hilter RRB

    const additionalProbForPower = this.isPower(game) ? 0.3 : 0;

    const hitlerPresRRBDropProbs = [
      [0.25, null, null, null, null],
      [0.4, 0.3, null, null, null],
      [
        0.9 + additionalProbForPower,
        0.5 + additionalProbForPower,
        0.7 + additionalProbForPower,
        null,
        null,
      ],
      [1, 1, 1, 1, null],
      [1, 1, 1, 1, 1],
    ];

    hitlerPresRRBDropProb =
      hitlerPresRRBDropProbs[game.LibPoliciesEnacted][bluesPlayedByPres];

    //drop unless you know chan is fasc
    if (this.isAntiDD(game)) {
      hitlerPresRRBDropProb = this.knownFascistToHitler(game, currentChanPlayer)
        ? 0
        : 1;
    }
    if (this.isCucu(game)) {
      hitlerPresRRBDropProb = 1;
    }

    if (game.FascPoliciesEnacted >= 3) {
      //auto win or take gun
      //vanillaFascPresRRBDropProb = 1 already prob 1 unless it's fasc fasc anyway and the chancellor drops with prob 1 in this scenario
      hitlerPresRRBDropProb = 1;
    }

    //have to discard if not possible to have drawn that number of blues
    if (blueProbs[2] === 0) {
      hitlerPresRBBDropProb = 1;
      vanillaFascPresRBBDropProb = 1;
    }
    if (blueProbs[1] === 0) {
      hitlerPresRRBDropProb = 1;
      vanillaFascPresRRBDropProb = 1;
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
    const blueProbs = this.probabilityofDrawingBlues(game);
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

    if (game.players.length < 7 || game.players.length === 8) {
      if (game.LibPoliciesEnacted <= 2) {
        hitlerChanDropProb = 0.1;
        vanillaFascChanDropProb = 0.2;
      }
    }

    //fasc fasc and power - drop, otherwise play blue
    if (currentPresPlayer.team === Team.FASC) {
      if (this.isPower(game)) {
        vanillaFascChanDropProb = 1;
        if (this.knownFascistToHitler(game, currentPresPlayer)) {
          hitlerChanDropProb = 1;
        }
      } else if (game.LibPoliciesEnacted <= 1) {
        vanillaFascChanDropProb = game.LibPoliciesEnacted === 0 ? 0.05 : 0.1;
        if (this.knownFascistToHitler(game, currentPresPlayer)) {
          hitlerChanDropProb = game.LibPoliciesEnacted === 0 ? 0.05 : 0.1;
        }
      }
    } else {
      //less likely to give inv
      if (game.LibPoliciesEnacted <= 1 && this.invPower(game, true)) {
        vanillaFascChanDropProb =
          game.players.length === 7
            ? 0.3
            : game.players.length <= 8
            ? 0.1
            : 0.65; //in 9 and 10, more likely to give inv
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
          vanillaFascChanDropProb = 0.75; //more likely to fail it
        }
      }
    }

    //have to discard if all blues already claimed
    if (blueProbs[1] === 0) {
      //dont put hitler here - can gain good credit and also could contradict the not out on cucu
      vanillaFascChanDropProb = 1;
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
        vanillaFascChanDropProb = 0.25;
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

      //super low blue down - really afford to play blue no matter what
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

  /**
   *
   * underclaim if no underlcaims already or a lib drew 3 red
   * overclaim if too many underclaims or some underclaims but no lib 3 red
   */
  getFascFascBlueChanClaim(game: Game) {
    const underclaimTotal = this.underclaimTotal(game);
    const numberOf3RedLibs = this.numberOf3RedLibsOnThisDeck(game);
    const numberOf3RedFascs = this.numberOf3RedFascsOnThisDeck(game);

    let RBOverclaimProb: number, BBUnderclaimProb: number;

    //BB case
    switch (game.deck.deckNum) {
      case 1:
        if (underclaimTotal <= -1) {
          BBUnderclaimProb = 1;
        } else if (
          underclaimTotal <= 1 &&
          numberOf3RedLibs >= numberOf3RedFascs
        ) {
          BBUnderclaimProb =
            0.7 + 0.15 * (numberOf3RedLibs - numberOf3RedFascs);
        } else {
          BBUnderclaimProb = 0;
        }
        break;
      case 2:
        BBUnderclaimProb = 1;
        break;
      default:
        BBUnderclaimProb = 1;
    }
    //RB case
    switch (game.deck.deckNum) {
      case 1:
        if (numberOf3RedLibs > numberOf3RedFascs) {
          RBOverclaimProb = 0;
        } else if (underclaimTotal === 0 && this.deck1BlueCount(game) <= 3) {
          RBOverclaimProb = 0.5;
        } else if (underclaimTotal === 1) {
          RBOverclaimProb = 0.7 + 0.15 * (numberOf3RedFascs - numberOf3RedLibs);
        } else if (underclaimTotal >= 2) {
          RBOverclaimProb = 1;
        } else if (this.deck1FinalGovBlueCountTooLow(game, 2)) {
          RBOverclaimProb = 1;
        } else {
          RBOverclaimProb = 0;
        }
        break;
      case 2:
        RBOverclaimProb = 0;
        break;
      default:
        RBOverclaimProb = 0;
    }
    return [BBUnderclaimProb, RBOverclaimProb];
  }

  getPresClaimWithLibProbs(game: Game) {
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const currentChanPlayer = this.logicService.getCurrentChan(game);
    const underclaimTotal = this.underclaimTotal(game);
    const blueCount = this.blueCountOnThisDeck(game);
    const numberOf3RedLibs = this.numberOf3RedLibsOnThisDeck(game);
    const numberOf3RedFascs = this.numberOf3RedFascsOnThisDeck(game);
    const bluesToBeginTheDeck = this.bluesToBeginTheDeck(
      game,
      game.deck.deckNum,
    );
    let fascBBBunderclaimProb: number,
      fascRBBoverclaimProb: number,
      fascRRRconfProb: number,
      fascRRBconfProb: number;

    const fascRRBoverclaimProb = 0;

    //BBB underclaim and RBB overclaim probs

    switch (game.deck.deckNum) {
      case 1:
        fascBBBunderclaimProb =
          numberOf3RedLibs > numberOf3RedFascs
            ? 1
            : numberOf3RedFascs === numberOf3RedLibs
            ? 0.75
            : 0;
        fascRBBoverclaimProb =
          numberOf3RedLibs > numberOf3RedFascs
            ? 0
            : underclaimTotal >= 2
            ? 1
            : underclaimTotal === 1
            ? 0.75
            : this.deck1FinalGovBlueCountTooLow(game, 3)
            ? 0.6 + 0.2 * (numberOf3RedFascs - numberOf3RedLibs)
            : game.deck.drawPileLengthBeforeDraw3 >= 12 && blueCount <= 1
            ? 0.25
            : 0;
        break;
      case 2:
        fascBBBunderclaimProb = 1;
        fascRBBoverclaimProb = 0;
        break;
      default:
        fascBBBunderclaimProb = 0;
        fascRBBoverclaimProb = 0;
    }

    //RRR conf and RRB conf
    const fascRRBconfProbs = [0.75, 0.85, 0.95, 1, 1];
    const fascRRRconfProbs = [0.4, 0.6, 0.8, 0.9, 1];
    fascRRRconfProb = fascRRRconfProbs[game.LibPoliciesEnacted];
    fascRRBconfProb = fascRRBconfProbs[game.LibPoliciesEnacted];

    switch (game.deck.deckNum) {
      case 1:
        if (underclaimTotal >= 1 && numberOf3RedFascs >= numberOf3RedLibs) {
          fascRRRconfProb += 0.25 * underclaimTotal;
        }
        break;
      case 2:
        fascRRBconfProb = 1;
        if (underclaimTotal >= 1) {
          //means a fasc was already pres and underclaimed, need to conf to avoid having to shoot that pres
          fascRRRconfProb = 1;
        }
        break;
    }

    if (this.invPower(game, false)) {
      fascRRBconfProb = 0.5;
      fascRRRconfProb = Math.min(fascRRRconfProb, 0.5);
    }

    if (this.deck1FinalGovBlueCountTooLow(game, 3)) {
      fascRRRconfProb = 1;
      fascRRBconfProb = 1;
    }

    if (game.players.length < 7 || game.players.length === 8) {
      fascRRBconfProb = 0.2;
      fascRRRconfProb = 0.1;
    }

    if (blueCount >= bluesToBeginTheDeck) {
      fascRRRconfProb = 0;
      fascRRBconfProb = 0;
    }

    if (
      currentPresPlayer.role === Role.HITLER &&
      !this.knownLibToHitler(game, currentChanPlayer)
    ) {
      [fascRRBconfProb, fascRRRconfProb] = this.getHitlerBlindConfProbs(game);
    }

    //can't conf someone you investigated as lib or a confirmed lib
    if (
      game.invClaims.some(
        (inv) =>
          inv.investigator === game.currentPres &&
          inv.investigatee === game.currentChan &&
          inv.claim === Team.LIB,
      ) ||
      this.confirmedLib(game, currentChanPlayer)
    ) {
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
    const numberOf3RedLibs = this.numberOf3RedLibsOnThisDeck(game);
    const numberOf3RedFascs = this.numberOf3RedFascsOnThisDeck(game);
    const bluesToBeginTheDeck = this.bluesToBeginTheDeck(
      game,
      game.deck.deckNum,
    );
    const blueCount = this.blueCountOnThisDeck(game);
    const bluesDrawn = draws3.indexOf(pres3);
    const BBBOverclaimAmount = 3 - bluesDrawn;

    let BBBfromBBclaimProb: number; //more like chanClaimedBB reglaredless of what you had
    let fascFascConfProb = 0;

    switch (game.deck.deckNum) {
      case 1:
        if (pres3 === PRES3.BBB) {
          //essentially deciding if claim correct or underclaim
          BBBfromBBclaimProb =
            numberOf3RedLibs > numberOf3RedFascs
              ? 0
              : numberOf3RedFascs === numberOf3RedLibs
              ? 0.25
              : 1;
        } else {
          BBBfromBBclaimProb =
            numberOf3RedLibs > numberOf3RedFascs
              ? 0
              : underclaimTotal - BBBOverclaimAmount >= 1
              ? 1
              : this.deck1FinalGovBlueCountTooLow(game, 3)
              ? 0.6 + 0.2 * (numberOf3RedFascs - numberOf3RedLibs)
              : underclaimTotal - BBBOverclaimAmount === 0
              ? 0.75
              : underclaimTotal - BBBOverclaimAmount === -1 &&
                game.deck.drawPileLengthBeforeDraw3 >= 12 &&
                blueCount <= 1 //going to set the underclaimTotal to -1 (1 overclaim)
              ? 0.25
              : 0;
        }
        break;
      case 2:
        BBBfromBBclaimProb = 0;
        break;
      default:
    }

    if (game.deck.deckNum === 1) {
      if (underclaimTotal + bluesDrawn >= 3) {
        fascFascConfProb = 0.95;
      } else if (underclaimTotal + bluesDrawn === 2) {
        fascFascConfProb = 0.35;
      }

      if (this.isCucu(game)) {
        if (currentChanPlayer.role === Role.HITLER) {
          fascFascConfProb = 0;
        } else {
          //when to conf the cucu
          if (underclaimTotal + bluesDrawn >= 2) {
            fascFascConfProb = 0.95;
          } else if (this.deck1FinalGovBlueCountTooLow(game, 3)) {
            fascFascConfProb = 0.95;
          } else if (underclaimTotal + bluesDrawn === 1) {
            fascFascConfProb = 0.4;
          }
        }
      }
    }

    if (this.isAntiDD(game)) {
      fascFascConfProb = 0;
    }

    if (game.FascPoliciesEnacted > 3) {
      fascFascConfProb = 0;
    }

    if (blueCount >= bluesToBeginTheDeck) {
      fascFascConfProb = 0;
    }

    if (
      currentPresPlayer.role === Role.HITLER &&
      !this.knownFascistToHitler(game, currentChanPlayer)
    ) {
      const [hiterRRBConfProb, hitlerRRRConfProb] =
        this.getHitlerBlindConfProbs(game);
      fascFascConfProb =
        pres3 === PRES3.RRR ? hitlerRRRConfProb : hiterRRBConfProb;
      //this will be returning based on RRR and RRB...
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

    return [fascFascConfProb, BBBfromBBclaimProb];
  }

  //it's possible the deck 2 conf probs are too high in most cases
  //it's definitely good for the 3B 2R RRB conf necessity
  getHitlerBlindConfProbs(game: Game) {
    const hitlerPlayer = this.logicService.getHitler(game);
    const chanPlayer = this.logicService.getCurrentChan(game);
    const bluesPlayedByHitler = hitlerPlayer.bluesPlayed;
    const bluesPlayedByChan = chanPlayer.bluesPlayed;
    const blueCount = this.blueCountOnThisDeck(game);
    const blueProbs = this.probabilityofDrawingBlues(game);
    const underclaimTotal = this.underclaimTotal(game);

    let RRRHitlerBlindConfProb = 0.3;
    let RRBHitlerBlindConfProb = 0.4;

    switch (game.deck.deckNum) {
      case 1:
        //idea is the more blues the chan has played, the more likely they are lib and important it is to take them out
        //the more blues you've played, the more you've commited to getting elected in hitler zone so avoid conflict
        RRRHitlerBlindConfProb =
          RRRHitlerBlindConfProb +
          0.2 * (bluesPlayedByChan - bluesPlayedByHitler);
        if (underclaimTotal <= 0) {
          RRRHitlerBlindConfProb = Math.min(
            RRRHitlerBlindConfProb,
            0.2 * (1 + underclaimTotal),
          );
        }
        RRBHitlerBlindConfProb =
          RRBHitlerBlindConfProb +
          0.2 * (bluesPlayedByChan - bluesPlayedByHitler) +
          0.25 * underclaimTotal;
        break;
      case 2:
        //if next player will shoot, really can't claim RRR and drop
        RRBHitlerBlindConfProb =
          1 - blueProbs[0] + (game.FascPoliciesEnacted === 3 ? 0.25 : 0);
        RRRHitlerBlindConfProb = 1 - blueProbs[0];
        break;
    }

    if (this.invPower(game, false)) {
      RRRHitlerBlindConfProb = Math.min(RRRHitlerBlindConfProb, 0.5);
      RRBHitlerBlindConfProb = Math.min(RRBHitlerBlindConfProb, 0.5);
    }

    if (game.players.length < 7 || game.players.length === 8) {
      RRRHitlerBlindConfProb = 0.1;
      RRBHitlerBlindConfProb = 0.1;
    }

    if (this.deck1FinalGovBlueCountTooLow(game, 3)) {
      RRRHitlerBlindConfProb = 1;
      RRBHitlerBlindConfProb = 1;
    }

    if (blueCount >= this.bluesToBeginTheDeck(game, game.deck.deckNum)) {
      RRRHitlerBlindConfProb = 0;
      RRBHitlerBlindConfProb = 0;
    }

    if (game.FascPoliciesEnacted === 4) {
      //don't conf with first gun
      RRRHitlerBlindConfProb = 0;
      RRBHitlerBlindConfProb = 0;
    }

    return [RRBHitlerBlindConfProb, RRRHitlerBlindConfProb];
  }

  testProb(
    threshold: number,
    game: Game,
    playerName: string,
    actionName: DefaultAction,
    probabilityName: string,
    role: Role,
    govNum: number,
  ) {
    const randomProb = Math.random();
    game.defaultProbabilityLog.push({
      randomProb,
      threshold,
      playerName,
      actionName,
      probabilityName,
      role,
      govNum,
    });
    return randomProb < threshold;
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

  numberOf3RedLibsOnThisDeck(game: Game) {
    return game.govs.reduce((acc, gov) => {
      const presPlayer = this.logicService.findPlayerIngame(game, gov.pres);
      return gov.deckNum === game.deck.deckNum &&
        presPlayer.team === Team.LIB &&
        gov.presClaim === PRES3.RRR
        ? acc + 1
        : acc;
    }, 0);
  }

  numberOf3RedFascsOnThisDeck(game: Game) {
    return game.govs.reduce((acc, gov) => {
      const presPlayer = this.logicService.findPlayerIngame(game, gov.pres);
      return gov.deckNum === game.deck.deckNum &&
        presPlayer.team === Team.FASC &&
        gov.presClaim === PRES3.RRR
        ? acc + 1
        : acc;
    }, 0);
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
  //NOT GOOD as the current gov is not added yet, so it's not factoring in if they were just 3 red
  is3Red(game: Game, playerName: string) {
    return game.govs.some(
      (gov) => gov.pres === playerName && gov.presClaim === PRES3.RRR,
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
  isPower(game: Game, beforePolicyEnacted = true) {
    const redsDown = game.FascPoliciesEnacted;
    const numPlayers = game.players.length;
    return (
      numPlayers >= 9 || (numPlayers >= 7 && redsDown >= 1) || redsDown >= 2
    );
  }

  invPower(game: Game, beforePolicyEnacted: boolean) {
    const redsDown = beforePolicyEnacted
      ? game.FascPoliciesEnacted + 1
      : game.FascPoliciesEnacted;
    const numPlayers = game.players.length;
    return (
      (numPlayers >= 9 && (redsDown === 1 || redsDown === 2)) ||
      (numPlayers >= 7 && redsDown === 2)
    );
  }

  //true before the policy is enacted - for discards and plays, not claims
  gunPower(game: Game, beforePolicyEnacted = true) {
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

  confirmedLib(game: Game, player: Player, fromHitlerPOV?: boolean) {
    //adding the fromHitlerPOV flag checks if the player is confirmed lib to Hitler (since hitler knows they are fasc)
    if (player.team !== Team.LIB) {
      return false;
    } else if (fromHitlerPOV && game.settings.hitlerKnowsFasc) {
      return true;
    }
    // else if (this.inAnyConflict(game, player)) {
    //   return false;
    // }
    const allPossibleLines = this.allPossibleLines(game, fromHitlerPOV);
    if (allPossibleLines.every((line) => !line.includes(player.name))) {
      return true;
    }

    if (
      game.players.length <= 6 &&
      (player.confirmedNotHitler || fromHitlerPOV) &&
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
      (fromHitlerPOV &&
        game.players.some(
          (player) =>
            this.knownFascistToHitler(game, player) &&
            !fascists.includes(player.name),
        ))
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

  knownRoleToHitler(game: Game, player: Player) {
    return (
      this.knownLibToHitler(game, player) ||
      this.knownFascistToHitler(game, player)
    );
  }

  knownLibToHitler(game: Game, player: Player) {
    return this.confirmedLib(game, player, true);
  }

  knownFascistToHitler(game: Game, player: Player) {
    if (player.team !== Team.FASC) {
      return false;
    }
    if (player.role === Role.HITLER) {
      return true;
    }

    if (game.settings.hitlerKnowsFasc) {
      return true;
    }
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

  //deck count related functions

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

  nChooseR(n: number, r: number) {
    if (r > n || n < 0 || r < 0) {
      return 0;
    }
    let nCr = 1;
    for (let i = 0; i < r; i++) {
      nCr *= n - i;
      nCr = nCr / (i + 1);
    }
    return nCr;
  }

  probabilityofDrawingBlues(game: Game) {
    const n = game.deck.drawPileLengthBeforeDraw3;
    const blueProbs = [];
    const totalBlues = this.bluesToBeginTheDeck(game, game.deck.deckNum);
    const blueCount = this.blueCountOnThisDeck(game);
    const bluesLeft = totalBlues - blueCount;
    for (let blues = 0; blues <= 3; blues++) {
      blueProbs[blues] =
        (this.nChooseR(bluesLeft, blues) *
          this.nChooseR(n - bluesLeft, 3 - blues)) /
        this.nChooseR(n, 3);
    }
    return blueProbs;
  }

  expectedValueOfBlues(game: Game) {
    const blueProbs = this.probabilityofDrawingBlues(game);
    const EV = blueProbs.reduce((acc, prob, blues) => acc + prob * blues, 0);
    return EV;
  }

  deck1FinalGovBlueCountTooLow(game: Game, blueCount: number) {
    return (
      game.deck.deckNum === 1 &&
      game.deck.drawPileLengthBeforeDraw3 <= 5 &&
      this.blueCountOnThisDeck(game) <= blueCount
    );
  }

  /**
   * Simple probs
   */

  /**
   *
   * Always change the count to signal
   */
  getSimpleFascFascBlueChanClaim(game: Game) {
    //only here for hitler if hitler knows fasc fasc
    const BBUnderclaimProb = 1;
    const RBOverclaimProb = 1;
    return [BBUnderclaimProb, RBOverclaimProb];
  }

  /**
   * no fasc fasc conflicts ever
   * vanilla fasc always conf
   * hitler according to array
   */
  getSimpleFascInvConfProb(
    game: Game,
    currentPresPlayer: Player,
    investigatedPlayer: Player,
  ) {
    let fascInvConfProb: number;
    const hitlerInvLibConfProbs = [0.65, 0.8, 0.9, 0.95, 1]; //based on number of blues down

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
   * hitler uses same matrix and doesn't out in cucu
   */
  getSimpleChanDropProbs(game: Game) {
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const currentChanPlayer = this.logicService.getCurrentChan(game);
    const bluesPlayedByChan = currentChanPlayer.bluesPlayed;
    const vanillaFascChanDropProb = 1;

    let hitlerChanDropProb: number;

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

    if (this.isCucu(game) && currentPresPlayer.team === Team.LIB) {
      hitlerChanDropProb = 0; //don't out
    }

    if (game.LibPoliciesEnacted === 4 || game.FascPoliciesEnacted === 5) {
      hitlerChanDropProb = 1;
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
    const bluesPlayedByPres = currentPresPlayer.bluesPlayed;

    let hitlerPresRRBDropProb: number;

    const vanillaFascPresRBBDropProb = 1;
    const vanillaFascPresRRBDropProb = 1;
    const hitlerPresRBBDropProb = 1;

    const additionalProbForPower = this.isPower(game) ? 0.3 : 0;

    const hitlerPresRRBDropProbs = [
      [0.25, null, null, null, null],
      [0.4, 0.3, null, null, null],
      [
        0.9 + additionalProbForPower,
        0.5 + additionalProbForPower,
        0.7 + additionalProbForPower,
        null,
        null,
      ],
      [1, 1, 1, 1, null],
      [1, 1, 1, 1, 1],
    ];

    hitlerPresRRBDropProb =
      hitlerPresRRBDropProbs[game.LibPoliciesEnacted][bluesPlayedByPres];

    if (game.FascPoliciesEnacted >= 3) {
      //auto win or take gun
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

  getSimplePresClaimWithLibProbs(game: Game) {
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const currentChanPlayer = this.logicService.getCurrentChan(game);

    const fascBBBunderclaimProb = 1;
    const fascRRBoverclaimProb = 1;
    const fascRBBoverclaimProb = 1;
    let fascRRRconfProb = 1;
    let fascRRBconfProb = 1;

    if (
      currentPresPlayer.role === Role.HITLER &&
      !this.knownLibToHitler(game, currentChanPlayer)
    ) {
      [fascRRBconfProb, fascRRRconfProb] =
        this.getSimpleHitlerBlindConfProbs(game);
    }

    return [
      fascRRBconfProb,
      fascBBBunderclaimProb,
      fascRRRconfProb,
      fascRRBoverclaimProb,
      fascRBBoverclaimProb,
    ];
  }

  getSimplePresClaimWithFascProbs(game: Game) {
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const currentChanPlayer = this.logicService.getCurrentChan(game);
    const pres3 = this.determine3Cards(game.presCards);

    const BBBfromBBclaimProb =
      pres3 === PRES3.BBB ? 0 : pres3 === PRES3.RBB ? 1 : 0;
    let fascFascConfProb = 0;
    if (
      currentPresPlayer.role === Role.HITLER &&
      !this.knownFascistToHitler(game, currentChanPlayer)
    ) {
      const [RRBHitlerBlindConfProb, RRRHitlerBlindConfProb] =
        this.getSimpleHitlerBlindConfProbs(game);
      fascFascConfProb =
        pres3 === PRES3.RRR ? RRRHitlerBlindConfProb : RRBHitlerBlindConfProb;
    }

    return [fascFascConfProb, BBBfromBBclaimProb];
  }

  getSimpleInspect3ClaimProbs(game: Game) {
    const currentPresPlayer = this.logicService.getCurrentPres(game);
    const overclaimFromRRRtoRBBInspect3Prob =
      currentPresPlayer.role === Role.HITLER ? 0 : 1;
    const underclaimBBBInspect3Prob = 1;

    return [overclaimFromRRRtoRBBInspect3Prob, underclaimBBBInspect3Prob];
  }

  getSimpleHitlerBlindConfProbs(game: Game) {
    const hitlerPlayer = this.logicService.getHitler(game);
    const chanPlayer = this.logicService.getCurrentChan(game);
    const bluesPlayedByHitler = hitlerPlayer.bluesPlayed;
    const bluesPlayedByChan = chanPlayer.bluesPlayed;
    const underclaimTotal = this.underclaimTotal(game);

    let RRRHitlerBlindConfProb = 0.3;
    let RRBHitlerBlindConfProb = 0.4;

    switch (game.deck.deckNum) {
      case 1:
        //idea is the more blues the chan has played, the more likely they are lib and important it is to take them out
        //the more blues you've played, the more you've commited to getting elected in hitler zone so avoid conflict
        RRRHitlerBlindConfProb =
          RRRHitlerBlindConfProb +
          0.2 * (bluesPlayedByChan - bluesPlayedByHitler);
        if (underclaimTotal <= 0) {
          RRRHitlerBlindConfProb = Math.min(
            RRRHitlerBlindConfProb,
            0.2 * (1 + underclaimTotal),
          );
        }
        RRBHitlerBlindConfProb =
          RRBHitlerBlindConfProb +
          0.2 * (bluesPlayedByChan - bluesPlayedByHitler) +
          0.25 * underclaimTotal;
        break;
      case 2:
        RRBHitlerBlindConfProb = 1;
        RRRHitlerBlindConfProb = 1;
        break;
      default:
        RRBHitlerBlindConfProb = 0;
        RRRHitlerBlindConfProb = 0;
    }

    return [RRBHitlerBlindConfProb, RRRHitlerBlindConfProb];
  }
}
/**
 * ideas:
 * underclaiming decision times:
 *  -RBB presDiscard
 *  -RRB drop conf or claim RRR
 *  -BBB claim RBB
 *
 * deck 1:
 * safe: first 4 govs - underclaim total is not too low
 * last gov - shouldn't make claim 4 or less
 *
 * deck 2:
 *  -depends on probabilities!!!
 *
 * overclaiming decision times
 *  -BB claim to BBB
 *  -fasc fasc and RB to BB chan claim
 *
 * depends not only on proabailiities, but future probobabilities meaning what you drew. If you drew RRR on second deck, claiming RRR is different than RRB and dropping even though the probs were the same.
 *
 */
