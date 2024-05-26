import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { Game } from '../models/game.model';
import { Deck } from '../models/deck.model';
import {
  Status,
  LogType,
  Role,
  GameType,
  Vote,
  PRES3,
  CHAN2,
  Team,
  GameSettings,
  Identity,
} from '../consts';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  EXISTING_GAMES,
  JOIN_GAME,
  LEAVE_GAME,
  UPDATE_GAME,
} from '../consts/socketEventNames';
import { LogicService } from './logic.service';
import { GameRepository } from './game.repository';
import { DefaultActionService } from './defaultAction.service';
import { gameOver, getFormattedDate, isBlindSetting } from '../helperFunctions';
import { UtilService } from './util.service';
import { Player } from 'src/models/player.model';
import { EventsGateway } from './events.gateway';

@Injectable()
export class GameService {
  private deleteGameTimeoutId: NodeJS.Timeout;

  constructor(
    private eventEmitter: EventEmitter2,
    private logicService: LogicService,
    private gameRespository: GameRepository,
    private defaultActionService: DefaultActionService,
    private utilService: UtilService,
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway,
  ) {}

  async createGame(name: string, socketId: string) {
    let id: string;
    let existingGame: Game;
    const letters = 'BCDFGHJKLMNPQRSTVWXYZ';
    do {
      const chosenIdxs = [];
      while (chosenIdxs.length < 4) {
        const idx = Math.floor(Math.random() * 21);
        if (!chosenIdxs.includes(idx)) {
          chosenIdxs.push(idx);
        }
      }
      id = chosenIdxs.map((idx) => letters.charAt(idx)).join('');
      existingGame = await this.gameRespository.get(id);
    } while (existingGame);

    const game: Game = {
      id,
      host: name,
      settings: {
        type: GameType.BLIND,
        redDown: false,
        simpleBlind: false,
        hitlerKnowsFasc: false,
      },
      status: Status.CREATED,
      players: [],
      deck: {
        drawPile: [],
        discardPile: [],
        deckNum: 1,
        justReshuffled: false,
        reshuffleIsBeforeATopDeck: false,
        drawPileLengthBeforeDraw3: 0,
        inspectTop3: [],
      },
      LibPoliciesEnacted: 0,
      FascPoliciesEnacted: 0,
      tracker: 0,
      presIdx: 0,
      SE: null,
      currentPres: null,
      currentChan: null,
      prevPres: null,
      prevChan: null,
      presCards: null,
      chanCards: null,
      presDiscard: null,
      chanPlay: null,
      presClaim: null,
      chanClaim: null,
      log: [],
      chat: [],
      govs: [],
      invClaims: [],
      confs: [],
      remakeId: '',
      topDecked: false,
      vetoAccepted: false,
      defaultProbabilityLog: [],
      alreadyEnded: false,
    };

    await this.gameRespository.set(id, game);
    this.joinGame(id, name, socketId);
    this.eventEmitter.emit(EXISTING_GAMES);
    return id;
  }

  getExistingGames() {
    this.eventEmitter.emit(EXISTING_GAMES);
  }

  async joinGame(id: string, name: string, socketId: string) {
    //in case they bypass the home page and go straight to url - frontend should catch this first anyway
    if (!name) {
      this.utilService.handleError(`You must have a name`);
    }
    const game = await this.utilService.findById(id);

    const playerAlreadyInGame = game.players.find(
      (player) => player.name === name,
    );

    if (!playerAlreadyInGame && game.players.length === 10) {
      this.utilService.handleError(`Game is full`);
    }

    if (playerAlreadyInGame) {
      if (!playerAlreadyInGame.socketId) {
        // console.log('reassigning socketId')
        playerAlreadyInGame.socketId = socketId;
        clearTimeout(this.deleteGameTimeoutId);
      } else {
        if (playerAlreadyInGame.socketId !== socketId) {
          //in case of super fast refresh, can leave without removing socket id from map -> confirm by checking that the socketId associated with the player is in fact still connected
          const confirmedInGame = this.eventsGateway.confirmInGame(
            playerAlreadyInGame.socketId,
          );
          if (confirmedInGame) {
            this.utilService.handleError(
              `A player with that name is already in the game`,
            );
          } else {
            playerAlreadyInGame.socketId = socketId;
            clearTimeout(this.deleteGameTimeoutId);
          }
        }
      }
    } else {
      if (game.status !== Status.CREATED) {
        this.utilService.handleError(`Game already started`);
      } else {
        game.players.push({
          name,
          socketId,
          color: 'black',
          team: Team.LIB,
          role: Role.LIB,
          alive: true,
          vote: null,
          investigated: false,
          investigations: [],
          bluesPlayed: 0,
          confirmedFasc: false,
          libWhoTriedToConfirmFasc: false,
          omniFasc: false,
          guessedToBeLibSpy: false,
          confirmedNotHitler: false,
          identity: Identity.LIB,
        });
        clearTimeout(this.deleteGameTimeoutId);
      }
    }
    await this.utilService.handleUpdate(id, game);
    this.eventEmitter.emit(JOIN_GAME, { socketId, id });
    return game;
  }

  async handleJoinWhenPlayerAlreadyInGame(
    confirmedInGame: boolean,
    playerAlreadyInGame: Player,
    socketId: string,
  ) {
    if (confirmedInGame) {
      this.utilService.handleError(
        `A player with that name is already in the game`,
      );
    } else {
      playerAlreadyInGame.socketId = socketId;
      clearTimeout(this.deleteGameTimeoutId);
    }
  }

  async remakeGame(id: string, name: string) {
    const game = await this.utilService.findById(id);

    let newId: string;
    let existingGame: Game;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    do {
      newId = [1, 2, 3, 4]
        .map(() => letters.charAt(Math.floor(Math.random() * 26)))
        .join('');
      existingGame = await this.gameRespository.get(newId);
    } while (existingGame);

    game.remakeId = newId;

    const newGame: Game = {
      id: newId,
      host: name,
      settings: {
        type: GameType.BLIND,
        redDown: false,
        simpleBlind: false,
        hitlerKnowsFasc: false,
      },
      status: Status.CREATED,
      players: [],
      deck: {
        drawPile: [],
        discardPile: [],
        deckNum: 1,
        justReshuffled: false,
        reshuffleIsBeforeATopDeck: false,
        drawPileLengthBeforeDraw3: 0,
        inspectTop3: [],
      },
      LibPoliciesEnacted: 0,
      FascPoliciesEnacted: 0,
      tracker: 0,
      presIdx: 0,
      SE: null,
      currentPres: null,
      currentChan: null,
      prevPres: null,
      prevChan: null,
      presCards: null,
      chanCards: null,
      presDiscard: null,
      chanPlay: null,
      presClaim: null,
      chanClaim: null,
      log: [],
      chat: [],
      govs: [],
      invClaims: [],
      confs: [],
      remakeId: '',
      topDecked: false,
      vetoAccepted: false,
      defaultProbabilityLog: [],
      alreadyEnded: false,
    };
    await this.gameRespository.set(newId, newGame);
    await this.utilService.handleUpdate(id, game);
    return newId;
  }

  async leaveGame(id: string, socketId: string) {
    const game = await this.utilService.findById(id);
    const playerLeaving = game.players.find(
      (player) => player.socketId === socketId,
    );

    if (!playerLeaving) {
      return;
    }

    let gameDeleted = false;
    //completely leave the game if in lobby
    if (game.status === Status.CREATED) {
      game.players = game.players.filter((player) => player !== playerLeaving);
      if (game.players.length === 0) {
        gameDeleted = true;
        this.deleteGame(id);
      } else if (playerLeaving.name === game.host) {
        game.host = game.players[0]?.name;
      }
    } else {
      //game in progress - disconnect
      playerLeaving.socketId = null;

      //if everybody disconnects and the game is not over (keep completed games) then delete game after 10 minutes (in case everyone crashes out it doesn't automatically delete)
      if (
        game.players.every((player) => player.socketId === null) &&
        !gameOver(game)
      ) {
        this.deleteGameTimeoutId = setTimeout(
          async () => {
            const game = await this.gameRespository.get(id);
            if (game?.players.every((player) => player.socketId === null)) {
              gameDeleted = true;
              this.deleteGame(id);
            }
          },
          1000 * 60 * 10,
        );
      }
    }
    if (!gameDeleted) {
      this.gameRespository.update(id, game);
    }
    this.eventEmitter.emit(LEAVE_GAME, socketId);
    this.eventEmitter.emit(UPDATE_GAME, game);
    return;
  }

  async startGame(id: string) {
    const game = await this.utilService.findById(id);
    if (game.status !== Status.CREATED) {
      this.utilService.handleError(`Game ${id} has already started`);
    }
    if (game.players.length < 5) {
      this.utilService.handleError(
        `Can't start a game with fewer than 5 players`,
      );
    }
    this.logicService.startGame(game);

    const logTimeout = isBlindSetting(game.settings.type) ? 2000 : 5000; //1500
    setTimeout(async () => {
      const game = await this.utilService.findById(id);
      game.log.push({
        type: LogType.INDIVIDUAL_SEAT,
        date: getFormattedDate(),
      });
      if (game.settings.type === GameType.COOPERATIVE_BLIND) {
        game.log.push({
          type: LogType.COOPERATIVE_BLIND,
          date: getFormattedDate(),
        });
      }
      if (!isBlindSetting(game.settings.type)) {
        game.log.push({ type: LogType.HITLER_SEAT, date: getFormattedDate() });
        game.log.push({
          type: LogType.OTHER_FASCIST_SEATS,
          date: getFormattedDate(),
        });
      }
      await this.utilService.handleUpdate(id, game);
    }, logTimeout);

    const changeStatusTimeout = isBlindSetting(game.settings.type)
      ? 4000
      : 9000;
    setTimeout(async () => {
      const game = await this.utilService.findById(id);
      if (game.status === Status.STARTED) {
        //in blind, it's possible someone changed it to end_fasc for trying to confirm immediately
        game.status = Status.CHOOSE_CHAN;
      }
      await this.utilService.handleUpdate(id, game);
    }, changeStatusTimeout);
    await this.utilService.handleUpdate(id, game);
    return;
  }

  async deleteGame(id: string) {
    await this.gameRespository.delete(id);
    this.eventEmitter.emit(EXISTING_GAMES);
  }

  async setGameSettings(id: string, gameSettings: GameSettings) {
    const game = await this.utilService.findById(id);
    if (game.status !== Status.CREATED) {
      this.utilService.handleError(
        `Cannot change the game settings after the game has started`,
      );
    }
    if (isBlindSetting(gameSettings.type)) {
      game.settings = {
        ...gameSettings,
        // hitlerKnowsFasc: false,
      };
    } else {
      game.settings = {
        ...gameSettings,
        simpleBlind: false,
      };
    }

    // if(gameSettings.type !== GameType.LIB_SPY){
    //   game.settings.teamLibSpy = false
    // }
    await this.utilService.handleUpdate(id, game);
  }

  async chooseChan(id: string, chanName: string) {
    const game = await this.utilService.findById(id);
    if (game.status !== Status.CHOOSE_CHAN) {
      this.utilService.handleError(`Can't choose a chancellor at this time`);
    }
    this.logicService.chooseChan(game, chanName);
    await this.utilService.handleUpdate(id, game);
  }

  async vote(id: string, name: string, vote: Vote) {
    const game = await this.utilService.findById(id);
    const voteSplit = this.logicService.vote(game, name, vote);

    if (game.status === Status.VOTE_LOCK) {
      console.log('status is now vote lock');
      const playerVotes = game.players.map((player) => player.vote);
      setTimeout(async () => {
        const game = await this.utilService.findById(id);

        if (game.players.every((player, i) => player.vote === playerVotes[i])) {
          game.status = Status.SHOW_VOTE_RESULT;
          const timeout = voteSplit <= 1 ? 4000 : voteSplit <= 3 ? 5000 : 6000; //this syncs with frontend animation
          setTimeout(async () => {
            this.determineResultOfVote(id);
          }, timeout);
        } else {
          console.log('status back to vote');
          game.status = Status.VOTE;
        }
        await this.utilService.handleUpdate(id, game);
      }, 1000); //lower this
    }
    await this.utilService.handleUpdate(id, game);
  }

  async showVotesInCaseOfCrash(id: string) {
    const game = await this.utilService.findById(id);
    if (game.status !== Status.VOTE_LOCK) {
      return;
    }
    const voteSplit = this.logicService.countVotes(game);
    game.status = Status.SHOW_VOTE_RESULT;
    const timeout = voteSplit <= 1 ? 4000 : voteSplit <= 3 ? 5000 : 6000; //this syncs with frontend animation
    setTimeout(async () => {
      this.determineResultOfVote(id);
    }, timeout);

    await this.utilService.handleUpdate(id, game);
  }

  async determineResultOfVote(id: string) {
    const game = await this.utilService.findById(id);
    if (game.status === Status.SHOW_VOTE_RESULT) {
      //in blind, it's possible someone changed it to end_fasc for trying to confirm immediately
      this.logicService.determineResultofVote(game);
    }
    await this.utilService.handleUpdate(id, game);
  }

  async presDiscard(id: string, cardColor: string) {
    const game = await this.utilService.findById(id);
    this.logicService.presDiscard(game, cardColor);
    await this.utilService.handleUpdate(id, game);
  }

  async chanPlay(id: string, cardColor: string) {
    const game = await this.utilService.findById(id);
    this.logicService.chanPlay(game, cardColor);
    //if game didn't end (tell by status being chan claim), then
    await this.utilService.handleUpdate(id, game);
  }

  async chanClaim(id: string, claim: CHAN2) {
    const game = await this.utilService.findById(id);
    this.logicService.chanClaim(game, claim);
    await this.utilService.handleUpdate(id, game);
  }

  async presClaim(id: string, claim: PRES3) {
    const game = await this.utilService.findById(id);
    this.logicService.presClaim(game, claim);
    await this.utilService.handleUpdate(id, game);
  }

  async chooseInv(id: string, invName: string) {
    const game = await this.utilService.findById(id);
    if (game.status !== Status.INV) {
      this.utilService.handleError(`Can't investigate at this time`);
    }
    this.logicService.chooseInv(game, invName);
    await this.utilService.handleUpdate(id, game);
    //  setTimeout(async ()=> {
    //   const game = await this.utilService.findById(id)
    //   this.logicService.setInv(game, invName)
    //   await this.utilService.handleUpdate(id, game)
    //   }, 3000)
  }

  async invClaim(id: string, claim: Team) {
    const game = await this.utilService.findById(id);
    if (game.status !== Status.INV_CLAIM) {
      this.utilService.handleError(`Can't claim inv at this time`);
    }
    this.logicService.invClaim(game, claim);
    await this.utilService.handleUpdate(id, game);
  }

  async chooseSE(id: string, seName: string) {
    const game = await this.utilService.findById(id);
    if (game.status !== Status.SE) {
      this.utilService.handleError(`Can't SE at this time`);
    }
    this.logicService.chooseSE(game, seName);
    await this.utilService.handleUpdate(id, game);
  }

  async chooseGun(id: string, shotName: string) {
    const game = await this.utilService.findById(id);
    if (game.status !== Status.GUN) {
      this.utilService.handleError(`Can't shoot at this time`);
    }
    this.logicService.shootPlayer(game, shotName);
    await this.utilService.handleUpdate(id, game);
  }

  async chooseLibSpy(id: string, spyName: string) {
    const game = await this.utilService.findById(id);
    if (game.status !== Status.LIB_SPY_GUESS) {
      this.utilService.handleError(`Can't guess Lib Spy at this time`);
    }
    this.logicService.guessLibSpy(game, spyName);
    setTimeout(async () => {
      this.determineResultOfLibSpyGuess(id, spyName);
      // const game = await this.utilService.findById(id);
      // this.logicService.determineResultOfLibSpyGuess(game, spyName);
      // await this.utilService.handleUpdate(id, game);
    }, 3000); //3s animation on frontend to show the pick
    await this.utilService.handleUpdate(id, game);
  }

  async determineResultOfLibSpyGuess(id: string, spyName: string) {
    const game = await this.utilService.findById(id);
    this.logicService.determineResultOfLibSpyGuess(game, spyName);
    await this.utilService.handleUpdate(id, game);
  }

  async inspect3Claim(id: string, claim: PRES3) {
    const game = await this.utilService.findById(id);
    this.logicService.inspect3Claim(game, claim);
    await this.utilService.handleUpdate(id, game);
  }

  async vetoRequest(id: string) {
    const game = await this.utilService.findById(id);
    this.logicService.vetoRequest(game);
    await this.utilService.handleUpdate(id, game);
  }

  async vetoReply(id: string, vetoAccepted: boolean) {
    const game = await this.utilService.findById(id);
    this.logicService.vetoReply(game, vetoAccepted);
    await this.utilService.handleUpdate(id, game);
  }

  async confirmFasc(id: string, name: string) {
    const game = await this.utilService.findById(id);
    this.logicService.confirmFasc(game, name);
    await this.utilService.handleUpdate(id, game);
  }

  async defaultPresDiscard(id: string) {
    const game = await this.utilService.findById(id);
    const cardColor = this.defaultActionService.defaultPresDiscard(game);
    await this.gameRespository.update(id, game); //defaultProbabilityLog needs to be updated so presDiscard can access it when it gets the game
    await this.presDiscard(id, cardColor);
  }

  async defaultChanPlay(id: string) {
    const game = await this.utilService.findById(id);
    const cardColor = this.defaultActionService.defaultChanPlay(game);
    await this.gameRespository.update(id, game);
    if (!cardColor) {
      //means veto
      await this.vetoRequest(id);
    } else {
      await this.chanPlay(id, cardColor);
    }
  }

  async defaultChanClaim(id: string) {
    const game = await this.utilService.findById(id);
    const claim = this.defaultActionService.defaultChanClaim(game);
    await this.gameRespository.update(id, game);
    await this.chanClaim(id, claim);
  }

  async defaultPresClaim(id: string) {
    const game = await this.utilService.findById(id);
    const claim = this.defaultActionService.defaultPresClaim(game);
    await this.gameRespository.update(id, game);
    await this.presClaim(id, claim);
  }

  async defaultInvClaim(id: string) {
    const game = await this.utilService.findById(id);
    const claim = this.defaultActionService.defaultInvClaim(game);
    await this.gameRespository.update(id, game);
    await this.invClaim(id, claim);
  }

  async defaultInspect3Claim(id: string) {
    const game = await this.utilService.findById(id);
    const claim = this.defaultActionService.defaultInspect3Claim(game);
    await this.gameRespository.update(id, game);
    await this.inspect3Claim(id, claim);
  }

  async defaultVetoReply(id: string) {
    const game = await this.utilService.findById(id);
    const vetoReply = this.defaultActionService.defaultVetoReply(game);
    await this.gameRespository.update(id, game);
    await this.vetoReply(id, vetoReply);
  }

  async chatMessage(id: string, name: string, message: string) {
    const game = await this.utilService.findById(id);
    game.chat.push({ name, date: getFormattedDate(), message });
    game.log.push({ name, date: getFormattedDate(), message });
    await this.utilService.handleUpdate(id, game);
  }
}
