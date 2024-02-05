import { Test, TestingModule } from '@nestjs/testing';
import { CardMockFactory } from '../test/CardMockFactory';
import { DefaultActionService } from './defaultAction.service';
import { LogicService } from './logic.service';
import { Game } from '../models/game.model';
import { Player } from '../models/player.model';
import { PlayerMockFactory } from '../test/PlayerMockFactory';
import { GameMockFactory } from '../test/GameMockFactory';
import { GovMockFactory } from '../test/GovMockFactory';
import {
  BB,
  CHAN2,
  Color,
  Conf,
  DefaultAction,
  GameType,
  PRES3,
  Role,
  Status,
  Team,
} from '../consts';
import { Card } from 'src/models/card.model';
import { GameRepository } from './game.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { asapScheduler } from 'rxjs';

describe('DefaultActionService', () => {
  let defaultActionService: DefaultActionService;
  let logicService: LogicService;
  let gameRepository: GameRepository;
  let players: Player[];
  let game: Game;
  let id: string;
  let player1: Player, player2: Player, player3: Player;
  let R: Card;
  let B: Card;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DefaultActionService, LogicService],
    }).compile();

    defaultActionService =
      module.get<DefaultActionService>(DefaultActionService);
    logicService = module.get<LogicService>(LogicService);

    players = [];
    for (let i = 1; i <= 5; i++) {
      players.push(new PlayerMockFactory().create({ name: `player-${i}` }));
    }
    game = new GameMockFactory().create({ players });
    player1 = game.players.find((player) => player.name === 'player-1');
    player1.role = Role.LIB;
    player1.team = Team.LIB;
    player2 = game.players.find((player) => player.name === 'player-2');
    player2.role = Role.FASC;
    player2.team = Team.FASC;
    player3 = game.players.find((player) => player.name === 'player-3');
    player3.role = Role.HITLER;
    player3.team = Team.FASC;
    game.currentPres = player1.name;
    game.currentChan = player2.name;
    R = new CardMockFactory().createFasc();
    B = new CardMockFactory().createLib();
  });

  describe('determinePreCards', () => {
    it('correctly determines', () => {
      const R = new CardMockFactory().createFasc();
      const B = new CardMockFactory().createLib();
      const presCards = [
        [B, B, B],
        [R, B, B],
        [R, R, B],
        [R, R, R],
      ];
      const presDraws = ['BBB', 'RBB', 'RRB', 'RRR'];
      for (let i = 0; i < 4; i++) {
        expect(defaultActionService.determine3Cards(presCards[i])).toBe(
          presDraws[i],
        );
      }
    });
  });

  describe('determineChanCards', () => {
    it('correctly determines', () => {
      const R = new CardMockFactory().createFasc();
      const B = new CardMockFactory().createLib();
      const chanCards = [
        [B, B],
        [R, B],
        [R, R],
      ];
      const chanDraws = ['BB', 'RB', 'RR'];
      for (let i = 0; i < 3; i++) {
        expect(defaultActionService.determine2Cards(chanCards[i])).toBe(
          chanDraws[i],
        );
      }
    });
  });

  describe('lib3RedOnThisDeck', () => {
    it('properly determines that a lib pres drew 3 red on this deck', () => {
      player1.team = Team.LIB;
      game.govs.push(new GovMockFactory().create());
      expect(defaultActionService.lib3RedOnThisDeck(game)).toBe(true);
    });

    it('properly determines that a lib pres drew 3 red on a different deck', () => {
      player1.team = Team.LIB;
      game.govs.push(new GovMockFactory().create());
      game.deck.deckNum = 2;
      expect(defaultActionService.lib3RedOnThisDeck(game)).toBe(false);
    });

    it('returns false if a fasc pres draws RRR', () => {
      player1.team = Team.FASC;
      game.govs.push(new GovMockFactory().create());
      expect(defaultActionService.lib3RedOnThisDeck(game)).toBe(false);
    });
  });

  describe('fasc3RedOnThisDeck', () => {
    it('properly determines that a fasc pres drew 3 red on this deck', () => {
      player1.team = Team.FASC;
      game.govs.push(new GovMockFactory().create());
      expect(defaultActionService.fasc3RedOnThisDeck(game)).toBe(true);
    });

    it('properly determines that a fasc pres drew 3 red on a different deck', () => {
      player1.team = Team.FASC;
      game.govs.push(new GovMockFactory().create());
      game.deck.deckNum = 2;
      expect(defaultActionService.fasc3RedOnThisDeck(game)).toBe(false);
    });

    it('returns false if a lib pres draws RRR', () => {
      player1.team = Team.LIB;
      game.govs.push(new GovMockFactory().create());
      expect(defaultActionService.fasc3RedOnThisDeck(game)).toBe(false);
    });
  });

  describe('is3Red', () => {
    it('properly determines that the player claimed 3 red regardless of the cards', () => {
      player1.team = Team.FASC;
      game.govs.push(new GovMockFactory().create({ presCards: [R, B, B] }));
      expect(defaultActionService.is3Red(game, 'player-1')).toBe(true);
    });

    it('properly determines not 3 red if overclaim', () => {
      player1.team = Team.FASC;
      game.govs.push(new GovMockFactory().create({ presClaim: PRES3.RRB }));
      expect(defaultActionService.is3Red(game, 'player-1')).toBe(false);
    });
  });

  describe('isAntiDD', () => {
    it('properly determines that the gov is an antiDD', () => {
      player1.team = Team.FASC;
      game.confs.push(
        {
          confer: 'player-1',
          confee: 'player-2',
          type: Conf.INV,
        },
        {
          confer: 'player-1',
          confee: 'player-3',
          type: Conf.POLICY,
        },
      );
      game.currentChan = 'player-2';
      game.currentPres = 'player-3';
      expect(defaultActionService.isAntiDD(game)).toBe(true);
      game.currentChan = 'player-2';
      game.currentPres = 'player-1';
      expect(defaultActionService.isAntiDD(game)).toBe(false);
    });
  });

  describe('underClaimTotal', () => {
    it('properly counts the total underclaims', () => {
      game.govs.push(new GovMockFactory().create({ underclaim: 2 }));
      game.govs.push(new GovMockFactory().create({ underclaim: 3 }));
      game.govs.push(
        new GovMockFactory().create({ deckNum: 2, underclaim: 3 }),
      );
      game.govs.push(
        new GovMockFactory().create({ deckNum: 2, underclaim: -4 }),
      );
      expect(defaultActionService.underclaimTotal(game)).toEqual(5);
      game.deck.deckNum = 2;
      expect(defaultActionService.underclaimTotal(game)).toEqual(-1);
    });
  });

  describe('deckNBlueCount and related', () => {
    it('properly counts the blue count', () => {
      game.govs.push(new GovMockFactory().create({ presClaim: PRES3.RRB }));
      game.govs.push(new GovMockFactory().create({ presClaim: PRES3.RBB }));
      game.govs.push(new GovMockFactory().create({ presClaim: PRES3.RRR }));
      game.govs.push(new GovMockFactory().create({ presClaim: PRES3.RRR }));
      game.govs.push(
        new GovMockFactory().create({ deckNum: 2, presClaim: PRES3.RBB }),
      );
      game.govs.push(
        new GovMockFactory().create({ deckNum: 2, presClaim: PRES3.RBB }),
      );
      game.govs.push(
        new GovMockFactory().create({ deckNum: 2, presClaim: PRES3.BBB }),
      );
      expect(defaultActionService.deckNBlueCount(game, 1)).toEqual(3);
      expect(defaultActionService.deck1BlueCount(game)).toEqual(3);
      expect(defaultActionService.deckNBlueCount(game, 2)).toEqual(7);
      game.deck.deckNum = 1;
      expect(defaultActionService.blueCountOnThisDeck(game)).toEqual(3);
      game.deck.deckNum = 2;
      expect(defaultActionService.blueCountOnThisDeck(game)).toEqual(7);
    });
  });

  describe('isCucu', () => {
    it('properly determines Cucu', () => {
      game.invClaims.push({
        investigator: 'player-1',
        investigatee: 'player-2',
        claim: Team.LIB,
      });
      game.invClaims.push({
        investigator: 'player-1',
        investigatee: 'player-3',
        claim: Team.FASC,
      });
      game.currentPres = 'player-2';
      game.currentChan = 'player-1';
      expect(defaultActionService.isCucu(game)).toBe(true);

      game.currentPres = 'player-1';
      game.currentChan = 'player-2';
      expect(defaultActionService.isCucu(game)).toBe(false);

      game.currentPres = 'player-3';
      game.currentChan = 'player-1';
      expect(defaultActionService.isCucu(game)).toBe(false);

      game.currentPres = 'player-3';
      game.currentChan = 'player-4';
      expect(defaultActionService.isCucu(game)).toBe(false);
    });
  });

  describe('bluesEnactedInDeck', () => {
    it('properly counts the blues', () => {
      game.govs = [];
      game.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createFasc(),
        }),
      );
      game.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createLib(),
        }),
      );
      game.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createLib(),
          deckNum: 2,
        }),
      );
      game.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createFasc(),
        }),
      );
      game.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createFasc(),
        }),
      );
      game.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createLib(),
        }),
      );
      expect(defaultActionService.bluesEnactedInDeck(game, 1)).toEqual(2);
    });
  });

  describe('bluesToBeginTheDeck', () => {
    it('properly counts the blues', () => {
      game.govs = [];
      game.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createFasc(),
        }),
      );
      game.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createLib(),
        }),
      );
      game.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createLib(),
          deckNum: 2,
        }),
      );
      game.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createFasc(),
        }),
      );
      game.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createFasc(),
        }),
      );
      game.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createLib(),
          deckNum: 2,
        }),
      );
      expect(defaultActionService.bluesToBeginTheDeck(game, 1)).toEqual(6);
      expect(defaultActionService.bluesToBeginTheDeck(game, 2)).toEqual(5);
      expect(defaultActionService.bluesToBeginTheDeck(game, 3)).toEqual(3);
    });
  });

  describe('isCucu', () => {
    it('properly determines Cucu', () => {
      game.confs.push({
        confer: 'player-1',
        confee: 'player-2',
        type: Conf.POLICY,
      });
      game.confs.push({
        confer: 'player-1',
        confee: 'player-3',
        type: Conf.INV,
      });
      game.confs.push({
        confer: 'player-2',
        confee: 'player-4',
        type: Conf.INV,
      });
      game.currentPres = 'player-2';
      game.currentChan = 'player-3';
      expect(defaultActionService.isAntiDD(game)).toBe(true);
      game.currentPres = 'player-3';
      game.currentChan = 'player-2';
      expect(defaultActionService.isAntiDD(game)).toBe(true);
      game.currentPres = 'player-4';
      game.currentChan = 'player-3';
      expect(defaultActionService.isAntiDD(game)).toBe(false);
    });
  });

  describe('isPower', () => {
    it('properly determines if there is a power in 5-6 player games', () => {
      game.FascPoliciesEnacted = 0;
      expect(defaultActionService.isPower(game)).toBe(false);
      game.FascPoliciesEnacted = 1;
      game.players.push(new PlayerMockFactory().create());
      expect(defaultActionService.isPower(game)).toBe(false);
      game.FascPoliciesEnacted = 2;
      expect(defaultActionService.isPower(game)).toBe(true);
      game.FascPoliciesEnacted = 4;
      expect(defaultActionService.isPower(game)).toBe(true);
    });

    it('properly determines if there is a power in 7-8 player games', () => {
      for (let i = 6; i < 8; i++) {
        game.players.push(
          new PlayerMockFactory().create({ name: `player-${i}` }),
        );
      }
      game.FascPoliciesEnacted = 0;
      expect(defaultActionService.isPower(game)).toBe(false);
      game.FascPoliciesEnacted = 1;
      expect(defaultActionService.isPower(game)).toBe(true);
      game.players.push(new PlayerMockFactory().create({ name: `player-8` }));
      game.FascPoliciesEnacted = 0;
      expect(defaultActionService.isPower(game)).toBe(false);
      game.FascPoliciesEnacted = 4;
      expect(defaultActionService.isPower(game)).toBe(true);
    });

    it('properly determines if there is a power in 9-10 player games', () => {
      for (let i = 6; i < 10; i++) {
        game.players.push(
          new PlayerMockFactory().create({ name: `player-${i}` }),
        );
      }
      game.FascPoliciesEnacted = 0;
      expect(defaultActionService.isPower(game)).toBe(true);
      game.FascPoliciesEnacted = 1;
      expect(defaultActionService.isPower(game)).toBe(true);
      game.players.push(new PlayerMockFactory().create({ name: `player-10` }));
      game.FascPoliciesEnacted = 0;
      expect(defaultActionService.isPower(game)).toBe(true);
      game.FascPoliciesEnacted = 4;
      expect(defaultActionService.isPower(game)).toBe(true);
    });
  });

  describe('invPower', () => {
    it('properly determines if there is a invpower in 5-6 player games', () => {
      game.FascPoliciesEnacted = 0;
      expect(defaultActionService.invPower(game)).toBe(false);
      game.FascPoliciesEnacted = 1;
      expect(defaultActionService.invPower(game)).toBe(false);
      game.FascPoliciesEnacted = 2;
      expect(defaultActionService.invPower(game)).toBe(false);
      game.FascPoliciesEnacted = 3;
      expect(defaultActionService.invPower(game)).toBe(false);
    });

    it('properly determines if there is a power in 7-8 player games', () => {
      for (let i = 6; i < 8; i++) {
        game.players.push(
          new PlayerMockFactory().create({ name: `player-${i}` }),
        );
      }
      game.FascPoliciesEnacted = 0;
      expect(defaultActionService.invPower(game)).toBe(false);
      game.FascPoliciesEnacted = 1;
      expect(defaultActionService.invPower(game)).toBe(true);
      game.FascPoliciesEnacted = 2;
      expect(defaultActionService.invPower(game)).toBe(false);
      game.FascPoliciesEnacted = 3;
      expect(defaultActionService.invPower(game)).toBe(false);
    });

    it('properly determines if there is a power in 9-10 player games', () => {
      for (let i = 6; i < 10; i++) {
        game.players.push(
          new PlayerMockFactory().create({ name: `player-${i}` }),
        );
      }
      game.FascPoliciesEnacted = 0;
      expect(defaultActionService.invPower(game)).toBe(true);
      game.FascPoliciesEnacted = 1;
      expect(defaultActionService.invPower(game)).toBe(true);
      game.FascPoliciesEnacted = 2;
      expect(defaultActionService.invPower(game)).toBe(false);
      game.FascPoliciesEnacted = 3;
      expect(defaultActionService.invPower(game)).toBe(false);
    });
  });

  describe('gunPower', () => {
    it('properly determines if there is a gunPower', () => {
      game.FascPoliciesEnacted = 0;
      expect(defaultActionService.gunPower(game)).toBe(false);
      game.FascPoliciesEnacted = 1;
      expect(defaultActionService.gunPower(game)).toBe(false);
      game.FascPoliciesEnacted = 2;
      expect(defaultActionService.gunPower(game)).toBe(false);
      game.FascPoliciesEnacted = 3;
      expect(defaultActionService.gunPower(game)).toBe(true);
      game.FascPoliciesEnacted = 4;
      expect(defaultActionService.gunPower(game)).toBe(true);
      game.FascPoliciesEnacted = 5;
      expect(defaultActionService.gunPower(game)).toBe(false);
    });
  });

  describe('doubleDipping', () => {
    it('properly determines if the pres is doubledipping', () => {
      game.confs.push({
        confer: 'player-1',
        confee: 'player-2',
        type: Conf.POLICY,
      });
      game.currentPres = 'player-1';
      game.currentChan = 'player-2';
      expect(defaultActionService.doubleDipping(game)).toBe(true);
    });

    it('properly determines if the pres is not doubledipping', () => {
      game.confs.push({
        confer: 'player-3',
        confee: 'player-4',
        type: Conf.INV,
      });
      game.currentPres = 'player-3';
      game.currentChan = 'player-4';
      expect(defaultActionService.doubleDipping(game)).toBe(false);
      game.confs.push({
        confer: 'player-1',
        confee: 'player-2',
        type: Conf.POLICY,
      });
      game.currentPres = 'player-2';
      game.currentChan = 'player-1';
      expect(defaultActionService.doubleDipping(game)).toBe(false);
    });
  });

  describe('inConflict', () => {
    it('properly determines if two players are on conflict', () => {
      game.confs.push({
        confer: 'player-1',
        confee: 'player-2',
        type: Conf.POLICY,
      });
      expect(defaultActionService.inConflict(game, player1, player2)).toBe(
        true,
      );
      expect(defaultActionService.inConflict(game, player1, player3)).toBe(
        false,
      );
    });
  });

  describe('inAnyConflict', () => {
    it('properly determines if a player is in any conflict', () => {
      game.confs.push({
        confer: 'player-1',
        confee: 'player-2',
        type: Conf.POLICY,
      });
      expect(defaultActionService.inAnyConflict(game, player1)).toBe(true);
      expect(defaultActionService.inAnyConflict(game, player2)).toBe(true);
      expect(defaultActionService.inAnyConflict(game, player3)).toBe(false);
    });
  });

  describe('inFascFascConflict', () => {
    it('properly determines if a player is in any fasc fasc conflict', () => {
      game.confs.push({
        confer: 'player-2',
        confee: 'player-3',
        type: Conf.POLICY,
      });
      game.confs.push({
        confer: 'player-4',
        confee: 'player-5',
        type: Conf.POLICY,
      });
      player2.team = Team.FASC;
      player3.team = Team.FASC;
      expect(defaultActionService.inFascFascConflict(game, player2)).toBe(true);
      expect(defaultActionService.inFascFascConflict(game, player3)).toBe(true);
      const player4 = logicService.findPlayerIngame(game, 'player-4');
      const player5 = logicService.findPlayerIngame(game, 'player-5');
      player4.team = Team.FASC;
      player5.team = Team.LIB;
      expect(defaultActionService.inFascFascConflict(game, player4)).toBe(
        false,
      );
    });
  });

  describe('numAliveOnTeam', () => {
    beforeEach(() => {
      game.players = [];
      for (let i = 1; i <= 10; i++) {
        game.players.push(
          new PlayerMockFactory().create({
            name: `player-${i}`,
            team: i <= 4 ? Team.FASC : Team.LIB,
          }),
        );
      }
    });

    it('properly determines number of alive fascists', () => {
      expect(defaultActionService.numAliveOnTeam(game, Team.LIB)).toEqual(6);
      expect(defaultActionService.numAliveOnTeam(game, Team.FASC)).toEqual(4);
      game.players[0].alive = false;
      game.players[1].alive = false;
      game.players[9].alive = false;
      game.players[6].alive = false;
      game.players[5].alive = false;
      expect(defaultActionService.numAliveOnTeam(game, Team.LIB)).toEqual(3);
      expect(defaultActionService.numAliveOnTeam(game, Team.FASC)).toEqual(2);
    });
  });

  describe('testProb', () => {
    it('returns true when value is less', () => {
      Math.random = () => 0.7;
      expect(
        defaultActionService.testProb(
          0.71,
          game,
          'testName',
          DefaultAction.CHAN_CLAIM,
          'test',
        ),
      ).toBe(true);
    });

    it('returns true when value is less', () => {
      Math.random = () => 0.7;
      expect(
        defaultActionService.testProb(
          0.69,
          game,
          'testName',
          DefaultAction.CHAN_CLAIM,
          'test',
        ),
      ).toBe(false);
    });
  });

  /**
   * default actions
   */

  describe('defaultInspect3Claim', () => {
    let cards3: Card[];

    beforeEach(() => {
      jest.spyOn(logicService, 'inspect3').mockImplementation(() => cards3);
      defaultActionService.getInspect3ClaimProbs = () => [1, 1];
      player1.team = Team.FASC;
      player2.team = Team.LIB;
    });

    it('returns RBB if testProb is met for RRR or RRB case', () => {
      game.currentPres = 'player-1';
      // testProb = 0.001;
      cards3 = [R, R, R];
      let claim = defaultActionService.defaultInspect3Claim(game);
      expect(claim).toBe(PRES3.RBB);
      cards3 = [R, R, B];
      claim = defaultActionService.defaultInspect3Claim(game);
      expect(claim).toBe(PRES3.RBB);
      game.currentPres = 'player-2';
      claim = defaultActionService.defaultInspect3Claim(game);
      expect(claim).toBe(PRES3.RRB);
    });

    it('returns RBB if testProb is met for BBB case', () => {
      game.currentPres = 'player-1';
      cards3 = [B, B, B];
      let claim = defaultActionService.defaultInspect3Claim(game);
      expect(claim).toBe(PRES3.RBB);
    });

    it('returns truth on RBB', () => {
      game.currentPres = 'player-1';
      cards3 = [R, B, B];
      let claim = defaultActionService.defaultInspect3Claim(game);
      expect(claim).toBe(PRES3.RBB);
    });

    it('returns truth if lib', () => {
      game.currentPres = 'player-2';
      cards3 = [R, R, R];
      let claim = defaultActionService.defaultInspect3Claim(game);
      expect(claim).toBe(PRES3.RRR);
      cards3 = [R, R, B];
      claim = defaultActionService.defaultInspect3Claim(game);
      expect(claim).toBe(PRES3.RRB);
      cards3 = [R, B, B];
      claim = defaultActionService.defaultInspect3Claim(game);
      expect(claim).toBe(PRES3.RBB);
      cards3 = [B, B, B];
      claim = defaultActionService.defaultInspect3Claim(game);
      expect(claim).toBe(PRES3.BBB);
    });
  });

  describe('defaultInspect3Claim', () => {
    let cards3: Card[];
    let blueCount: number;
    let bluesEnactedInDeck: number;
    let bluesToBeginTheDeck: number;
    beforeEach(() => {
      jest.spyOn(logicService, 'inspect3').mockImplementation(() => cards3);

      defaultActionService.blueCountOnThisDeck = () => blueCount;
      defaultActionService.bluesEnactedInDeck = () => bluesEnactedInDeck;
      defaultActionService.bluesToBeginTheDeck = () => bluesToBeginTheDeck;
      player1.team = Team.FASC;
      player2.team = Team.LIB;
      cards3 = [R, R, B];
    });

    it('underclaims BBB with prob 1', () => {
      cards3 = [B, B, B];
      game.currentPres = 'player-1';
      const [, underclaimBBBInspect3Prob] =
        defaultActionService.getInspect3ClaimProbs(game);
      expect(underclaimBBBInspect3Prob).toEqual(1);
    });

    it('overclaims RRR and RRB with prob .9 for first deck condition', () => {
      game.deck.deckNum = 1;
      game.deck.drawPile.length = 5;
      blueCount = 4;
      game.currentPres = 'player-1';
      cards3 = [R, R, R];
      let [overclaimToBBInspect3Prob] =
        defaultActionService.getInspect3ClaimProbs(game);
      expect(overclaimToBBInspect3Prob).toEqual(0.9);
      cards3 = [R, R, B];
      [overclaimToBBInspect3Prob] =
        defaultActionService.getInspect3ClaimProbs(game);
      expect(overclaimToBBInspect3Prob).toEqual(0.9);
    });

    it('overclaims RRR and RRB with prob .9 for second deck condition', () => {
      game.deck.deckNum = 2;
      blueCount = 1;
      bluesToBeginTheDeck = 3;
      game.currentPres = 'player-1';
      cards3 = [R, R, R];
      let [overclaimToBBInspect3Prob] =
        defaultActionService.getInspect3ClaimProbs(game);
      expect(overclaimToBBInspect3Prob).toEqual(0.9);
      cards3 = [R, R, B];
      [overclaimToBBInspect3Prob] =
        defaultActionService.getInspect3ClaimProbs(game);
      expect(overclaimToBBInspect3Prob).toEqual(0.9);
    });

    it('does not overclaim RRR and RRB with prob if condition 1 not met', () => {
      game.deck.deckNum = 1;
      blueCount = 5;
      game.currentPres = 'player-1';
      cards3 = [R, R, R];
      let [overclaimToBBInspect3Prob] =
        defaultActionService.getInspect3ClaimProbs(game);
      expect(overclaimToBBInspect3Prob).toEqual(0);
      cards3 = [R, R, B];
      [overclaimToBBInspect3Prob] =
        defaultActionService.getInspect3ClaimProbs(game);
      expect(overclaimToBBInspect3Prob).toEqual(0);
    });

    it('does not overclaim RRR and RRB with prob if condition 2 not met', () => {
      game.deck.deckNum = 2;
      blueCount = 3;
      bluesToBeginTheDeck = 4;
      game.currentPres = 'player-1';
      cards3 = [R, R, R];
      let [overclaimToBBInspect3Prob] =
        defaultActionService.getInspect3ClaimProbs(game);
      expect(overclaimToBBInspect3Prob).toEqual(0);
      cards3 = [R, R, B];
      [overclaimToBBInspect3Prob] =
        defaultActionService.getInspect3ClaimProbs(game);
      expect(overclaimToBBInspect3Prob).toEqual(0);
    });
  });

  describe('defaultVetoReply', () => {
    it('accepts veto on RR as a lib', () => {
      game.currentPres = 'player-1';
      game.chanCards = [R, R];
      expect(defaultActionService.defaultVetoReply(game)).toBe(true);
    });

    it('rejects veto on RB or BB as a lib', () => {
      game.currentPres = 'player-1';
      game.chanCards = [R, B];
      expect(defaultActionService.defaultVetoReply(game)).toBe(false);
      game.chanCards = [B, B];
      expect(defaultActionService.defaultVetoReply(game)).toBe(false);
    });

    it('rejects veto on RR and RB as a fasc', () => {
      game.currentPres = 'player-2';
      game.chanCards = [R, R];
      expect(defaultActionService.defaultVetoReply(game)).toBe(false);
      game.chanCards = [R, B];
      expect(defaultActionService.defaultVetoReply(game)).toBe(false);
    });

    it('accepts veto on BB as a fasc', () => {
      game.currentPres = 'player-2';
      game.chanCards = [B, B];
      expect(defaultActionService.defaultVetoReply(game)).toBe(true);
    });
  });

  describe('defaultInvClaim', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      jest
        .spyOn(defaultActionService, 'testProb')
        .mockImplementation(() => true);
    });

    it('tells the truth as a lib', () => {
      game.currentPres = 'player-1';
      player1.investigations.push('player-2');
      expect(logicService.getCurrentPres(game).team).toBe(Team.LIB);
      expect(defaultActionService.defaultInvClaim(game)).toBe(Team.FASC);
      player1.investigations.push('player-1');
      expect(defaultActionService.defaultInvClaim(game)).toBe(Team.LIB);
      player1.investigations.push('player-3');
      expect(defaultActionService.defaultInvClaim(game)).toBe(Team.FASC);
      expect(defaultActionService.testProb).toBeCalledTimes(0);
    });

    it('confs based on test prob as a fasc', () => {
      game.currentPres = 'player-3';
      player3.investigations.push('player-2');
      expect(logicService.getCurrentPres(game).team).toBe(Team.FASC);
      expect(defaultActionService.defaultInvClaim(game)).toBe(Team.FASC);
      player3.investigations.push('player-1');
      expect(defaultActionService.defaultInvClaim(game)).toBe(Team.FASC);
      player3.investigations.push('player-3');
      expect(defaultActionService.defaultInvClaim(game)).toBe(Team.FASC);
      expect(defaultActionService.testProb).toBeCalledTimes(3);
    });

    it('does not conf based on test prob as a fasc', () => {
      jest
        .spyOn(defaultActionService, 'testProb')
        .mockImplementation(() => false);
      game.currentPres = 'player-3';
      player3.investigations.push('player-2');
      expect(logicService.getCurrentPres(game).team).toBe(Team.FASC);
      expect(defaultActionService.defaultInvClaim(game)).toBe(Team.LIB);
      player3.investigations.push('player-1');
      expect(defaultActionService.defaultInvClaim(game)).toBe(Team.LIB);
      player3.investigations.push('player-3');
      expect(defaultActionService.defaultInvClaim(game)).toBe(Team.LIB);
      expect(defaultActionService.testProb).toBeCalledTimes(3);
    });

    it('calls simple version when the game setting is simpleBlind', () => {
      jest.spyOn(defaultActionService, 'getSimpleFascInvConfProb');
      jest.spyOn(defaultActionService, 'getFascInvConfProb');
      game.currentPres = 'player-3';
      player3.investigations.push('player-2');
      game.settings.simpleBlind = true;
      game.currentPres = player3.name;
      game.currentChan = player1.name;
      defaultActionService.defaultInvClaim(game);
      expect(defaultActionService.getFascInvConfProb).toBeCalledTimes(0);
      expect(defaultActionService.getSimpleFascInvConfProb).toBeCalledTimes(1);
    });
  });

  describe('defaultPresDiscard', () => {
    beforeEach(() => {
      jest
        .spyOn(defaultActionService, 'testProb')
        .mockImplementation((prob) => 0.5 < prob);
      jest.spyOn(defaultActionService, 'getPresDropProbs');
      jest.spyOn(defaultActionService, 'getSimplePresDropProbs');
    });

    it('does and does not vanilla fasc to pass a B in RRB with 3 more reds down', () => {
      game.currentPres = player2.name;
      expect(logicService.getCurrentPres(game).role).toBe(Role.FASC);
      game.FascPoliciesEnacted = 3;

      game.currentChan = player2.name;
      expect(logicService.getCurrentChan(game).role).toBe(Role.FASC);
      game.presCards = [R, R, B];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.RED);

      game.currentChan = player1.name;
      expect(logicService.getCurrentChan(game).role).toBe(Role.LIB);
      game.presCards = [R, R, B];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.BLUE);
    });

    it('discards red whenever possible for a lib', () => {
      game.currentPres = player1.name;
      expect(logicService.getCurrentPres(game).role).toBe(Role.LIB);
      game.presCards = [B, B, B];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.BLUE);
      game.presCards = [R, B, B];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.RED);
      game.presCards = [R, R, B];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.RED);
      game.presCards = [R, R, R];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.RED);
      expect(defaultActionService.getPresDropProbs).toBeCalledTimes(0);
      expect(defaultActionService.getSimplePresDropProbs).toBeCalledTimes(0);
    });

    it('discards blue when passing test prob for a fasc', () => {
      jest
        .spyOn(defaultActionService, 'getPresDropProbs')
        .mockImplementation(() => [1, 1]);
      game.currentPres = player2.name;
      expect(logicService.getCurrentPres(game).role).toBe(Role.FASC);
      game.presCards = [B, B, B];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.BLUE);
      game.presCards = [R, B, B];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.BLUE);
      game.presCards = [R, R, B];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.BLUE);
      game.presCards = [R, R, R];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.RED);
      expect(defaultActionService.getPresDropProbs).toBeCalledTimes(4);
      expect(defaultActionService.getSimplePresDropProbs).toBeCalledTimes(0);
    });

    it('discards blue when passing test prob for hitler', () => {
      jest
        .spyOn(defaultActionService, 'getPresDropProbs')
        .mockImplementation(() => [1, 1]);
      game.currentPres = player3.name;
      expect(logicService.getCurrentPres(game).role).toBe(Role.HITLER);
      game.presCards = [B, B, B];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.BLUE);
      game.presCards = [R, B, B];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.BLUE);
      game.presCards = [R, R, B];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.BLUE);
      game.presCards = [R, R, R];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.RED);
    });

    it('discards red when failing test prob for a fasc', () => {
      jest
        .spyOn(defaultActionService, 'getPresDropProbs')
        .mockImplementation(() => [0, 0]);
      game.currentPres = player2.name;
      expect(logicService.getCurrentPres(game).role).toBe(Role.FASC);
      game.presCards = [B, B, B];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.BLUE);
      game.presCards = [R, B, B];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.RED);
      game.presCards = [R, R, B];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.RED);
      game.presCards = [R, R, R];
      expect(defaultActionService.defaultPresDiscard(game)).toBe(Color.RED);
    });

    it('calls simple version when the game setting is simpleBlind', () => {
      game.settings.simpleBlind = true;
      game.currentPres = player2.name;
      game.presCards = [B, B, B];
      defaultActionService.defaultPresDiscard(game);
      expect(defaultActionService.getPresDropProbs).toBeCalledTimes(0);
      expect(defaultActionService.getSimplePresDropProbs).toBeCalledTimes(1);
    });
  });

  describe('defaultChanPlay', () => {
    beforeEach(() => {
      jest
        .spyOn(defaultActionService, 'testProb')
        .mockImplementation((prob) => 0.5 < prob);
      jest.spyOn(defaultActionService, 'getSimpleChanDropProbs');
      jest.spyOn(defaultActionService, 'getChanDropProbs');
    });

    it('plays blue whenever possible for a lib', () => {
      game.currentChan = player1.name;
      expect(logicService.getCurrentChan(game).role).toBe(Role.LIB);
      game.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game)).toBe(Color.BLUE);
      game.chanCards = [R, B];
      expect(defaultActionService.defaultChanPlay(game)).toBe(Color.BLUE);
      game.chanCards = [R, R];
      expect(defaultActionService.defaultChanPlay(game)).toBe(Color.RED);
    });

    it('plays red when passing testProb for a fasc', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 1);
      game.currentChan = player2.name;
      expect(logicService.getCurrentChan(game).role).toBe(Role.FASC);
      game.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game)).toBe(Color.BLUE);
      game.chanCards = [R, B];
      expect(defaultActionService.defaultChanPlay(game)).toBe(Color.RED);
      game.chanCards = [R, R];
      expect(defaultActionService.defaultChanPlay(game)).toBe(Color.RED);
    });

    it('plays red when passing testProb for hitler', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 1);
      game.currentChan = player3.name;
      expect(logicService.getCurrentChan(game).role).toBe(Role.HITLER);
      game.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game)).toBe(Color.BLUE);
      game.chanCards = [R, B];
      expect(defaultActionService.defaultChanPlay(game)).toBe(Color.RED);
      game.chanCards = [R, R];
      expect(defaultActionService.defaultChanPlay(game)).toBe(Color.RED);
    });

    it('plays blue when failing testProb for a fasc', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game.currentChan = player2.name;
      expect(logicService.getCurrentChan(game).role).toBe(Role.FASC);
      game.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game)).toBe(Color.BLUE);
      game.chanCards = [R, B];
      expect(defaultActionService.defaultChanPlay(game)).toBe(Color.BLUE);
      game.chanCards = [R, R];
      expect(defaultActionService.defaultChanPlay(game)).toBe(Color.RED);
    });

    it('does not request veto for a lib on RR if not in veto zone', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game.currentChan = player1.name;
      expect(logicService.getCurrentChan(game).role).toBe(Role.LIB);
      game.chanCards = [R, R];
      expect(defaultActionService.defaultChanPlay(game)).not.toBeNull();
    });

    it('does not request veto for a lib on RR in veto zone but veto already declined', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game.FascPoliciesEnacted = 5;
      game.status = Status.VETO_DECLINED;
      game.currentChan = player1.name;
      expect(logicService.getCurrentChan(game).role).toBe(Role.LIB);
      game.chanCards = [R, R];
      expect(defaultActionService.defaultChanPlay(game)).not.toBeNull();
    });

    it('does request veto for a lib on RR in veto zone', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game.FascPoliciesEnacted = 5;
      game.status = Status.CHAN_PLAY;
      game.currentChan = player1.name;
      expect(logicService.getCurrentChan(game).role).toBe(Role.LIB);
      game.chanCards = [R, R];
      expect(defaultActionService.defaultChanPlay(game)).toBeNull();
    });

    it('does not request veto for a lib on RB or BB in veto zone', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game.FascPoliciesEnacted = 5;
      game.status = Status.CHAN_PLAY;
      game.currentChan = player1.name;
      expect(logicService.getCurrentChan(game).role).toBe(Role.LIB);
      game.chanCards = [R, B];
      expect(defaultActionService.defaultChanPlay(game)).not.toBeNull();
      game.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game)).not.toBeNull();
    });

    it('does not request veto for a fasc on BB with fasc if not in veto zone', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game.currentChan = player2.name;
      game.currentPres = player3.name;
      game.status = Status.CHOOSE_CHAN;
      expect(logicService.getCurrentChan(game).team).toBe(Team.FASC);
      expect(logicService.getCurrentPres(game).team).toBe(Team.FASC);
      game.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game)).not.toBeNull();
    });

    it('does request veto for a fasc on BB with fasc if  in veto zone', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game.currentChan = player2.name;
      game.currentPres = player3.name;
      game.status = Status.CHOOSE_CHAN;
      game.FascPoliciesEnacted = 5;
      expect(logicService.getCurrentChan(game).team).toBe(Team.FASC);
      expect(logicService.getCurrentPres(game).team).toBe(Team.FASC);
      game.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game)).toBeNull();
    });

    it('does not request veto for a fasc on BB in veto zone if veto already declined', () => {
      game.FascPoliciesEnacted = 5;
      game.status = Status.VETO_DECLINED;
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game.currentChan = player2.name;
      game.currentPres = player3.name;
      expect(logicService.getCurrentChan(game).team).toBe(Team.FASC);
      expect(logicService.getCurrentPres(game).team).toBe(Team.FASC);
      game.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game)).not.toBeNull();
    });

    it('does not request veto for a fasc on BB in veto zone if pres is lib', () => {
      game.FascPoliciesEnacted = 5;
      game.status = Status.CHOOSE_CHAN;
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game.currentChan = player2.name;
      game.currentPres = player1.name;
      expect(logicService.getCurrentChan(game).team).toBe(Team.FASC);
      expect(logicService.getCurrentPres(game).team).toBe(Team.LIB);
      game.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game)).not.toBeNull();
    });

    it('calls simple version when the game setting is simpleBlind', () => {
      game.settings.simpleBlind = true;
      game.currentChan = player2.name;
      game.chanCards = [B, B];
      defaultActionService.defaultChanPlay(game);
      expect(defaultActionService.getSimpleChanDropProbs).toBeCalledTimes(1);
      expect(defaultActionService.getChanDropProbs).toBeCalledTimes(0);
    });
  });

  describe('defaultChanClaim', () => {
    beforeEach(() => {
      jest
        .spyOn(defaultActionService, 'getFascFascBlueChanClaim')
        .mockImplementation(() => [0.5, 0.5]);
      jest.spyOn(defaultActionService, 'getSimpleFascFascBlueChanClaim');
    });

    it('tells the truth when lib', () => {
      game.currentChan = player1.name;
      expect(logicService.getCurrentChan(game).role).toBe(Role.LIB);
      game.chanCards = [B, B];
      expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.BB);
      game.chanCards = [R, B];
      expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.RB);
      game.chanCards = [R, R];
      expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.RR);
      expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(0);
      expect(
        defaultActionService.getSimpleFascFascBlueChanClaim,
      ).toBeCalledTimes(0);
    });

    it('fasc claim RR if a red is played', () => {
      game.currentChan = player2.name;
      game.currentPres = player3.name;
      game.chanPlay = R;
      expect(logicService.getCurrentChan(game).team).toBe(Team.FASC);
      expect(logicService.getCurrentChan(game).team).toBe(Team.FASC);
      game.chanCards = [R, B];
      expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.RR);
      game.chanCards = [R, R];
      expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.RR);
      expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(0);
      expect(
        defaultActionService.getSimpleFascFascBlueChanClaim,
      ).toBeCalledTimes(0);
    });

    it('doesnt lie as a fasc if pres is lib', () => {
      game.currentChan = player2.name;
      game.currentPres = player1.name;
      game.chanPlay = B;
      expect(logicService.getCurrentChan(game).team).toBe(Team.FASC);
      expect(logicService.getCurrentPres(game).team).toBe(Team.LIB);
      game.chanCards = [R, B];
      expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.RB);
      game.chanCards = [B, B];
      expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.BB);
      expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(0);
      expect(
        defaultActionService.getSimpleFascFascBlueChanClaim,
      ).toBeCalledTimes(0);
    });

    it('doesnt lie as a fasc if hitler is the chan regardless of who is pres', () => {
      game.currentChan = player3.name;
      game.currentPres = player1.name;
      game.chanPlay = B;
      expect(logicService.getCurrentChan(game).role).toBe(Role.HITLER);
      expect(logicService.getCurrentPres(game).team).toBe(Team.LIB);
      game.chanCards = [R, B];
      expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.RB);
      game.chanCards = [B, B];
      expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.BB);
      //fasc pres
      game.currentPres = player2.name;
      expect(logicService.getCurrentPres(game).team).toBe(Team.FASC);
      game.chanCards = [R, B];
      expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.RB);
      game.chanCards = [B, B];
      expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.BB);

      expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(0);
      expect(
        defaultActionService.getSimpleFascFascBlueChanClaim,
      ).toBeCalledTimes(0);
    });

    it('it calls getFascFascBlueChanClaim when fasc fasc to get claim', () => {
      game.currentChan = player2.name;
      game.currentPres = player3.name;
      game.chanPlay = B;
      expect(logicService.getCurrentChan(game).role).toBe(Role.FASC);
      expect(logicService.getCurrentPres(game).team).toBe(Team.FASC);
      game.chanCards = [R, B];
      defaultActionService.testProb = (threshold) => 0.4 < threshold;
      expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.BB); //mockImplementation
      game.chanCards = [B, B];
      expect(defaultActionService.defaultChanClaim(game)).toBe(CHAN2.RB); //mockImplementation
      expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(2);
      expect(
        defaultActionService.getSimpleFascFascBlueChanClaim,
      ).toBeCalledTimes(0);
    });

    it('calls simple version when the game setting is simpleBlind', () => {
      game.settings.simpleBlind = true;
      game.currentPres = player3.name;
      game.currentChan = player2.name;
      game.chanPlay = B;
      game.chanCards = [B, B];
      defaultActionService.defaultChanClaim(game);
      expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(0);
      expect(
        defaultActionService.getSimpleFascFascBlueChanClaim,
      ).toBeCalledTimes(1);
    });
  });

  describe('defaultPresClaim', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      jest
        .spyOn(defaultActionService, 'getPresClaimWithLibProbs')
        .mockImplementation(() => [1, 1, 1, 1, 1]);
      jest
        .spyOn(defaultActionService, 'getPresClaimWithFascProbs')
        .mockImplementation(() => [1, 1]);
    });

    describe('lib pres', () => {
      it('tells the truth as a lib', () => {
        game.currentPres = player1.name;
        expect(logicService.getCurrentPres(game).role).toBe(Role.LIB);
        game.presCards = [B, B, B];
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.BBB);
        game.presCards = [R, B, B];
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RBB);
        game.presCards = [R, R, B];
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB);
        game.presCards = [R, R, R];
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRR);
        expect(defaultActionService.getPresClaimWithLibProbs).toBeCalledTimes(
          0,
        );
        expect(defaultActionService.getPresClaimWithFascProbs).toBeCalledTimes(
          0,
        );
      });
    });

    describe('fasc pres with lib chan', () => {
      it('claims different than what was passed when discarding a B if passes testprob', () => {
        game.currentPres = player2.name;
        game.currentChan = player1.name;
        game.presDiscard = B;
        expect(logicService.getCurrentPres(game).role).toBe(Role.FASC);
        expect(logicService.getCurrentChan(game).role).toBe(Role.LIB);
        game.presCards = [R, R, B];
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB);
        game.presCards = [R, B, B];
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB);
        game.presCards = [B, B, B];
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RBB);
        expect(defaultActionService.getPresClaimWithLibProbs).toBeCalledTimes(
          3,
        );
        expect(defaultActionService.getPresClaimWithFascProbs).toBeCalledTimes(
          0,
        );
      });

      it('claims in line with what was passed when discarding a B if fails testprob', () => {
        jest
          .spyOn(defaultActionService, 'getPresClaimWithLibProbs')
          .mockImplementation(() => [0, 0, 0, 0, 0]);

        game.currentPres = player2.name;
        game.currentChan = player1.name;
        game.presDiscard = B;
        expect(logicService.getCurrentPres(game).role).toBe(Role.FASC);
        expect(logicService.getCurrentChan(game).role).toBe(Role.LIB);
        game.presCards = [R, R, B];
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRR);
        game.presCards = [R, B, B];
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB);
        game.presCards = [B, B, B];
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.BBB);
        expect(defaultActionService.getPresClaimWithLibProbs).toBeCalledTimes(
          3,
        );
        expect(defaultActionService.getPresClaimWithFascProbs).toBeCalledTimes(
          0,
        );
      });

      it('claims different than what was passed when discarding a R if passes testprob', () => {
        game.currentPres = player2.name;
        game.currentChan = player1.name;
        game.presDiscard = R;
        expect(logicService.getCurrentPres(game).role).toBe(Role.FASC);
        expect(logicService.getCurrentChan(game).role).toBe(Role.LIB);
        game.presCards = [R, R, R];
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB);
        game.presCards = [R, R, B];
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RBB);
        game.presCards = [R, B, B];
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.BBB);
        expect(defaultActionService.getPresClaimWithLibProbs).toBeCalledTimes(
          3,
        );
        expect(defaultActionService.getPresClaimWithFascProbs).toBeCalledTimes(
          0,
        );
      });

      it('claims in line with what was passed when discarding a R if fails testprob', () => {
        jest
          .spyOn(defaultActionService, 'getPresClaimWithLibProbs')
          .mockImplementation(() => [0, 0, 0, 0, 0]);
        game.currentPres = player2.name;
        game.currentChan = player1.name;
        game.presDiscard = R;
        expect(logicService.getCurrentPres(game).role).toBe(Role.FASC);
        expect(logicService.getCurrentChan(game).role).toBe(Role.LIB);
        game.presCards = [R, R, R];
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRR);
        game.presCards = [R, R, B];
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB);
        game.presCards = [R, B, B];
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RBB);
        expect(defaultActionService.getPresClaimWithLibProbs).toBeCalledTimes(
          3,
        );
        expect(defaultActionService.getPresClaimWithFascProbs).toBeCalledTimes(
          0,
        );
      });

      it('calls simple version when the game setting is simpleBlind', () => {
        jest.spyOn(defaultActionService, 'getSimplePresClaimWithLibProbs');
        jest.spyOn(defaultActionService, 'getPresClaimWithLibProbs');
        game.settings.simpleBlind = true;
        game.currentPres = player3.name;
        game.currentChan = player1.name;
        game.presDiscard = B;
        game.chanCards = [B, B];
        game.presCards = [B, B, B];
        defaultActionService.defaultPresClaim(game);
        expect(defaultActionService.getPresClaimWithLibProbs).toBeCalledTimes(
          0,
        );
        expect(
          defaultActionService.getSimplePresClaimWithLibProbs,
        ).toBeCalledTimes(1);
      });
    });

    describe('fasc pres with fasc chan', () => {
      it('claims inline with chan and changes as appropriate when passing testprob', () => {
        game.currentPres = player3.name;
        game.currentChan = player2.name;
        game.presCards = [B, B, B];
        expect(logicService.getCurrentPres(game).team).toBe(Team.FASC);
        expect(logicService.getCurrentChan(game).team).toBe(Team.FASC);
        game.chanClaim = CHAN2.RR;
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB);
        game.chanClaim = CHAN2.RB;
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB);
        game.chanClaim = CHAN2.BB;
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.BBB);
        expect(defaultActionService.getPresClaimWithLibProbs).toBeCalledTimes(
          0,
        );
        expect(defaultActionService.getPresClaimWithFascProbs).toBeCalledTimes(
          3,
        );
      });

      it('claims inline with chan and doesnt change when failing testprob', () => {
        jest
          .spyOn(defaultActionService, 'getPresClaimWithFascProbs')
          .mockImplementation(() => [0, 0]);

        game.currentPres = player3.name;
        game.currentChan = player2.name;
        game.presCards = [B, B, B];
        expect(logicService.getCurrentPres(game).team).toBe(Team.FASC);
        expect(logicService.getCurrentChan(game).team).toBe(Team.FASC);
        game.chanClaim = CHAN2.RR;
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRR);
        game.chanClaim = CHAN2.RB;
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RRB);
        game.chanClaim = CHAN2.BB;
        expect(defaultActionService.defaultPresClaim(game)).toBe(PRES3.RBB);
        expect(defaultActionService.getPresClaimWithLibProbs).toBeCalledTimes(
          0,
        );
        expect(defaultActionService.getPresClaimWithFascProbs).toBeCalledTimes(
          3,
        );
      });
    });
  });

  describe('getFascInvConfProb', () => {
    let underclaimTotal: number;
    let is3Red: boolean;
    let isDoubleDipping: boolean;

    beforeEach(() => {
      jest.resetAllMocks();
      jest
        .spyOn(defaultActionService, 'underclaimTotal')
        .mockImplementation(() => underclaimTotal);
      jest
        .spyOn(defaultActionService, 'is3Red')
        .mockImplementation(() => is3Red);
      jest
        .spyOn(defaultActionService, 'doubleDipping')
        .mockImplementation(() => isDoubleDipping);
    });

    it('calls fasc fasc if already in conflict', () => {
      game.confs.push({
        confer: player2.name,
        confee: player3.name,
        type: Conf.INV,
      });
      expect(
        defaultActionService.getFascInvConfProb(game, player2, player3),
      ).toEqual(1);
    });

    it('calls fasc fasc if already in conflict - advanced', () => {
      game.invClaims.push({
        investigator: player3.name,
        investigatee: player2.name,
        claim: Team.LIB,
      });
      game.confs.push({
        confer: player1.name,
        confee: player2.name,
        type: Conf.POLICY,
      });
      logicService.addIndirectConfs(
        game,
        player1.name,
        player2.name,
        Conf.POLICY,
      );
      expect(
        defaultActionService.getFascInvConfProb(game, player1, player3),
      ).toEqual(1);
    });

    it('confs based on the correct prob on double dip after confing a lib', () => {
      isDoubleDipping = true;
      game.currentChan = player1.name;
      expect(
        defaultActionService.getFascInvConfProb(game, player2, player1),
      ).toEqual(0.6);
      expect(
        defaultActionService.getFascInvConfProb(game, player2, player2),
      ).toEqual(0.33);
      expect(
        defaultActionService.getFascInvConfProb(game, player2, player3),
      ).toEqual(0.15);
    });

    it('confs based on the correct prob on double dip after confing a fasc', () => {
      isDoubleDipping = true;
      game.currentChan = player2.name;
      expect(
        defaultActionService.getFascInvConfProb(game, player2, player1),
      ).toEqual(1);
      expect(
        defaultActionService.getFascInvConfProb(game, player2, player2),
      ).toEqual(0);
      expect(
        defaultActionService.getFascInvConfProb(game, player2, player3),
      ).toEqual(0);
    });

    it('lies about a fasc role (says lib) 60% of time if underclaim and 3red conditions met', () => {
      isDoubleDipping = false;
      is3Red = true;
      underclaimTotal = 3;
      expect(
        defaultActionService.getFascInvConfProb(game, player2, player3),
      ).toEqual(1);
      underclaimTotal = 2;
      expect(
        defaultActionService.getFascInvConfProb(game, player2, player3),
      ).toEqual(0.6);
      underclaimTotal = 1;
      expect(
        defaultActionService.getFascInvConfProb(game, player2, player3),
      ).toEqual(0);
      is3Red = false;
      underclaimTotal = 4;
      expect(
        defaultActionService.getFascInvConfProb(game, player2, player3),
      ).toEqual(0);
    });

    it('returns the proper hitlerProb based on number of blues', () => {
      isDoubleDipping = false;
      let hitlerInvLibLieProbs = [0.55, 0.65, 0.75, 0.85, 1];
      for (let blues = 0; blues <= 4; blues++) {
        game.LibPoliciesEnacted = blues;
        expect(
          defaultActionService.getFascInvConfProb(game, player3, player1),
        ).toEqual(hitlerInvLibLieProbs[blues]);
      }
    });

    it('returns the proper vanilla Prob based on number of blues', () => {
      isDoubleDipping = false;
      let vanillaFascInvLibLieProbs = [0.85, 0.95, 1, 1, 1];
      for (let blues = 0; blues <= 4; blues++) {
        game.LibPoliciesEnacted = blues;
        expect(
          defaultActionService.getFascInvConfProb(game, player2, player1),
        ).toEqual(vanillaFascInvLibLieProbs[blues]);
      }
    });

    describe('getSimpleFascInvConfProb', () => {
      it('never confs a fellow fasc', () => {
        expect(
          defaultActionService.getSimpleFascInvConfProb(game, player2, player3),
        ).toEqual(0);
        expect(
          defaultActionService.getSimpleFascInvConfProb(game, player3, player2),
        ).toEqual(0);
      });

      it('returns the proper hitlerProb based on number of blues', () => {
        isDoubleDipping = false;
        let hitlerInvLibLieProbs = [0.55, 0.8, 1, 1, 1];
        for (let blues = 0; blues <= 4; blues++) {
          game.LibPoliciesEnacted = blues;
          expect(
            defaultActionService.getSimpleFascInvConfProb(
              game,
              player3,
              player1,
            ),
          ).toEqual(hitlerInvLibLieProbs[blues]);
        }
      });

      it('returns 1 for vanilla fasc', () => {
        isDoubleDipping = false;
        for (let blues = 0; blues <= 4; blues++) {
          game.LibPoliciesEnacted = blues;
          expect(
            defaultActionService.getSimpleFascInvConfProb(
              game,
              player2,
              player1,
            ),
          ).toEqual(1);
        }
      });

      it('calls fasc fasc if already in conflict', () => {
        game.confs.push({
          confer: player2.name,
          confee: player3.name,
          type: Conf.INV,
        });
        expect(
          defaultActionService.getFascInvConfProb(game, player2, player3),
        ).toEqual(1);
      });
    });
  });

  describe('getPresDropProbs', () => {
    beforeEach(() => {
      game.currentPres = 'player-1';
      game.currentChan = 'player-2';
    });

    describe('determines RBB drop prob for vanilla Fasc', () => {
      beforeEach(() => {
        game.currentPres = 'player-2';
        game.currentChan = 'player-1';
        defaultActionService.lib3RedOnThisDeck = () => false;
      });

      it('returns .5 for fasc pres with lib chan on RBB with not lib3red', () => {
        const [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(0.5);
      });

      it('returns .9 for fasc pres with lib chan on RBB with lib3red', () => {
        defaultActionService.lib3RedOnThisDeck = () => true;
        const [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(0.9);
      });

      it('returns 1 for fasc pres with lib chan on RBB if 4 blues down', () => {
        game.LibPoliciesEnacted = 4;
        // defaultActionService.lib3RedOnThisDeck = () => true
        const [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(1);
      });

      it('returns 1 or .25 for fasc pres with fasc chan when no power and no more than 1 blue down', () => {
        game.currentChan = player3.name;
        game.LibPoliciesEnacted = 1;
        defaultActionService.isPower = () => false;
        let [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        defaultActionService.lib3RedOnThisDeck = () => true;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(0.25);
        defaultActionService.isPower = () => true;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(1);
        defaultActionService.isPower = () => false;
        game.LibPoliciesEnacted = 3;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(1);
      });
    });

    describe('determines RBB drop prob for Hitler', () => {
      beforeEach(() => {
        game.currentPres = 'player-3';
        game.currentChan = 'player-1';
        defaultActionService.lib3RedOnThisDeck = () => false;
        game.LibPoliciesEnacted = 0;
      });

      it('returns .6 for hitler pres with lib or fasc chan on RBB with 0 to 1 blue down', () => {
        let [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(0.6);
        game.LibPoliciesEnacted = 1;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(0.6);
        game.currentChan = player2.name;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(0.6);
        game.LibPoliciesEnacted = 1;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(0.6);
      });

      it('returns .9 for hitler pres with lib or fasc chan on RBB with 2 blues down', () => {
        game.LibPoliciesEnacted = 2;
        let [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(0.9);
        game.currentChan = player2.name;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(0.9);
      });

      it('returns 1 for hitler pres with lib chan on RBB with 3 or 4 blues down', () => {
        game.LibPoliciesEnacted = 3;
        let [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(1);
        game.LibPoliciesEnacted = 4;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(1);
        game.currentChan = player2.name;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(1);
        game.LibPoliciesEnacted = 4;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(1);
      });

      it('returns 1 for hitler pres on RBB if 4 blues down', () => {
        game.LibPoliciesEnacted = 4;
        // defaultActionService.lib3RedOnThisDeck = () => true
        const [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(1);
      });

      it('returns 1 for hitler pres with fasc chan in antiDD', () => {
        defaultActionService.isAntiDD = () => true;
        game.currentChan = player2.name;
        const [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(1);
      });

      it('returns 1 for hitler pres in cucu', () => {
        defaultActionService.isCucu = () => true;
        game.currentChan = player2.name;
        const [RBBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RBBDropProb).toEqual(1);
      });
    });

    describe('determines RRB drop prob for vanilla fasc', () => {
      beforeEach(() => {
        game.currentPres = 'player-2';
        game.currentChan = 'player-2';
        defaultActionService.lib3RedOnThisDeck = () => false;
        game.LibPoliciesEnacted = 2;
      });

      it('returns 1 for fasc pres with lib chan', () => {
        game.currentChan = 'player-1';
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RRBDropProb).toEqual(1);
      });

      it('returns 0 for fasc pres with vanilla fasc chan && notCucu', () => {
        defaultActionService.isCucu = () => false;
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RRBDropProb).toEqual(0);
      });

      it('does not return 0 for fasc pres with hitler chan && notCucu', () => {
        game.currentChan = player3.name;
        defaultActionService.isCucu = () => false;
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RRBDropProb).not.toEqual(0);
      });

      it('does not return 0 for fasc pres with vanilla fasc chan && Cucu', () => {
        defaultActionService.isCucu = () => true;
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RRBDropProb).not.toEqual(0);
      });

      it('returns 0 for fasc pres with vanilla fasc chan and <= 1 blue and no power', () => {
        defaultActionService.isCucu = () => false;
        defaultActionService.isPower = () => false;
        game.LibPoliciesEnacted = 1;
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RRBDropProb).toEqual(0);
      });

      it('does not return 0 for fasc pres with vanilla fasc chan and > 1 blue and no power', () => {
        defaultActionService.isCucu = () => true;
        defaultActionService.isPower = () => false;
        game.LibPoliciesEnacted = 2;
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RRBDropProb).not.toEqual(0);
      });

      it('does not return 0 for fasc pres with vanilla fasc chan and <= 1 blue if there is a power', () => {
        defaultActionService.isCucu = () => true;
        defaultActionService.isPower = () => true;
        game.LibPoliciesEnacted = 1;
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RRBDropProb).not.toEqual(0);
      });

      it('returns .6 when hitler chan <= 3 blues down and no power', () => {
        game.currentChan = player3.name;
        defaultActionService.isPower = () => false;
        game.LibPoliciesEnacted = 3;
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RRBDropProb).toEqual(0.4);
      });
    });

    describe('determines RRB drop prob for hitler', () => {
      beforeEach(() => {
        game.currentPres = 'player-3';
        game.currentChan = 'player-1';
        game.LibPoliciesEnacted = 0;
        defaultActionService.isPower = () => false;
        player3.bluesPlayed = 0;
      });

      it('returns 1 if >= 3 reds down', () => {
        game.FascPoliciesEnacted = 3;
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RRBDropProb).toEqual(1);
      });

      it('returns 1 if 3 or 4 blues down', () => {
        game.LibPoliciesEnacted = 3;
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RRBDropProb).toEqual(1);
        game.LibPoliciesEnacted = 4;
        [, RRBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RRBDropProb).toEqual(1);
      });

      it('returns according to chart with no power', () => {
        let hitlerProbs = [
          [0.25, null, null, null, null],
          [0.4, 0.3, null, null, null],
          [0.9, 0.5, 0.7, null, null],
          [1, 1, 1, 1, null],
          [1, 1, 1, 1, 1],
        ];

        for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
          for (let bluesPlayed = 0; bluesPlayed <= bluesDown; bluesPlayed++) {
            player3.bluesPlayed = bluesPlayed;
            game.LibPoliciesEnacted = bluesDown;
            let [, RRBDropProb] = defaultActionService.getPresDropProbs(game);
            expect(RRBDropProb).toEqual(hitlerProbs[bluesDown][bluesPlayed]);
          }
        }
      });

      it('returns according to chart with power', () => {
        defaultActionService.isPower = () => true;

        let hitlerProbs = [
          [0.25, null, null, null, null],
          [0.4, 0.3, null, null, null],
          [1.2, 0.8, 1, null, null],
          [1, 1, 1, 1, null],
          [1, 1, 1, 1, 1],
        ];

        for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
          for (let bluesPlayed = 0; bluesPlayed <= bluesDown; bluesPlayed++) {
            player3.bluesPlayed = bluesPlayed;
            game.LibPoliciesEnacted = bluesDown;
            let [, RRBDropProb] = defaultActionService.getPresDropProbs(game);
            expect(RRBDropProb).toEqual(hitlerProbs[bluesDown][bluesPlayed]);
          }
        }
      });

      it('returns 0 in antiDD', () => {
        defaultActionService.isAntiDD = () => true;
        game.currentChan = player2.name;
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game);
        expect(RRBDropProb).toEqual(0);
      });
    });
  });

  describe('getChanDropProbs', () => {
    describe('determines fasc and hitler drop prob with lib pres', () => {
      beforeEach(() => {
        game.currentPres = 'player-1';
        game.currentChan = 'player-2';
        defaultActionService.invPower = () => false;
        defaultActionService.isCucu = () => false;
        game.LibPoliciesEnacted = 0;
        game.FascPoliciesEnacted = 0;
      });

      it('returns according to the chart for vanilla', () => {
        let vanillaProbs = [
          [0.75, null, null, null, null],
          [0.85, 0.85, null, null, null],
          [0.9, 0.9, 0.9, null, null],
          [0.95, 0.95, 0.95, 0.95, null],
          [1, 1, 1, 1, 1],
        ];

        for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
          for (let bluesPlayed = 0; bluesPlayed <= bluesDown; bluesPlayed++) {
            player2.bluesPlayed = bluesPlayed;
            game.LibPoliciesEnacted = bluesDown;
            let dropProb = defaultActionService.getChanDropProbs(game);
            expect(dropProb).toEqual(vanillaProbs[bluesDown][bluesPlayed]);
          }
        }
      });

      it('returns according to the chart for hitler', () => {
        game.currentChan = 'player-3';
        let hitlerProbs = [
          [0.2, null, null, null, null],
          [0.3, 0.15, null, null, null],
          [0.7, 0.4, 0.3, null, null],
          [0.85, 0.75, 0.5, 0.25, null],
          [1, 1, 1, 1, 1],
        ];

        for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
          for (let bluesPlayed = 0; bluesPlayed <= bluesDown; bluesPlayed++) {
            player3.bluesPlayed = bluesPlayed;
            game.LibPoliciesEnacted = bluesDown;
            let dropProb = defaultActionService.getChanDropProbs(game);
            expect(dropProb).toEqual(hitlerProbs[bluesDown][bluesPlayed]);
          }
        }
      });

      it('accounts for inv for vanilla fasc in 8 or less players', () => {
        defaultActionService.invPower = () => true;
        game.LibPoliciesEnacted = 1;
        let dropProb = defaultActionService.getChanDropProbs(game);
        expect(dropProb).toEqual(0.3);
      });

      it('accounts for inv for vanilla fasc in 9 and 10 player', () => {
        defaultActionService.invPower = () => true;
        for (let i = 0; i < 4; i++) {
          game.players.push(new PlayerMockFactory().create());
        }
        game.LibPoliciesEnacted = 1;
        let dropProb = defaultActionService.getChanDropProbs(game);
        expect(dropProb).toEqual(0.65);
      });

      it('returns 0 if hitler is being cucu by lib', () => {
        game.currentChan = player3.name;
        defaultActionService.isCucu = () => true;
        game.LibPoliciesEnacted = 1;
        let dropProb = defaultActionService.getChanDropProbs(game);
        expect(dropProb).toEqual(0);
      });

      it('returns 1 if 4 blues or 5 reds', () => {
        game.currentChan = player3.name;
        defaultActionService.isCucu = () => true;
        game.LibPoliciesEnacted = 4;
        let dropProb = defaultActionService.getChanDropProbs(game);
        expect(dropProb).toEqual(1);
        game.LibPoliciesEnacted = 0;
        game.FascPoliciesEnacted = 5;
        dropProb = defaultActionService.getChanDropProbs(game);
        expect(dropProb).toEqual(1);
      });

      it('returns varying probs in 8 or under player the gun situation', () => {
        game.players = [];
        for (let i = 1; i < 9; i++) {
          game.players.push(
            new PlayerMockFactory().create({
              name: `player-${i}`,
              team: i <= 3 ? Team.FASC : Team.LIB,
            }),
          );
        }
        defaultActionService.gunPower = () => true;
        game.currentPres = game.players[3].name;
        game.currentChan = game.players[2].name;
        game.FascPoliciesEnacted = 3;
        // <= 3 blue down and pres without topdeck
        defaultActionService.presAgainWithoutTopDeck = () => true;
        game.LibPoliciesEnacted = 3;
        expect(defaultActionService.getChanDropProbs(game)).toEqual(1.1);
        // <= 3 blue down and not pres without topdeck
        defaultActionService.presAgainWithoutTopDeck = () => false;
        game.LibPoliciesEnacted = 3;
        expect(defaultActionService.getChanDropProbs(game)).toEqual(0.5);
        //confirmed lib
        defaultActionService.confirmedLib = () => true;
        expect(
          Math.abs(defaultActionService.getChanDropProbs(game) - 0.3),
        ).toBeLessThanOrEqual(0.001);
        //inANyConflict
        defaultActionService.inAnyConflict = () => true;
        expect(
          Math.abs(defaultActionService.getChanDropProbs(game) - 0.1),
        ).toBeLessThanOrEqual(0.001);
      });

      it('returns varying probs in 8 or under player the gun situation remaining special cases', () => {
        game.players = [];
        for (let i = 1; i < 8; i++) {
          game.players.push(
            new PlayerMockFactory().create({
              name: `player-${i}`,
              team: i <= 3 ? Team.FASC : Team.LIB,
            }),
          );
        }
        defaultActionService.gunPower = () => true;
        game.currentPres = game.players[3].name;
        game.currentChan = game.players[2].name;
        game.FascPoliciesEnacted = 4;
        // <= 1 blue down
        game.LibPoliciesEnacted = 1;
        expect(defaultActionService.getChanDropProbs(game)).toEqual(0.05);
        // 4 blues down
        game.LibPoliciesEnacted = 4;
        expect(defaultActionService.getChanDropProbs(game)).toEqual(1);
        //in fasc fasc conflict
        game.LibPoliciesEnacted = 1;
        game.confs.push({
          confer: game.players[2].name,
          confee: game.players[1].name,
          type: Conf.INV,
        });
        expect(defaultActionService.getChanDropProbs(game)).toEqual(1);
        //no lib majority
        game.players[6].alive = false;
        expect(defaultActionService.getChanDropProbs(game)).toEqual(0);
      });
    });

    describe('determines fasc and hitler drop prob with fasc pres', () => {
      beforeEach(() => {
        game.currentPres = 'player-2';
        game.currentChan = 'player-2';
        defaultActionService.invPower = () => false;
        defaultActionService.isCucu = () => false;
        game.LibPoliciesEnacted = 0;
        game.FascPoliciesEnacted = 0;
      });

      it('vanilla fasc drops with fasc pres for a power', () => {
        defaultActionService.isPower = () => true;
        let dropProb = defaultActionService.getChanDropProbs(game);
        expect(dropProb).toEqual(1);
      });

      it('vanilla fasc does not drop with fasc pres if low blues and no power', () => {
        game.LibPoliciesEnacted = 1;
        let dropProb = defaultActionService.getChanDropProbs(game);
        expect(dropProb).toEqual(0.1);
      });

      it('vanilla fasc drops as usual for now power with fasc pres if blue is at least 2', () => {
        game.LibPoliciesEnacted = 2;
        let dropProb = defaultActionService.getChanDropProbs(game);
        expect(dropProb).toEqual(0.9);
      });

      it('vanilla fasc drops with fasc in cucu if 3 blues or 3 reds', () => {
        defaultActionService.isCucu = () => true;
        game.LibPoliciesEnacted = 3;
        let dropProb = defaultActionService.getChanDropProbs(game);
        expect(dropProb).toEqual(1);
        game.LibPoliciesEnacted = 0;
        game.FascPoliciesEnacted = 3;
        dropProb = defaultActionService.getChanDropProbs(game);
        expect(dropProb).toEqual(1);
      });

      it('vanilla fasc drops with fasc in cucu if 3 blues or 3 reds', () => {
        defaultActionService.isCucu = () => true;
        game.LibPoliciesEnacted = 2;
        game.FascPoliciesEnacted = 2;
        let dropProb = defaultActionService.getChanDropProbs(game);
        expect(dropProb).toEqual(0.5);
        game.currentChan = player3.name;
        dropProb = defaultActionService.getChanDropProbs(game);
        expect(dropProb).toEqual(0.3);
      });
    });
  });

  describe('getfascfascbluechanclaim', () => {
    let underclaimTotal: number;
    beforeEach(() => {
      game.currentPres = 'player-2';
      game.currentChan = 'player-2';
      // defaultActionService.lib3RedOnThisDeck = () => false
      defaultActionService.underclaimTotal = () => underclaimTotal;
    });

    it('underclaims BB prob 1 if overclaims are high ', () => {
      underclaimTotal = -2;
      expect(
        defaultActionService.getFascFascBlueChanClaim(game, CHAN2.BB)[0],
      ).toBe(1);
    });

    it('underclaims BB prob .9 if lib3Red and no underclaim ', () => {
      underclaimTotal = 0;
      defaultActionService.lib3RedOnThisDeck = () => true;
      expect(
        defaultActionService.getFascFascBlueChanClaim(game, CHAN2.BB)[0],
      ).toBe(0.9);
      defaultActionService.lib3RedOnThisDeck = () => false;
      expect(
        defaultActionService.getFascFascBlueChanClaim(game, CHAN2.BB)[0],
      ).not.toBe(0.9);
    });

    it('underclaims BB prob .9 if <= 1 underclaim and lib3red and no fasc3Red', () => {
      underclaimTotal = 0;
      defaultActionService.lib3RedOnThisDeck = () => true;
      defaultActionService.fasc3RedOnThisDeck = () => false;
      expect(
        defaultActionService.getFascFascBlueChanClaim(game, CHAN2.BB)[0],
      ).toBe(0.9);
      defaultActionService.fasc3RedOnThisDeck = () => true;
      expect(
        defaultActionService.getFascFascBlueChanClaim(game, CHAN2.BB)[0],
      ).not.toBe(0.9);
      defaultActionService.fasc3RedOnThisDeck = () => false;
      defaultActionService.lib3RedOnThisDeck = () => false;
      expect(
        defaultActionService.getFascFascBlueChanClaim(game, CHAN2.BB)[0],
      ).not.toBe(0.9);
    });

    it('underclaims BB prob 0 if >= 2 underclaim or other', () => {
      underclaimTotal = 2;
      defaultActionService.lib3RedOnThisDeck = () => true;
      defaultActionService.fasc3RedOnThisDeck = () => false;
      expect(
        defaultActionService.getFascFascBlueChanClaim(game, CHAN2.BB)[0],
      ).toBe(0);
      underclaimTotal = 1;
      defaultActionService.lib3RedOnThisDeck = () => false;
      defaultActionService.fasc3RedOnThisDeck = () => false;
      expect(
        defaultActionService.getFascFascBlueChanClaim(game, CHAN2.BB)[0],
      ).toBe(0);
    });

    it('overclaims RB prob .75 if no underclaims/overclaims and blue count <= 2', () => {
      underclaimTotal = 0;
      defaultActionService.deck1BlueCount = () => 2;
      //not if overclaim
      underclaimTotal = -1;
      expect(
        defaultActionService.getFascFascBlueChanClaim(game, CHAN2.RB)[1],
      ).not.toBe(0.75);
      // not if deck1BlueCount too high
      underclaimTotal = 0;
      defaultActionService.deck1BlueCount = () => 3;
      expect(
        defaultActionService.getFascFascBlueChanClaim(game, CHAN2.RB)[1],
      ).not.toBe(0.75);
    });

    it('overclaims RB prob .9 if underclaim is 1 and no lib3red (cover for fasc)', () => {
      underclaimTotal = 1;
      defaultActionService.lib3RedOnThisDeck = () => false;
      expect(
        defaultActionService.getFascFascBlueChanClaim(game, CHAN2.RB)[1],
      ).toBe(0.9);
      // not if a lib3Red
      defaultActionService.lib3RedOnThisDeck = () => true;
      expect(
        defaultActionService.getFascFascBlueChanClaim(game, CHAN2.RB)[1],
      ).not.toBe(0.9);
    });

    it('overclaims RB prob 1 if underclaim is at least 2', () => {
      underclaimTotal = 2;
      expect(
        defaultActionService.getFascFascBlueChanClaim(game, CHAN2.RB)[1],
      ).toBe(1);
    });

    it('overclaims RB prob 0 otherwise', () => {
      underclaimTotal = -1;
      defaultActionService.lib3RedOnThisDeck = () => true;
      expect(
        defaultActionService.getFascFascBlueChanClaim(game, CHAN2.RB)[1],
      ).toBe(0);
    });
  });

  describe('getPresClaimWithLibProbs', () => {
    let underclaimTotal: number;
    beforeEach(() => {
      underclaimTotal = 0;
      game.currentPres = 'player-2';
      game.currentChan = 'player-1';
      defaultActionService.lib3RedOnThisDeck = () => false;
      defaultActionService.underclaimTotal = () => underclaimTotal;
      defaultActionService.invPower = () => false;
      for (let i = 0; i < 2; i++) {
        game.players.push(new PlayerMockFactory().create());
      }
    });

    it('returns RRBConfProb according to blues blues down', () => {
      const fascRRBconfProbs = [0.75, 0.85, 0.95, 1, 1];
      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        game.LibPoliciesEnacted = bluesDown;
        let [fascRRBconfProb] =
          defaultActionService.getPresClaimWithLibProbs(game);
        expect(fascRRBconfProb).toEqual(fascRRBconfProbs[bluesDown]);
      }
    });

    it('returns RRRConfProb according to blues blues down', () => {
      const fascRRRconfProbs = [0.4, 0.6, 0.8, 0.9, 1];
      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        game.LibPoliciesEnacted = bluesDown;
        let [, , fascRRRconfProb] =
          defaultActionService.getPresClaimWithLibProbs(game);
        expect(fascRRRconfProb).toEqual(fascRRRconfProbs[bluesDown]);
      }
    });

    it('returns RRBConfProb of .5 on inv regardless of blues down', () => {
      defaultActionService.invPower = () => true;
      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        game.LibPoliciesEnacted = bluesDown;
        let [fascRRBconfProb] =
          defaultActionService.getPresClaimWithLibProbs(game);
        expect(fascRRBconfProb).toEqual(0.5);
      }
    });

    it('returns RRBConfProb of .2 if less than 7 players or 8 players', () => {
      game.players.push(new PlayerMockFactory().create());
      expect(game.players).toHaveLength(8);
      defaultActionService.invPower = () => true;
      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        game.LibPoliciesEnacted = bluesDown;
        let [fascRRBconfProb] =
          defaultActionService.getPresClaimWithLibProbs(game);
        expect(fascRRBconfProb).toEqual(0.2);
      }
      game.players = game.players.slice(0, 6);
      defaultActionService.invPower = () => true;
      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        game.LibPoliciesEnacted = bluesDown;
        let [fascRRBconfProb] =
          defaultActionService.getPresClaimWithLibProbs(game);
        expect(fascRRBconfProb).toEqual(0.2);
      }
    });

    it('returns RRRConfProb of .1 if less than 7 players or 8 players', () => {
      game.players.push(new PlayerMockFactory().create());
      expect(game.players).toHaveLength(8);
      defaultActionService.invPower = () => true;
      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        game.LibPoliciesEnacted = bluesDown;
        let [, , fascRRRconfProb] =
          defaultActionService.getPresClaimWithLibProbs(game);
        expect(fascRRRconfProb).toEqual(0.1);
      }
      game.players = game.players.slice(0, 6);
      defaultActionService.invPower = () => true;
      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        game.LibPoliciesEnacted = bluesDown;
        let [, , fascRRRconfProb] =
          defaultActionService.getPresClaimWithLibProbs(game);
        expect(fascRRRconfProb).toEqual(0.1);
      }
    });

    it('does not conf as hitler on RRR or RRB', () => {
      game.currentPres = 'player-3';
      let [fascRRBconfProb, , fascRRRconfProb] =
        defaultActionService.getPresClaimWithLibProbs(game);
      expect(fascRRBconfProb).toEqual(0);
      expect(fascRRRconfProb).toEqual(0);
    });

    it('does not conf if investgiated lib on RRR or RRB', () => {
      game.currentPres = 'player-2';
      game.invClaims.push({
        investigator: 'player-2',
        investigatee: 'player-1',
        claim: Team.LIB,
      });
      let [fascRRBconfProb, , fascRRRconfProb] =
        defaultActionService.getPresClaimWithLibProbs(game);
      expect(fascRRBconfProb).toEqual(0);
      expect(fascRRRconfProb).toEqual(0);
    });

    it('determines fascBBBunderclaimProb of 1 if lib3red otherwise .75', () => {
      game.currentPres = 'player-3';
      let [, fascBBBunderclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game);
      expect(fascBBBunderclaimProb).toEqual(0.75);
      defaultActionService.lib3RedOnThisDeck = () => true;
      [, fascBBBunderclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game);
      expect(fascBBBunderclaimProb).toEqual(1);
    });

    it('determines fascRRBoverclaimProb', () => {
      //Currently never overclaiming

      game.currentPres = 'player-3';
      defaultActionService.lib3RedOnThisDeck = () => true;
      let [, , , fascRRBoverclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game);
      expect(fascRRBoverclaimProb).toEqual(0);
      defaultActionService.lib3RedOnThisDeck = () => false;
      [, , , fascRRBoverclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game);
      expect(fascRRBoverclaimProb).toEqual(0);
      // underclaimTotal = 2;
      // [, , , fascRRBoverclaimProb] =
      //   defaultActionService.getPresClaimWithLibProbs(game);
      // expect(fascRRBoverclaimProb).toEqual(0.9);
      // underclaimTotal = 1;
      // [, , , fascRRBoverclaimProb] =
      //   defaultActionService.getPresClaimWithLibProbs(game);
      // expect(fascRRBoverclaimProb).toEqual(0.25);
    });

    it('determines fascRBBoverclaimProb', () => {
      game.currentPres = 'player-3';
      defaultActionService.lib3RedOnThisDeck = () => true;
      let [, , , , fascRBBoverclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game);
      expect(fascRBBoverclaimProb).toEqual(0);
      defaultActionService.lib3RedOnThisDeck = () => false;
      [, , , , fascRBBoverclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game);
      expect(fascRBBoverclaimProb).toEqual(0);
      underclaimTotal = 2;
      [, , , , fascRBBoverclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game);
      expect(fascRBBoverclaimProb).toEqual(1);
      underclaimTotal = 1;
      [, , , , fascRBBoverclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game);
      expect(fascRBBoverclaimProb).toEqual(0.75);
    });
  });

  describe('getPresClaimWithFascProbs', () => {
    let underclaimTotal: number;
    let presCards: PRES3;
    beforeEach(() => {
      underclaimTotal = 0;
      game.currentPres = 'player-2';
      game.currentChan = 'player-2';
      defaultActionService.lib3RedOnThisDeck = () => false;
      defaultActionService.underclaimTotal = () => underclaimTotal;
      defaultActionService.isAntiDD = () => false;
      defaultActionService.determine3Cards = () => presCards;
      presCards = PRES3.BBB;
    });

    it('returns RRBoverclaimProb according to underclaims and lib3red on RBB', () => {
      presCards = PRES3.RBB;
      let [, RBBoverclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game);
      expect(RBBoverclaimProb).toEqual(0);
      underclaimTotal = 2;
      [, RBBoverclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game);
      expect(RBBoverclaimProb).toEqual(0.9);
      underclaimTotal = 1;
      [, RBBoverclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game);
      expect(RBBoverclaimProb).toEqual(0.9);
      defaultActionService.lib3RedOnThisDeck = () => true;
      [, RBBoverclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game);
      expect(RBBoverclaimProb).toEqual(0);
    });

    it('returns RRBoverclaimProb according to underclaims and lib3red on RRB', () => {
      presCards = PRES3.RRB;
      let [, RBBoverclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game);
      expect(RBBoverclaimProb).toEqual(0);
      underclaimTotal = 2;
      [, RBBoverclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game);
      expect(RBBoverclaimProb).toEqual(0.9);
      underclaimTotal = 1;
      [, RBBoverclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game);
      expect(RBBoverclaimProb).toEqual(0);
      underclaimTotal = 2;
      defaultActionService.lib3RedOnThisDeck = () => true;
      [, RBBoverclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game);
      expect(RBBoverclaimProb).toEqual(0);
      underclaimTotal = 3;
      [, RBBoverclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game);
      expect(RBBoverclaimProb).toEqual(0.9);
    });

    // it('.9 fasc fasc conf if RBB and underclaim >= 1', () => {
    //   underclaimTotal = 1;
    //   presCards = PRES3.RBB;
    //   let [fascFascConfProb] =
    //     defaultActionService.getPresClaimWithFascProbs(game);
    //   expect(fascFascConfProb).toEqual(0.9);
    // });

    // it('.9 fasc fasc conf if RRB and underclaim >= 2', () => {
    //   underclaimTotal = 2;
    //   presCards = PRES3.RRB;
    //   let [fascFascConfProb] =
    //     defaultActionService.getPresClaimWithFascProbs(game);
    //   expect(fascFascConfProb).toEqual(0.9);
    // });

    // it('does not fasc fasc conf in anti DD', () => {
    //   defaultActionService.isAntiDD = () => true;
    //   let [fascFascConfProb] =
    //     defaultActionService.getPresClaimWithFascProbs(game);
    //   expect(fascFascConfProb).toEqual(0);
    // });

    // it('confs .9 in cucu if chan is not hitler if underclaim is low enough', () => {
    //   defaultActionService.isCucu = () => true;
    //   expect(logicService.getCurrentChan(game).role).not.toBe(Role.HITLER);
    //   underclaimTotal = 2;
    //   presCards = PRES3.RRR;
    //   let [fascFascConfProb] =
    //     defaultActionService.getPresClaimWithFascProbs(game);
    //   expect(fascFascConfProb).toEqual(0.9);
    //   underclaimTotal = 1;
    //   presCards = PRES3.RRB;
    //   [fascFascConfProb] = defaultActionService.getPresClaimWithFascProbs(game);
    //   expect(fascFascConfProb).toEqual(0.9);
    //   underclaimTotal = 0;
    //   presCards = PRES3.RBB;
    //   [fascFascConfProb] = defaultActionService.getPresClaimWithFascProbs(game);
    //   expect(fascFascConfProb).toEqual(0.9);
    // });

    // it('confs .4 in cucu if chan is not hitler if underclaim is 1', () => {
    //   defaultActionService.isCucu = () => true;
    //   expect(logicService.getCurrentChan(game).role).not.toBe(Role.HITLER);
    //   underclaimTotal = 1;
    //   presCards = PRES3.RRR;
    //   let [fascFascConfProb] =
    //     defaultActionService.getPresClaimWithFascProbs(game);
    //   expect(fascFascConfProb).toEqual(0.4);
    //   underclaimTotal = 0;
    //   presCards = PRES3.RRB;
    //   [fascFascConfProb] = defaultActionService.getPresClaimWithFascProbs(game);
    //   expect(fascFascConfProb).toEqual(0.4);
    //   underclaimTotal = -1;
    //   presCards = PRES3.RBB;
    //   [fascFascConfProb] = defaultActionService.getPresClaimWithFascProbs(game);
    //   expect(fascFascConfProb).toEqual(0.4);
    // });

    // it('does not conf hitler chan in cucu', () => {
    //   defaultActionService.isCucu = () => true;
    //   game.currentChan = 'player-3';
    //   expect(logicService.getCurrentChan(game).role).toBe(Role.HITLER);
    //   underclaimTotal = 2;
    //   presCards = PRES3.RRR;
    //   let [fascFascConfProb] =
    //     defaultActionService.getPresClaimWithFascProbs(game);
    //   expect(fascFascConfProb).toEqual(0);
    //   underclaimTotal = 1;
    //   presCards = PRES3.RRB;
    //   [fascFascConfProb] = defaultActionService.getPresClaimWithFascProbs(game);
    //   expect(fascFascConfProb).toEqual(0);
    //   underclaimTotal = 0;
    //   presCards = PRES3.RBB;
    //   [fascFascConfProb] = defaultActionService.getPresClaimWithFascProbs(game);
    //   expect(fascFascConfProb).toEqual(0);
    // });

    // it('does not conf on gun', () => {
    //   game.FascPoliciesEnacted = 4;
    //   let [fascFascConfProb] =
    //     defaultActionService.getPresClaimWithFascProbs(game);
    //   expect(fascFascConfProb).toEqual(0);
    //   underclaimTotal = 3;
    //   presCards = PRES3.RBB;
    //   [fascFascConfProb] = defaultActionService.getPresClaimWithFascProbs(game);
    //   expect(fascFascConfProb).toEqual(0);
    // });
  });

  describe('bothSidesOfAConflictShot', () => {
    beforeEach(() => {
      game.confs.push({
        confer: 'player-1',
        confee: 'player-2',
        type: Conf.INV,
      });
      game.confs.push({
        confer: 'player-2',
        confee: 'player-3',
        type: Conf.POLICY,
      });
    });

    it('returns true if both sides of a conf are shot', () => {
      player1.alive = false;
      player2.alive = false;
      expect(defaultActionService.bothSidesOfAConflictShot(game)).toBe(true);
    });

    it('returns false if both sides of a conf are not shot', () => {
      player1.alive = false;
      player2.alive = true;
      player3.alive = false;
      expect(defaultActionService.bothSidesOfAConflictShot(game)).toBe(false);
    });
  });

  describe('minimumNumberOfFascFromConfs', () => {
    beforeEach(() => {
      game.players = [];
      for (let i = 1; i < 10; i++) {
        game.players.push(
          new PlayerMockFactory().create({ name: `player-${i}` }),
        );
      }
      game.confs = [];
      game.invClaims = [];
      game.confs.push({
        confer: 'player-1',
        confee: 'player-2',
        type: Conf.INV,
      });
    });

    it('returns 2 in a 3 way conf', () => {
      game.confs.push({
        confer: 'player-2',
        confee: 'player-3',
        type: Conf.POLICY,
      });
      game.confs.push({
        confer: 'player-1',
        confee: 'player-3',
        type: Conf.POLICY,
      });
      expect(defaultActionService.minimumNumberOfFascFromConfs(game)).toEqual(
        2,
      );
    });

    it('returns correct for distinct pairs', () => {
      game.confs.push({
        confer: 'player-3',
        confee: 'player-4',
        type: Conf.POLICY,
      });
      game.confs.push({
        confer: 'player-5',
        confee: 'player-6',
        type: Conf.POLICY,
      });
      expect(defaultActionService.minimumNumberOfFascFromConfs(game)).toEqual(
        3,
      );
    });
    it('returns correct for nondistinct pairs', () => {
      game.confs.push({
        confer: 'player-2',
        confee: 'player-3',
        type: Conf.POLICY,
      });
      game.confs.push({
        confer: 'player-5',
        confee: 'player-6',
        type: Conf.POLICY,
      });

      expect(defaultActionService.minimumNumberOfFascFromConfs(game)).toEqual(
        2,
      );
    });

    //skipped
    it.skip('returns correct for a known fascist', () => {
      game.confs = [];
      game.confs.push({
        confer: 'player-5',
        confee: 'player-6',
        type: Conf.POLICY,
      });
      expect(
        defaultActionService.minimumNumberOfFascFromConfs(game, [
          logicService.findPlayerIngame(game, 'player-1'),
        ]),
      ).toEqual(2);
    });
  });

  describe('confirmedLib', () => {
    let player1: Player;
    let player2: Player;
    let player3: Player;

    beforeEach(() => {
      game.players = [];
      for (let i = 1; i <= 10; i++) {
        game.players.push(
          new PlayerMockFactory().create({ name: `player-${i}` }),
        );
      }
      player1 = game.players.find((player) => player.name === 'player-1');
      player2 = game.players.find((player) => player.name === 'player-2');
      player3 = game.players.find((player) => player.name === 'player-3');

      player1.team = Team.LIB;
      game.confs = [];
      game.invClaims = [];
    });

    it('it determines confirmed lib in 5-6 player game with 2 confs', () => {
      game.players = game.players.slice(0, 6);
      expect(game.players).toHaveLength(6);
      game.confs.push({
        confer: 'player-2',
        confee: 'player-3',
        type: Conf.POLICY,
      });
      game.confs.push({
        confer: 'player-4',
        confee: 'player-5',
        type: Conf.POLICY,
      });
      expect(defaultActionService.confirmedLib(game, player1)).toBe(true);
    });

    it('it determines confirmed lib in 5-6 player game with 1 conf and cnh', () => {
      game.players = game.players.slice(0, 6);
      expect(game.players).toHaveLength(6);
      player1.confirmedNotHitler = true;
      game.confs.push({
        confer: 'player-2',
        confee: 'player-3',
        type: Conf.POLICY,
      });
      player2.alive = false;
      player3.alive = false;
      expect(defaultActionService.confirmedLib(game, player1)).toBe(true);
    });

    it('it determines NOT confirmed lib in 5-6 player game if conditions aren not met', () => {
      game.players = game.players.slice(0, 6);

      game.confs.push({
        confer: 'player-2',
        confee: 'player-3',
        type: Conf.POLICY,
      });
      expect(defaultActionService.confirmedLib(game, player1)).toBe(false);
      game.confs.push({
        confer: 'player-1',
        confee: 'player-4',
        type: Conf.POLICY,
      });
      expect(defaultActionService.confirmedLib(game, player1)).toBe(false);

      game.confs = [];
      game.confs.push({
        confer: 'player-2',
        confee: 'player-3',
        type: Conf.POLICY,
      });
      player2.alive = false;
      player3.alive = false;
      player1.confirmedNotHitler = false;
      expect(defaultActionService.confirmedLib(game, player1)).toBe(false);
    });

    it('it determines NOT confirmed lib in 7 player game with confs and cnh', () => {
      game.players = game.players.slice(0, 7);
      player1.confirmedNotHitler = true;
      game.confs.push({
        confer: 'player-2',
        confee: 'player-3',
        type: Conf.POLICY,
      });
      player2.alive = false;
      player3.alive = false;
      expect(defaultActionService.confirmedLib(game, player1)).toBe(false);
    });

    it('it determines confirmed lib in 7-8 player game with 3 confs', () => {
      game.players = game.players.slice(0, 7);
      game.confs.push({
        confer: 'player-2',
        confee: 'player-3',
        type: Conf.POLICY,
      });
      game.confs.push({
        confer: 'player-4',
        confee: 'player-5',
        type: Conf.POLICY,
      });
      game.confs.push({
        confer: 'player-6',
        confee: 'player-7',
        type: Conf.POLICY,
      });
      expect(defaultActionService.confirmedLib(game, player1)).toBe(true);
    });
    it('it determines confirmed lib in 7-8 player game with 2 confs and inv lib', () => {
      game.players = game.players.slice(0, 8);
      game.confs.push({
        confer: 'player-2',
        confee: 'player-3',
        type: Conf.POLICY,
      });
      game.confs.push({
        confer: 'player-4',
        confee: 'player-5',
        type: Conf.POLICY,
      });
      game.invClaims.push({
        investigator: 'player-6',
        investigatee: 'player-1',
        claim: Team.LIB,
      });
      expect(defaultActionService.confirmedLib(game, player1)).toBe(true);
    });
    it('it determines NOT confirmed lib in 7-8 player game with 2 confs and inv lib from someone in conf', () => {
      game.players = game.players.slice(0, 8);
      game.confs.push({
        confer: 'player-2',
        confee: 'player-3',
        type: Conf.POLICY,
      });
      game.confs.push({
        confer: 'player-4',
        confee: 'player-5',
        type: Conf.POLICY,
      });
      game.invClaims.push({
        investigator: 'player-2',
        investigatee: 'player-1',
        claim: Team.LIB,
      });
      expect(defaultActionService.confirmedLib(game, player1)).toBe(false);
    });
    it('it determines confirmed lib in 9-10 player game with 4 confs', () => {
      game.confs.push({
        confer: 'player-2',
        confee: 'player-3',
        type: Conf.POLICY,
      });
      game.confs.push({
        confer: 'player-4',
        confee: 'player-5',
        type: Conf.POLICY,
      });
      game.confs.push({
        confer: 'player-6',
        confee: 'player-7',
        type: Conf.POLICY,
      });
      game.confs.push({
        confer: 'player-8',
        confee: 'player-9',
        type: Conf.POLICY,
      });

      expect(defaultActionService.confirmedLib(game, player1)).toBe(true);
    });
    it('it determines confirmed lib in 9-10 player game with 2 confs and lib chain of two', () => {
      game.confs.push({
        confer: 'player-2',
        confee: 'player-3',
        type: Conf.POLICY,
      });
      game.confs.push({
        confer: 'player-4',
        confee: 'player-5',
        type: Conf.POLICY,
      });
      game.invClaims.push({
        investigator: 'player-6',
        investigatee: 'player-1',
        claim: Team.LIB,
      });
      game.invClaims.push({
        investigator: 'player-7',
        investigatee: 'player-6',
        claim: Team.LIB,
      });

      expect(defaultActionService.confirmedLib(game, player1)).toBe(true);
    });
  });

  describe('presAgainWithoutTopDeck', () => {
    it('determines if you can get back to current pres in a small game without SE', () => {
      expect(game.players).toHaveLength(5);
      game.presIdx = 0;
      game.currentPres == 'player-1';
      player2.alive = false;
      player3.alive = false;
      //down to 3 players
      expect(defaultActionService.presAgainWithoutTopDeck(game)).toBe(true);
    });

    it('determines if you can get back to current pres from SE', () => {
      for (let i = 6; i < 8; i++) {
        game.players.push(
          new PlayerMockFactory().create({ name: `player-${i}` }),
        );
      }
      expect(game.players).toHaveLength(7);
      game.presIdx = 3;
      game.currentPres == 'player-1';
      player2.alive = true;
      player3.alive = true;
      game.players[6].alive = false;
      expect(defaultActionService.presAgainWithoutTopDeck(game)).toBe(true);
    });
  });

  describe('knownFascistToHitler', () => {
    beforeEach(() => {
      game.invClaims = [];
    });
    it('recognizing a fascist from hitler investigating', () => {
      expect(game.players).toHaveLength(5);
      game.invClaims.push({
        investigator: 'player-3',
        investigatee: 'player-2',
        claim: Team.FASC,
      });
      expect(logicService.getHitler(game).name).toBe('player-3');
      expect(defaultActionService.knownFascistToHitler(game, player2)).toBe(
        true,
      );
    });
    it('recognizing a fascist from fascist investigating hitler lib', () => {
      expect(game.players).toHaveLength(5);
      game.invClaims.push({
        investigator: 'player-2',
        investigatee: 'player-3',
        claim: Team.LIB,
      });
      expect(logicService.getHitler(game).name).toBe('player-3');
      expect(defaultActionService.knownFascistToHitler(game, player2)).toBe(
        true,
      );
    });
    it('does not recognize a fascist from fascist investigating hitler fasc', () => {
      expect(game.players).toHaveLength(5);
      game.invClaims.push({
        investigator: 'player-2',
        investigatee: 'player-3',
        claim: Team.FASC,
      });
      expect(logicService.getHitler(game).name).toBe('player-3');
      expect(defaultActionService.knownFascistToHitler(game, player2)).toBe(
        false,
      );
    });
    it('recognizes a fascist from fascist chan changing the claim', () => {
      expect(game.players).toHaveLength(5);
      game.govs = [
        new GovMockFactory().create({
          pres: 'player-3',
          chan: 'player-2',
          chanCards: [B, B],
          chanClaim: CHAN2.RB,
        }),
      ];
      expect(logicService.getHitler(game).name).toBe('player-3');
      expect(defaultActionService.knownFascistToHitler(game, player2)).toBe(
        true,
      );
      game.govs = [
        new GovMockFactory().create({
          pres: 'player-3',
          chan: 'player-2',
          chanCards: [R, B],
          chanClaim: CHAN2.RR,
        }),
      ];
      expect(defaultActionService.knownFascistToHitler(game, player2)).toBe(
        true,
      );
    });

    it('does not recognize a fascist from fascist chan not changing the claim', () => {
      game.govs = [
        new GovMockFactory().create({
          pres: 'player-3',
          chan: 'player-2',
          chanCards: [B, B],
          chanClaim: CHAN2.BB,
        }),
      ];
      expect(defaultActionService.knownFascistToHitler(game, player2)).toBe(
        false,
      );
    });

    it('does not recognize a fascist from different player changing claim', () => {
      game.govs = [
        new GovMockFactory().create({
          pres: 'player-3',
          chan: 'player-2',
          chanCards: [B, B],
          chanClaim: CHAN2.RB,
        }),
      ];
      game.govs = [
        new GovMockFactory().create({
          pres: 'player-2',
          chan: 'player-1',
          chanCards: [B, B],
          chanClaim: CHAN2.RB,
        }),
      ];
      expect(defaultActionService.knownFascistToHitler(game, player1)).toBe(
        false,
      );
    });

    describe('knownLibToHitler', () => {
      beforeEach(() => {
        game.players = [];
        for (let i = 1; i <= 7; i++) {
          game.players.push(
            new PlayerMockFactory().create({
              name: `player-${i}`,
              team: i <= 3 ? Team.FASC : Team.LIB,
              role: i === 1 ? Role.HITLER : i <= 3 ? Role.FASC : Role.LIB,
            }),
          );
        }
      });

      it('determines known lib to hitler', () => {
        game.confs.push({
          confer: 'player-2',
          confee: 'player-5',
          type: Conf.POLICY,
        });
        game.confs.push({
          confer: 'player-3',
          confee: 'player-6',
          type: Conf.INV,
        });
        expect(
          defaultActionService.knownLibToHitler(game, game.players[3]),
        ).toBe(true);
        expect(
          defaultActionService.knownLibToHitler(game, game.players[6]),
        ).toBe(true);
      });

      it('does not determines known lib to hitler if not enough confs or player already in a conf', () => {
        game.confs.push({
          confer: 'player-2',
          confee: 'player-5',
          type: Conf.POLICY,
        });
        expect(
          defaultActionService.knownLibToHitler(game, game.players[3]),
        ).toBe(false);
        game.confs.push({
          confer: 'player-3',
          confee: 'player-6',
          type: Conf.INV,
        });
        expect(
          defaultActionService.knownLibToHitler(game, game.players[5]),
        ).toBe(false);
      });

      it('does not determine confirmed lib if hitler in conf', () => {
        game.confs.push({
          confer: 'player-1',
          confee: 'player-4',
          type: Conf.POLICY,
        });
        game.confs.push({
          confer: 'player-2',
          confee: 'player-5',
          type: Conf.INV,
        });
        expect(
          defaultActionService.knownLibToHitler(game, game.players[6]),
        ).toBe(false);
      });
    });
  });
});

/**

   */
