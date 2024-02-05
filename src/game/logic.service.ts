import { BadRequestException, Injectable } from '@nestjs/common';
import {
  LogType,
  CHAN2,
  Color,
  Conf,
  GameType,
  PRES3,
  Policy,
  RRR,
  Role,
  Status,
  Team,
  Vote,
  draws2,
  draws3,
  gameRoles,
  gameTeams,
  gameIdentities,
} from '../consts';
import { Game } from '../models/game.model';
import { Card } from 'src/models/card.model';
import { Deck } from 'src/models/deck.model';
import { getFormattedDate, isBlindSetting } from '../helperFunctions';
import { delay } from 'rxjs';
import { Player } from 'src/models/player.model';

@Injectable()
export class LogicService {
  //initialize the deck here
  startGame(game: Game) {
    game.status = Status.STARTED;
    // game.status = Status.CHOOSE_CHAN
    this.initPlayers(game);
    game.currentPres = game.players[game.presIdx].name;
    this.initDeck(game);
    if (game.settings.redDown) {
      this.removeRed(game.deck);
      game.FascPoliciesEnacted = 1;
      game.LibPoliciesEnacted = 4;
    }

    //in this lib spy version, hitler doesn't know fasc by default
    if (game.players.length < 7 && game.settings.type !== GameType.LIB_SPY) {
      game.settings.hitlerKnowsFasc = true;
    }
    game.log.push({ type: LogType.INTRO_DECK, date: getFormattedDate() });
    game.log.push({ type: LogType.INTRO_ROLES, date: getFormattedDate() });
    if (game.settings.type === GameType.LIB_SPY) {
      game.log.push({ type: LogType.INTRO_LIB_SPY, date: getFormattedDate() });
    }
    if (game.settings.type === GameType.MIXED_ROLES) {
      game.log.push({ type: LogType.INTRO_MIXED, date: getFormattedDate() });
    }
    if (!isBlindSetting(game.settings.type) && game.settings.hitlerKnowsFasc) {
      game.log.push({
        type: LogType.INTRO_HITLER_KNOWS_FASC,
        date: getFormattedDate(),
      });
    }
    if (game.settings.redDown) {
      game.log.push({ type: LogType.INTRO_RED_DOWN, date: getFormattedDate() });
    }
    //individual seta and fascists logs are set in game service after timeout
  }

  initPlayers(game: Game) {
    const randomSort = () => Math.random() - 0.5;
    const playerColors = [
      'blueViolet',
      'yellowGreen',
      'orange',
      'darkGreen',
      'magenta',
    ];
    const teams = gameTeams.slice(1, game.players.length);
    const roles = gameRoles.slice(1, game.players.length);

    game.players.sort(randomSort);
    game.players[0].role = Role.HITLER;
    game.players[0].team = Team.FASC;
    const nonHitlerPlayers = game.players.slice(1);

    if (game.settings.type === GameType.LIB_SPY) {
      roles[1] = Role.LIB_SPY;
    } else if (game.settings.type === GameType.MIXED_ROLES) {
      roles.sort(randomSort);
    }
    // nonHitlerPlayers.sort(randomSort) <- don't think i need this. Make sure still random
    nonHitlerPlayers.forEach((player, idx) => {
      player.team = teams[idx];
      player.role = roles[idx];
    });

    if (game.settings.type === GameType.TOTALLY_BLIND) {
      const identities = gameIdentities
        .slice(0, game.players.length)
        .sort(randomSort);
      game.players.forEach(
        (player, idx) => (player.identity = identities[idx]),
      );
    }

    // if(game.settings.type === GameType.BLIND){
    //   nonHitlerPlayers[0].omniFasc = true
    // }
    game.players.sort(randomSort);
    game.players.forEach(
      (player, idx) => (player.color = playerColors[idx % 5]),
    );
    game.players.sort(randomSort);
  }

  initDeck(game: Game) {
    this.buildDeck(game.deck);
    this.shuffleDeck(game.deck);
  }

  chooseChan(game: Game, chanName: string) {
    game.currentChan = chanName;
    // this.resetVotes(game)
    game.log.push({
      type: LogType.CHOOSE_CHAN,
      date: getFormattedDate(),
      payload: { pres: game.currentPres, chan: chanName },
    });
    game.status = Status.VOTE;
    game.topDecked = false;
  }

  vote(game: Game, name: string, vote: Vote): number {
    const player = this.findPlayerIngame(game, name);
    if (player.vote !== vote) {
      player.vote = vote;
    } else {
      player.vote = null;
    }
    return this.countVotes(game);
  }

  countVotes(game: Game): number {
    const numVotes = game.players.reduce(
      (acc, player) => (player.vote ? acc + 1 : acc),
      0,
    );

    // if(this.numAlivePlayers(game) === numVotes){
    //   game.status = Status.SHOW_VOTE_RESULT
    //   const jas = game.players.reduce((acc, player) => player.vote === Vote.JA ? acc+1 : acc, 0)
    //   const voteSplit = Math.min(jas, numVotes - jas)
    //   return voteSplit
    // }
    // else{
    //   return null
    // }
    if (numVotes > 0) {
      game.status = Status.SHOW_VOTE_RESULT;
      return 0;
    }
  }

  presDiscard(game: Game, cardColor: string) {
    game.presDiscard = game.presCards.find((card) => card.color === cardColor);
    game.chanCards = game.presCards.filter((card) => card !== game.presDiscard);
    this.discard(game.presDiscard, game.deck);
    game.status = Status.CHAN_PLAY;
  }

  chanPlay(game: Game, cardColor: string) {
    game.chanPlay = game.chanCards.find((card) => card.color === cardColor);
    const chanDiscard = game.chanCards.find((card) => card !== game.chanPlay);
    this.discard(chanDiscard, game.deck);
    this.enactPolicy(game, game.chanPlay, false);
  }

  determineResultofVote(game: Game) {
    const jas = game.players.reduce(
      (acc, player) => (player.vote === Vote.JA ? acc + 1 : acc),
      0,
    );
    this.resetVotes(game);
    // if(jas > this.numAlivePlayers(game) / 2){
    if (jas > 0) {
      if (this.checkHitler(game)) {
        game.log.push({
          type: LogType.HITLER_ELECTED,
          date: getFormattedDate(),
        });
        game.status = Status.END_FASC;
        this.outroLogs(game);
      } else {
        if (game.FascPoliciesEnacted >= 3) {
          this.getCurrentChan(game).confirmedNotHitler = true;
        }
        this.presDraw3(game);
      }
    } else {
      //vote didn't pass
      game.log.push({ type: LogType.ELECTION_FAIL, date: getFormattedDate() });
      this.advanceTracker(game, false);
    }
  }

  presDraw3(game: Game) {
    game.presCards = this.draw3(game.deck);
    game.status = Status.PRES_DISCARD;
  }

  //setPrevLocks if it's a vetoAccepted
  advanceTracker(game: Game, setPrevLocks: boolean) {
    game.tracker++;
    if (game.tracker === 3) {
      this.topDeck(game);
      setPrevLocks = false;
    }
    //topdecking may have led to gameover
    if (!(this.gameOver(game) || game.status === Status.LIB_SPY_GUESS)) {
      this.nextPres(game, setPrevLocks);
    }
  }

  nextPres(game: Game, setPrevLocks: boolean) {
    if (setPrevLocks) {
      this.setPrevLocks(game);
    }

    do {
      game.presIdx = (game.presIdx + 1) % game.players.length;
    } while (!game.players[game.presIdx].alive);
    game.currentPres = game.players[game.presIdx].name;
    game.currentChan = null;
    game.status = Status.CHOOSE_CHAN;
  }

  resetVotes(game: Game) {
    for (const player of game.players) {
      player.vote = null;
    }
  }

  gameOver(game: Game) {
    return game.status === Status.END_FASC || game.status === Status.END_LIB;
  }

  topDeck(game: Game) {
    const card = this.topDeckCard(game.deck);

    //enacting policy always resets tracker
    this.enactPolicy(game, card, true);
    this.removePrevLocks(game);
    game.topDecked = true;
  }

  enactPolicy(game: Game, card: Card, topDeck: boolean) {
    if (topDeck) {
      game.log.push({ type: LogType.TOP_DECK, date: getFormattedDate() });
    }
    game.log.push({
      type: LogType.ENACT_POLICY,
      date: getFormattedDate(),
      payload: { policy: card.policy },
    });

    if (card.policy === Policy.LIB) {
      game.LibPoliciesEnacted++;
      if (!topDeck) {
        this.getCurrentPres(game).bluesPlayed++;
        this.getCurrentChan(game).bluesPlayed++;
      }
      if (game.LibPoliciesEnacted === 5) {
        if (game.settings.type === GameType.LIB_SPY) {
          if (!this.libSpyCondition(game)) {
            game.log.push({
              type: LogType.LIB_SPY_FAIL,
              date: getFormattedDate(),
            });
            game.status = Status.END_FASC;
            this.outroLogs(game);
            return;
          } else {
            game.status = Status.LIB_SPY_GUESS;
            game.log.push({
              type: LogType.HITLER_TO_GUESS_LIB_SPY,
              date: getFormattedDate(),
            });
            return;
          }
        } else {
          game.status = Status.END_LIB;
          this.outroLogs(game);
          return;
        }
      }
    } else {
      game.FascPoliciesEnacted++;
      if (game.FascPoliciesEnacted === 6) {
        game.status = Status.END_FASC;
        this.outroLogs(game);
        return;
      }
    }

    //!this.gameOver(game) &&
    if (!topDeck) {
      // this.setPrevLocks(game) //was settting in after pres claim
      // this.determinePower(game) for testing
      game.status = Status.CHAN_CLAIM;
    }
    this.resetTracker(game);
    if (game.deck.drawPile.length < 3) {
      this.reshuffle(game.deck, !topDeck);
      game.log.push({
        type: LogType.SHUFFLE_DECK,
        date: getFormattedDate(),
        payload: {
          libCount: 6 - game.LibPoliciesEnacted,
          fascCount: 11 - game.FascPoliciesEnacted,
        },
      });
    }
  }

  /**
   *
   *      if(!this.libSpyCondition(game)){
            // if(game.settings.teamLibSpy){
              game.status = Status.END_FASC
              game.log.push({type: LogType.LIB_SPY_FAIL})
            // }
            // else{
            //   game.status = Status.END_LIB
            //   game.log.push({type: LogType.LIB_SPY_FAIL})
            // }
          }
          // else{
          //   game.status = Status.END_LIB
          //   game.log.push({type: LogType.LIB_SPY_WIN})
          // }
        }
   *
   */

  presClaim(game: Game, claim: PRES3) {
    game.presClaim = claim;
    game.log.push({
      type: LogType.PRES_CLAIM,
      date: getFormattedDate(),
      payload: { pres: game.currentPres, claim },
    });
    this.addGov(game); //important that the gov is added after the claim since the claim is based on claim count gotten from the govs
    this.determinePolicyConf(game);
    // this.setPrevLocks(game) do this after power and do it inside of nextPres
    this.determinePower(game);
    game.deck.deckNum++;
  }

  addGov(game: Game) {
    game.govs.push({
      deckNum: game.deck.deckNum,
      pres: game.currentPres,
      chan: game.currentChan,
      policyPlayed: game.chanPlay,
      presCards: game.presCards,
      chanCards: game.chanCards,
      presClaim: game.presClaim,
      chanClaim: game.chanClaim,
      underclaim: this.determineUnderClaim(game),
    });
  }

  determinePolicyConf(game: Game) {
    //chan claims 0 blues, pres claims at least 1 blue
    if (
      draws2.indexOf(game.chanClaim) === 0 &&
      draws3.indexOf(game.presClaim) > 0
    ) {
      game.confs.push({
        confer: game.currentPres,
        confee: game.currentChan,
        type: Conf.POLICY,
      });
      this.addIndirectConfs(
        game,
        game.currentPres,
        game.currentChan,
        Conf.POLICY,
      );
    }
  }

  determineUnderClaim(game: Game): number {
    const bluesDrawn = game.presCards.reduce(
      (acc, card) => (card.policy === Policy.LIB ? acc + 1 : acc),
      0,
    );
    return bluesDrawn - draws3.indexOf(game.presClaim);
  }

  determinePower(game: Game) {
    if (game.chanPlay.policy === Policy.FASC) {
      if (game.FascPoliciesEnacted === 1 && game.players.length >= 9) {
        return (game.status = Status.INV);
      } else if (game.FascPoliciesEnacted === 2 && game.players.length >= 7) {
        return (game.status = Status.INV);
      } else if (game.FascPoliciesEnacted === 3 && game.players.length >= 7) {
        return (game.status = Status.SE);
      } else if (game.FascPoliciesEnacted === 3 && game.players.length < 7) {
        game.top3 = this.inspect3(game.deck);
        game.log.push({
          type: LogType.INSPECT_TOP3,
          date: getFormattedDate(),
          payload: { pres: game.currentPres },
        });
        return (game.status = Status.INSPECT_TOP3);
      } else if (
        game.FascPoliciesEnacted === 4 ||
        game.FascPoliciesEnacted === 5
      ) {
        return (game.status = Status.GUN);
      }
    }
    this.nextPres(game, true);
  }

  setPrevLocks(game: Game) {
    game.prevChan = game.currentChan;
    game.prevPres = this.numAlivePlayers(game) > 5 ? game.currentPres : null;
  }

  chanClaim(game: Game, claim: CHAN2) {
    game.chanClaim = claim;
    game.log.push({
      type: LogType.CHAN_CLAIM,
      date: getFormattedDate(),
      payload: { chan: game.currentChan, claim },
    });
    game.status = Status.PRES_CLAIM;
  }

  chooseInv(game: Game, invName: string) {
    const invPlayer = this.findPlayerIngame(game, invName);
    invPlayer.investigated = true;
    this.getCurrentPres(game).investigations.push(invName);
    game.status = Status.INV_CLAIM;
    game.log.push({
      type: LogType.INV,
      date: getFormattedDate(),
      payload: { pres: game.currentPres, investigatee: invName },
    });
  }

  // setInv(game: Game, invName: string){
  // game.status = Status.INV_CLAIM
  // }

  invClaim(game: Game, claim: Team) {
    const investigatee = this.getCurrentPres(game).investigations.slice(-1)[0];
    game.log.push({
      type: LogType.INV_CLAIM,
      date: getFormattedDate(),
      payload: { pres: game.currentPres, investigatee, claim },
    });

    game.invClaims.push({
      investigator: game.currentPres,
      investigatee,
      claim,
    });
    if (claim === Team.FASC) {
      game.confs.push({
        confer: game.currentPres,
        confee: investigatee,
        type: Conf.INV,
      });
      this.addIndirectConfs(game, game.currentPres, investigatee, Conf.INV);
    } else {
      this.addIndirectLibInvs(game, investigatee);
    }

    this.nextPres(game, true);
  }

  chooseSE(game: Game, seName: string) {
    game.log.push({
      type: LogType.SE,
      date: getFormattedDate(),
      payload: { pres: game.currentPres, seName },
    });
    this.setPrevLocks(game);
    game.currentPres = seName;
    game.currentChan = null;
    game.status = Status.CHOOSE_CHAN;
  }

  shootPlayer(game: Game, shotName: string) {
    game.log.push({
      type: LogType.GUN,
      date: getFormattedDate(),
      payload: { pres: game.currentPres, shotName },
    });
    const shotPlayer = this.findPlayerIngame(game, shotName);
    shotPlayer.alive = false;
    if (this.numAlivePlayers(game) <= 5) {
      game.prevPres = null;
    }
    if (shotPlayer.role === Role.HITLER) {
      game.status = Status.END_LIB;
      game.log.push({ type: LogType.HITLER_SHOT, date: getFormattedDate() });
      this.outroLogs(game);
    } else {
      this.nextPres(game, true);
    }
  }

  guessLibSpy(game: Game, spyName: string) {
    const spyGuessPlayer = this.findPlayerIngame(game, spyName);
    spyGuessPlayer.guessedToBeLibSpy = true;
    game.status = Status.SHOW_LIB_SPY_GUESS;
  }

  determineResultOfLibSpyGuess(game: Game, spyName: string) {
    const spyGuessPlayer = this.findPlayerIngame(game, spyName);
    if (spyGuessPlayer.role === Role.LIB_SPY) {
      game.status = Status.END_FASC;
    } else {
      game.status = Status.END_LIB;
    }
    game.log.push({
      type: LogType.LIB_SPY_GUESS,
      date: getFormattedDate(),
      payload: { spyName },
    });
    this.outroLogs(game);
  }

  vetoRequest(game: Game) {
    game.log.push({
      type: LogType.VETO_REQUEST,
      date: getFormattedDate(),
      payload: { chan: game.currentChan },
    });
    game.status = Status.VETO_REPLY;
  }

  vetoReply(game: Game, vetoAccepted: boolean) {
    game.log.push({
      type: LogType.VETO_REPLY,
      date: getFormattedDate(),
      payload: { pres: game.currentPres, vetoAccepted },
    });
    if (vetoAccepted) {
      game.chanCards.forEach((card) => this.discard(card, game.deck));
      // this.setPrevLocks(game)
      if (game.deck.drawPile.length < 3) {
        this.reshuffle(game.deck, false);
        game.log.push({
          type: LogType.SHUFFLE_DECK,
          date: getFormattedDate(),
          payload: {
            libCount: 6 - game.LibPoliciesEnacted,
            fascCount: 11 - game.FascPoliciesEnacted,
          },
        });
      }
      this.advanceTracker(game, true);
    } else {
      game.status = Status.VETO_DECLINED;
    }
  }

  inspect3Claim(game: Game, claim: PRES3) {
    game.log.push({
      type: LogType.INSPECT_TOP3_CLAIM,
      date: getFormattedDate(),
      payload: { pres: game.currentPres, claim },
    });
    this.nextPres(game, true);
  }

  removePrevLocks(game: Game) {
    game.prevChan = null;
    game.prevPres = null;
  }

  resetTracker(game: Game) {
    game.tracker = 0;
  }

  checkHitler(game: Game) {
    return (
      game.FascPoliciesEnacted >= 3 &&
      this.getCurrentChan(game).role === Role.HITLER
    );
  }

  libSpyCondition(game: Game) {
    //return boolean
    const libSpy = game.players.find((player) => player.role === Role.LIB_SPY);
    return game.govs.some(
      (gov) =>
        gov.policyPlayed.policy === Policy.FASC &&
        (libSpy.name === gov.pres || libSpy.name === gov.chan),
    );
  }

  addIndirectLibInvs(game: Game, investigatee: string) {
    const presPlayer = this.getCurrentPres(game);

    const investigateesInvestigations = game.invClaims
      .filter(
        (invClaim) =>
          invClaim.investigator === investigatee && invClaim.claim === Team.LIB,
      )
      .map((invClaim) => invClaim.investigatee);
    investigateesInvestigations.forEach((player) => {
      // presPlayer.investigations.push(player);
      game.invClaims.push({
        investigator: game.currentPres,
        investigatee: player,
        claim: Team.LIB,
      });
      this.addIndirectLibInvs(game, player);
    });
  }

  addIndirectConfs(
    game: Game,
    player1Name: string,
    player2Name: string,
    confType: Conf,
  ) {
    let player1LibChain = [player1Name];
    let player2LibChain = [player2Name];

    setLibChain(player1Name, player1LibChain);
    setLibChain(player2Name, player2LibChain);

    for (const firstPlayer of player1LibChain) {
      for (const secondPlayer of player2LibChain) {
        if (firstPlayer === player1Name && secondPlayer === player2Name) {
          continue;
        }
        game.confs.push({
          confer: firstPlayer,
          confee: secondPlayer,
          type: confType,
        });
      }
    }

    function setLibChain(currentPlayerName: string, libChain: string[]) {
      let nextLib = game.invClaims.find(
        (invClaim) =>
          invClaim.investigatee === currentPlayerName &&
          invClaim.claim === Team.LIB,
      )?.investigator;
      if (nextLib) {
        libChain.push(nextLib);
        setLibChain(nextLib, libChain);
      }
    }
  }

  findPlayerIngame(game: Game, name: string) {
    const player = game.players.find((player) => player.name === name);
    if (!player) {
      throw new BadRequestException(`${name} is not a player in this game`);
    }
    return player;
  }

  numAlivePlayers(game: Game) {
    return game.players.reduce((n, player) => (player.alive ? n + 1 : n), 0);
  }

  getCurrentPres(game: Game) {
    return this.findPlayerIngame(game, game.currentPres);
  }

  getCurrentChan(game: Game) {
    return this.findPlayerIngame(game, game.currentChan);
  }
  getHitler(game: Game) {
    return game.players.find((player) => player.role === Role.HITLER);
  }

  //blind functions

  confirmFasc(game: Game, name: string) {
    const playerTryingToConfirmFasc = this.findPlayerIngame(game, name);
    if (playerTryingToConfirmFasc.team === Team.FASC) {
      playerTryingToConfirmFasc.confirmedFasc = true;
    } else {
      game.log.push({
        type: LogType.CONFIRM_FASC,
        date: getFormattedDate(),
        payload: { name },
      });
      game.status = Status.END_FASC;
      this.outroLogs(game);
    }
  }

  buildDeck(deck: Deck) {
    for (let i = 0; i < 6; i++) {
      deck.drawPile.push({ policy: Policy.LIB, color: Color.BLUE });
    }
    for (let i = 0; i < 11; i++) {
      deck.drawPile.push({ policy: Policy.FASC, color: Color.RED });
    }
  }

  shuffleDeck(deck: Deck) {
    deck.drawPile.sort(() => Math.random() - 0.5);
    deck.drawPile.sort(() => Math.random() - 0.5);
  }

  reshuffle(deck: Deck, delayIncrementDeckNum: boolean) {
    if (!delayIncrementDeckNum) {
      deck.deckNum++;
    }
    deck.drawPile = [...deck.drawPile, ...deck.discardPile];
    deck.discardPile = [];
    this.shuffleDeck(deck);
  }

  topDeckCard(deck: Deck) {
    // if(deck.drawPile.length < 3){
    //   this.reshuffle(deck)
    // }
    return deck.drawPile.pop();
  }

  draw3(deck: Deck) {
    // if(deck.drawPile.length < 3){
    //   this.reshuffle(deck)
    // }
    const card1 = deck.drawPile.pop();
    const card2 = deck.drawPile.pop();
    const card3 = deck.drawPile.pop();
    const top3 = [card1, card2, card3];
    return top3;
  }

  inspect3(deck: Deck) {
    // if(deck.drawPile.length < 3){
    //   this.reshuffle(deck)
    // }
    const n = deck.drawPile.length;
    const card1 = deck.drawPile[n - 1];
    const card2 = deck.drawPile[n - 2];
    const card3 = deck.drawPile[n - 3];
    const top3 = [card1, card2, card3].sort(() => Math.random() - 0.5);
    //says in log that the policies are shuffled
    return top3;
  }

  removeRed(deck: Deck) {
    const redCard = deck.drawPile.find((card) => card.policy === Policy.FASC);
    deck.drawPile = deck.drawPile.filter((card) => card !== redCard);
    this.shuffleDeck(deck);
  }

  discard(card: Card, deck: Deck) {
    deck.discardPile.push(card);
  }

  //call this end messages - state winners and do this with deck
  outroLogs(game: Game) {
    game.log.push({
      type:
        game.status === Status.END_FASC ? LogType.FASC_WIN : LogType.LIB_WIN,
      date: getFormattedDate(),
    });
    if (game.deck.drawPile.length > 0) {
      game.log.push({
        type: LogType.DECK,
        date: getFormattedDate(),
        payload: {
          remainingPolicies: game.deck.drawPile
            .map((card) => card.color)
            .join(''),
        },
      });
    }
  }
}
