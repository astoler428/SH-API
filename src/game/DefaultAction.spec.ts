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
  draws2,
  draws3,
  gameRoles,
  gameTeams,
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

  let players2: Player[];
  let game2: Game;
  let hitler: Player, fasc1: Player, fasc2: Player, fasc3: Player;
  let lib1: Player,
    lib2: Player,
    lib3: Player,
    lib4: Player,
    lib5: Player,
    lib6: Player;

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

    hitler = new PlayerMockFactory().create({
      name: 'hitler',
      team: Team.FASC,
      role: Role.HITLER,
    });
    fasc1 = new PlayerMockFactory().create({
      name: 'fasc1',
      team: Team.FASC,
      role: Role.FASC,
    });
    fasc2 = new PlayerMockFactory().create({
      name: 'fasc2',
      team: Team.FASC,
      role: Role.FASC,
    });
    fasc3 = new PlayerMockFactory().create({
      name: 'fasc3',
      team: Team.FASC,
      role: Role.FASC,
    });
    lib1 = new PlayerMockFactory().create({
      name: 'lib1',
      team: Team.LIB,
      role: Role.LIB,
    });
    lib2 = new PlayerMockFactory().create({
      name: 'lib2',
      team: Team.LIB,
      role: Role.LIB,
    });
    lib3 = new PlayerMockFactory().create({
      name: 'lib3',
      team: Team.LIB,
      role: Role.LIB,
    });
    lib4 = new PlayerMockFactory().create({
      name: 'lib4',
      team: Team.LIB,
      role: Role.LIB,
    });
    lib5 = new PlayerMockFactory().create({
      name: 'lib5',
      team: Team.LIB,
      role: Role.LIB,
    });
    lib6 = new PlayerMockFactory().create({
      name: 'lib6',
      team: Team.LIB,
      role: Role.LIB,
    });
    players2 = [
      hitler,
      fasc1,
      lib1,
      lib2,
      lib3,
      lib4,
      fasc2,
      lib5,
      fasc3,
      lib6,
    ];
    game2 = new GameMockFactory().create({ players: players2 });
    game2.currentPres = lib1.name;
    game2.currentChan = fasc1.name;
  });

  describe('determinePresCards', () => {
    it('correctly determines', () => {
      const presCards = [
        [R, R, R],
        [R, R, B],
        [R, B, B],
        [B, B, B],
      ];
      for (let i = 0; i < 4; i++) {
        expect(defaultActionService.determine3Cards(presCards[i])).toBe(
          draws3[i],
        );
      }
    });
  });

  describe('determineChanCards', () => {
    it('correctly determines', () => {
      const chanCards = [
        [R, R],
        [R, B],
        [B, B],
      ];
      for (let i = 0; i < 3; i++) {
        expect(defaultActionService.determine2Cards(chanCards[i])).toBe(
          draws2[i],
        );
      }
    });
  });

  describe('lib3RedOnThisDeck', () => {
    it('properly determines that a lib pres drew 3 red on this deck', () => {
      game2.govs.push(
        new GovMockFactory().create({ pres: lib1.name, presClaim: PRES3.RRR }),
      );
      expect(defaultActionService.lib3RedOnThisDeck(game2)).toBe(true);
    });

    it('properly determines that a lib pres drew 3 red on a different deck', () => {
      game2.govs.push(
        new GovMockFactory().create({ pres: lib1.name, presClaim: PRES3.RRR }),
      );
      game2.deck.deckNum = 2;
      expect(defaultActionService.lib3RedOnThisDeck(game2)).toBe(false);
    });

    it('returns false if a fasc pres draws RRR', () => {
      game2.govs.push(
        new GovMockFactory().create({ pres: fasc1.name, presClaim: PRES3.RRR }),
      );
      expect(defaultActionService.lib3RedOnThisDeck(game2)).toBe(false);
    });
  });

  // describe('fasc3RedOnThisDeck', () => {
  //   it('properly determines that a fasc pres drew 3 red on this deck', () => {
  //     player1.team = Team.FASC;
  //     game.govs.push(new GovMockFactory().create());
  //     expect(defaultActionService.fasc3RedOnThisDeck(game)).toBe(true);
  //   });

  //   it('properly determines that a fasc pres drew 3 red on a different deck', () => {
  //     player1.team = Team.FASC;
  //     game.govs.push(new GovMockFactory().create());
  //     game.deck.deckNum = 2;
  //     expect(defaultActionService.fasc3RedOnThisDeck(game)).toBe(false);
  //   });

  //   it('returns false if a lib pres draws RRR', () => {
  //     player1.team = Team.LIB;
  //     game.govs.push(new GovMockFactory().create());
  //     expect(defaultActionService.fasc3RedOnThisDeck(game)).toBe(false);
  //   });
  // });

  // describe('is3Red', () => {
  //   it('properly determines that the player claimed 3 red regardless of the cards', () => {
  //     player1.team = Team.FASC;
  //     game.govs.push(new GovMockFactory().create({ presCards: [R, B, B] }));
  //     expect(defaultActionService.is3Red(game, 'player-1')).toBe(true);
  //   });

  //   it('properly determines not 3 red if overclaim', () => {
  //     player1.team = Team.FASC;
  //     game.govs.push(new GovMockFactory().create({ presClaim: PRES3.RRB }));
  //     expect(defaultActionService.is3Red(game, 'player-1')).toBe(false);
  //   });
  // });

  describe('numberOf3RedLibsOnThisDeck', () => {
    it('determines the number of 3 red libs', () => {
      game2.deck.deckNum = 1;
      game2.govs.push(
        new GovMockFactory().create({
          pres: lib1.name,
          presClaim: PRES3.RRR,
          deckNum: 1,
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          pres: hitler.name,
          presClaim: PRES3.RRR,
          deckNum: 1,
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          pres: lib2.name,
          presClaim: PRES3.RRR,
          deckNum: 1,
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          pres: lib3.name,
          presClaim: PRES3.RRB,
          deckNum: 1,
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          pres: lib4.name,
          presClaim: PRES3.RRR,
          deckNum: 2,
        }),
      );
      expect(defaultActionService.numberOf3RedLibsOnThisDeck(game2)).toEqual(2);
    });
  });

  describe('numberOf3RedFascsOnThisDeck', () => {
    it('determines the number of 3 red fasc', () => {
      game2.deck.deckNum = 2;
      game2.govs.push(
        new GovMockFactory().create({
          pres: fasc1.name,
          presClaim: PRES3.RRR,
          deckNum: 1,
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          pres: hitler.name,
          presClaim: PRES3.RRR,
          deckNum: 2,
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          pres: lib2.name,
          presClaim: PRES3.RRR,
          deckNum: 2,
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          pres: fasc2.name,
          presClaim: PRES3.RRB,
          deckNum: 2,
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          pres: fasc3.name,
          presClaim: PRES3.RRR,
          deckNum: 2,
        }),
      );
      expect(defaultActionService.numberOf3RedFascsOnThisDeck(game2)).toEqual(
        2,
      );
    });
  });

  describe('isAntiDD', () => {
    it('properly determines that the gov is an antiDD', () => {
      game2.confs.push(
        {
          confer: fasc1.name,
          confee: lib1.name,
          type: Conf.INV,
        },
        {
          confer: fasc1.name,
          confee: lib2.name,
          type: Conf.POLICY,
        },
      );
      game2.currentChan = lib1.name;
      game2.currentPres = lib2.name;
      expect(defaultActionService.isAntiDD(game2)).toBe(true);
      game2.currentChan = lib2.name;
      game2.currentPres = fasc1.name;
      expect(defaultActionService.isAntiDD(game2)).toBe(false);
    });
  });

  describe('underClaimTotal', () => {
    it('properly counts the total underclaims', () => {
      game2.govs.push(new GovMockFactory().create({ underclaim: 2 }));
      game2.govs.push(new GovMockFactory().create({ underclaim: 3 }));
      game2.govs.push(
        new GovMockFactory().create({ deckNum: 2, underclaim: 3 }),
      );
      game2.govs.push(
        new GovMockFactory().create({ deckNum: 2, underclaim: -4 }),
      );
      expect(defaultActionService.underclaimTotal(game2)).toEqual(5);
      game2.deck.deckNum = 2;
      expect(defaultActionService.underclaimTotal(game2)).toEqual(-1);
    });
  });

  describe('deckNBlueCount and related', () => {
    it('properly counts the blue count', () => {
      game2.govs.push(new GovMockFactory().create({ presClaim: PRES3.RRB }));
      game2.govs.push(new GovMockFactory().create({ presClaim: PRES3.RBB }));
      game2.govs.push(new GovMockFactory().create({ presClaim: PRES3.RRR }));
      game2.govs.push(new GovMockFactory().create({ presClaim: PRES3.RRR }));
      game2.govs.push(
        new GovMockFactory().create({ deckNum: 2, presClaim: PRES3.RBB }),
      );
      game2.govs.push(
        new GovMockFactory().create({ deckNum: 2, presClaim: PRES3.RBB }),
      );
      game2.govs.push(
        new GovMockFactory().create({ deckNum: 2, presClaim: PRES3.BBB }),
      );
      expect(defaultActionService.deckNBlueCount(game2, 1)).toEqual(3);
      expect(defaultActionService.deck1BlueCount(game2)).toEqual(3);
      expect(defaultActionService.deckNBlueCount(game2, 2)).toEqual(7);
      game2.deck.deckNum = 1;
      expect(defaultActionService.blueCountOnThisDeck(game2)).toEqual(3);
      game2.deck.deckNum = 2;
      expect(defaultActionService.blueCountOnThisDeck(game2)).toEqual(7);
    });
  });

  describe('isCucu', () => {
    it('properly determines Cucu', () => {
      game2.invClaims.push({
        investigator: lib1.name,
        investigatee: lib2.name,
        claim: Team.LIB,
      });
      game2.invClaims.push({
        investigator: lib1.name,
        investigatee: lib3.name,
        claim: Team.FASC,
      });
      game2.currentPres = lib2.name;
      game2.currentChan = lib1.name;
      expect(defaultActionService.isCucu(game2)).toBe(true);

      game2.currentPres = lib1.name;
      game2.currentChan = lib2.name;
      expect(defaultActionService.isCucu(game2)).toBe(false);

      game2.currentPres = lib3.name;
      game2.currentChan = lib1.name;
      expect(defaultActionService.isCucu(game2)).toBe(false);

      game2.currentPres = lib3.name;
      game2.currentChan = lib4.name;
      expect(defaultActionService.isCucu(game2)).toBe(false);
    });
  });

  describe('bluesEnactedInDeck', () => {
    it('properly counts the blues', () => {
      game2.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createFasc(),
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createLib(),
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createLib(),
          deckNum: 2,
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createFasc(),
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createFasc(),
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createLib(),
        }),
      );
      expect(defaultActionService.bluesEnactedInDeck(game2, 1)).toEqual(2);
    });
  });

  describe('bluesToBeginTheDeck', () => {
    it('properly counts the blues', () => {
      game2.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createFasc(),
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createLib(),
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createLib(),
          deckNum: 2,
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createFasc(),
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createFasc(),
        }),
      );
      game2.govs.push(
        new GovMockFactory().create({
          policyPlayed: new CardMockFactory().createLib(),
          deckNum: 2,
        }),
      );
      expect(defaultActionService.bluesToBeginTheDeck(game2, 1)).toEqual(6);
      expect(defaultActionService.bluesToBeginTheDeck(game2, 2)).toEqual(5);
      expect(defaultActionService.bluesToBeginTheDeck(game2, 3)).toEqual(3);
    });
  });

  describe('isAntiDD', () => {
    it('properly determines antiDD', () => {
      game2.confs.push({
        confer: lib1.name,
        confee: fasc2.name,
        type: Conf.POLICY,
      });
      game2.confs.push({
        confer: lib1.name,
        confee: fasc3.name,
        type: Conf.INV,
      });
      game2.confs.push({
        confer: lib2.name,
        confee: hitler.name,
        type: Conf.INV,
      });
      game2.currentPres = fasc2.name;
      game2.currentChan = fasc3.name;
      expect(defaultActionService.isAntiDD(game2)).toBe(true);
      game2.currentPres = fasc3.name;
      game2.currentChan = fasc2.name;
      expect(defaultActionService.isAntiDD(game2)).toBe(true);
      game2.currentPres = hitler.name;
      game2.currentChan = fasc3.name;
      expect(defaultActionService.isAntiDD(game2)).toBe(false);
    });
  });

  describe('isPower', () => {
    it('properly determines if there is a power in 5-6 player games', () => {
      game2.players = players2.slice(0, 5);
      game2.FascPoliciesEnacted = 0;
      expect(defaultActionService.isPower(game2)).toBe(false);
      game2.FascPoliciesEnacted = 1;
      game2.players = players2.slice(0, 6);
      expect(defaultActionService.isPower(game2)).toBe(false);
      game2.FascPoliciesEnacted = 2;
      expect(defaultActionService.isPower(game2)).toBe(true);
      game2.FascPoliciesEnacted = 4;
      expect(defaultActionService.isPower(game2)).toBe(true);
    });

    it('properly determines if there is a power in 7-8 player games', () => {
      game2.players = players2.slice(0, 7);
      game2.FascPoliciesEnacted = 0;
      expect(defaultActionService.isPower(game2)).toBe(false);
      game2.FascPoliciesEnacted = 1;
      expect(defaultActionService.isPower(game2)).toBe(true);
      game2.players = players2.slice(0, 8);
      game2.FascPoliciesEnacted = 0;
      expect(defaultActionService.isPower(game2)).toBe(false);
      game2.FascPoliciesEnacted = 4;
      expect(defaultActionService.isPower(game2)).toBe(true);
    });

    it('properly determines if there is a power in 9-10 player games', () => {
      game2.players = players2.slice(0, 9);
      game2.FascPoliciesEnacted = 0;
      expect(defaultActionService.isPower(game2)).toBe(true);
      game2.FascPoliciesEnacted = 1;
      expect(defaultActionService.isPower(game2)).toBe(true);
      game2.players = players2;
      game2.FascPoliciesEnacted = 0;
      expect(defaultActionService.isPower(game2)).toBe(true);
      game2.FascPoliciesEnacted = 4;
      expect(defaultActionService.isPower(game2)).toBe(true);
    });
  });

  describe('invPower', () => {
    it('properly determines if there is a invpower in 5-6 player games', () => {
      game2.players = players2.slice(0, 5);
      game2.FascPoliciesEnacted = 0;
      expect(defaultActionService.invPower(game2, true)).toBe(false);
      game2.FascPoliciesEnacted = 1;
      expect(defaultActionService.invPower(game2, true)).toBe(false);
      game2.FascPoliciesEnacted = 2;
      expect(defaultActionService.invPower(game2, true)).toBe(false);
      game2.FascPoliciesEnacted = 3;
      expect(defaultActionService.invPower(game2, true)).toBe(false);
    });

    it('properly determines if there is a power in 7-8 player games', () => {
      game2.players = players2.slice(0, 8);
      game2.FascPoliciesEnacted = 0;
      expect(defaultActionService.invPower(game2, true)).toBe(false);
      game2.FascPoliciesEnacted = 1;
      expect(defaultActionService.invPower(game2, true)).toBe(true);
      game2.FascPoliciesEnacted = 2;
      expect(defaultActionService.invPower(game2, true)).toBe(false);
      game2.FascPoliciesEnacted = 3;
      expect(defaultActionService.invPower(game2, true)).toBe(false);

      //after enactment
      game2.FascPoliciesEnacted = 0;
      expect(defaultActionService.invPower(game2, false)).toBe(false);
      game2.FascPoliciesEnacted = 1;
      expect(defaultActionService.invPower(game2, false)).toBe(false);
      game2.FascPoliciesEnacted = 2;
      expect(defaultActionService.invPower(game2, false)).toBe(true);
      game2.FascPoliciesEnacted = 3;
      expect(defaultActionService.invPower(game2, false)).toBe(false);
    });

    it('properly determines if there is a power in 9-10 player games', () => {
      game2.FascPoliciesEnacted = 0;
      expect(defaultActionService.invPower(game2, true)).toBe(true);
      game2.FascPoliciesEnacted = 1;
      expect(defaultActionService.invPower(game2, true)).toBe(true);
      game2.FascPoliciesEnacted = 2;
      expect(defaultActionService.invPower(game2, true)).toBe(false);
      game2.FascPoliciesEnacted = 3;
      expect(defaultActionService.invPower(game2, true)).toBe(false);

      //after enactment
      game2.FascPoliciesEnacted = 0;
      expect(defaultActionService.invPower(game2, false)).toBe(false);
      game2.FascPoliciesEnacted = 1;
      expect(defaultActionService.invPower(game2, false)).toBe(true);
      game2.FascPoliciesEnacted = 2;
      expect(defaultActionService.invPower(game2, false)).toBe(true);
      game2.FascPoliciesEnacted = 3;
      expect(defaultActionService.invPower(game2, false)).toBe(false);
    });
  });

  describe('gunPower', () => {
    it('properly determines if there is a gunPower', () => {
      game2.players = players2.slice(0, 6);
      game2.FascPoliciesEnacted = 0;
      expect(defaultActionService.gunPower(game2)).toBe(false);
      game2.FascPoliciesEnacted = 1;
      expect(defaultActionService.gunPower(game2)).toBe(false);
      game2.FascPoliciesEnacted = 2;
      expect(defaultActionService.gunPower(game2)).toBe(false);
      game2.FascPoliciesEnacted = 3;
      expect(defaultActionService.gunPower(game2)).toBe(true);
      game2.FascPoliciesEnacted = 4;
      expect(defaultActionService.gunPower(game2)).toBe(true);
      game2.FascPoliciesEnacted = 5;
      expect(defaultActionService.gunPower(game2)).toBe(false);
    });
  });

  describe('doubleDipping', () => {
    it('properly determines if the pres is doubledipping', () => {
      game2.confs.push({
        confer: fasc1.name,
        confee: lib1.name,
        type: Conf.POLICY,
      });
      game2.currentPres = fasc1.name;
      game2.currentChan = lib1.name;
      expect(defaultActionService.doubleDipping(game2)).toBe(true);
    });

    it('properly determines if the pres is not doubledipping', () => {
      game2.confs.push({
        confer: fasc1.name,
        confee: lib1.name,
        type: Conf.INV,
      });
      game2.currentPres = fasc1.name;
      game2.currentChan = lib1.name;
      expect(defaultActionService.doubleDipping(game2)).toBe(false);
      game2.confs.push({
        confer: fasc2.name,
        confee: lib1.name,
        type: Conf.POLICY,
      });
      game2.currentPres = lib1.name;
      game2.currentChan = fasc2.name;
      expect(defaultActionService.doubleDipping(game2)).toBe(false);
    });
  });

  describe('inConflict', () => {
    it('properly determines if two players are on conflict', () => {
      game2.confs.push({
        confer: fasc1.name,
        confee: hitler.name,
        type: Conf.POLICY,
      });
      expect(defaultActionService.inConflict(game2, fasc1, hitler)).toBe(true);
      expect(defaultActionService.inConflict(game2, fasc1, fasc2)).toBe(false);
    });
  });

  describe('inAnyConflict', () => {
    it('properly determines if a player is in any conflict', () => {
      game2.confs.push({
        confer: fasc1.name,
        confee: lib1.name,
        type: Conf.POLICY,
      });
      expect(defaultActionService.inAnyConflict(game2, fasc1)).toBe(true);
      expect(defaultActionService.inAnyConflict(game2, lib1)).toBe(true);
      expect(defaultActionService.inAnyConflict(game2, lib2)).toBe(false);
    });
  });

  describe('inFascFascConflict', () => {
    it('properly determines if a player is in any fasc fasc conflict', () => {
      game2.confs.push({
        confer: fasc1.name,
        confee: hitler.name,
        type: Conf.POLICY,
      });
      game2.confs.push({
        confer: fasc2.name,
        confee: lib1.name,
        type: Conf.POLICY,
      });

      expect(defaultActionService.inFascFascConflict(game2, fasc1)).toBe(true);
      expect(defaultActionService.inFascFascConflict(game2, hitler)).toBe(true);
      expect(defaultActionService.inFascFascConflict(game2, fasc2)).toBe(false);
    });
  });

  describe('numAliveOnTeam', () => {
    it('properly determines number of alive fascists', () => {
      expect(defaultActionService.numAliveOnTeam(game2, Team.LIB)).toEqual(6);
      expect(defaultActionService.numAliveOnTeam(game2, Team.FASC)).toEqual(4);
      fasc1.alive = false;
      lib1.alive = false;
      fasc2.alive = false;
      lib5.alive = false;
      lib6.alive = false;

      expect(defaultActionService.numAliveOnTeam(game2, Team.LIB)).toEqual(3);
      expect(defaultActionService.numAliveOnTeam(game2, Team.FASC)).toEqual(2);
    });
  });

  describe('testProb', () => {
    it('returns true when value is less', () => {
      Math.random = () => 0.7;
      expect(
        defaultActionService.testProb(
          0.71,
          game2,
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
          game2,
          'testName',
          DefaultAction.CHAN_CLAIM,
          'test',
        ),
      ).toBe(false);
    });
  });

  //still to test

  describe('bothSidesOfAConflictShot', () => {
    beforeEach(() => {
      game2.confs.push({
        confer: fasc1.name,
        confee: lib1.name,
        type: Conf.INV,
      });
      game2.confs.push({
        confer: lib1.name,
        confee: fasc2.name,
        type: Conf.POLICY,
      });
    });

    it('returns true if both sides of a conf are shot', () => {
      fasc1.alive = false;
      lib1.alive = false;
      expect(defaultActionService.bothSidesOfAConflictShot(game2)).toBe(true);
    });

    it('returns false if both sides of a conf are not shot', () => {
      fasc1.alive = false;
      lib1.alive = true;
      fasc2.alive = false;
      expect(defaultActionService.bothSidesOfAConflictShot(game2)).toBe(false);
    });
  });

  describe('confirmedLib', () => {
    it('it determines confirmed lib in 5-6 player game with 2 confs', () => {
      game2.players = players2.slice(0, 5);
      expect(game2.players).toHaveLength(5);
      game2.confs.push({
        confer: fasc1.name,
        confee: lib1.name,
        type: Conf.POLICY,
      });
      game2.confs.push({
        confer: hitler.name,
        confee: lib2.name,
        type: Conf.POLICY,
      });
      expect(defaultActionService.confirmedLib(game2, lib3)).toBe(true);
      game2.players = players2.slice(0, 6);
      expect(game2.players).toHaveLength(6);
      expect(defaultActionService.confirmedLib(game2, lib3)).toBe(true);
    });

    it('it determines confirmed lib in 5-6 player game with 1 conf and cnh', () => {
      game2.players = players2.slice(0, 5);
      expect(game2.players).toHaveLength(5);
      lib2.confirmedNotHitler = true;
      game2.confs.push({
        confer: fasc1.name,
        confee: lib1.name,
        type: Conf.POLICY,
      });
      fasc1.alive = false;
      lib1.alive = false;
      expect(defaultActionService.confirmedLib(game2, lib2)).toBe(true);
      game2.players = players2.slice(0, 6);
      expect(game2.players).toHaveLength(6);
      expect(defaultActionService.confirmedLib(game2, lib2)).toBe(true);
    });

    it('it determines NOT confirmed lib in 5-6 player game if conditions aren not met', () => {
      game2.players = players2.slice(0, 5);

      game2.confs.push({
        confer: fasc1.name,
        confee: lib1.name,
        type: Conf.POLICY,
      });
      expect(defaultActionService.confirmedLib(game2, lib2)).toBe(false);
      game2.confs.push({
        confer: hitler.name,
        confee: lib2.name,
        type: Conf.POLICY,
      });
      expect(defaultActionService.confirmedLib(game2, lib2)).toBe(false);

      game2.confs = [];
      game2.confs.push({
        confer: fasc1.name,
        confee: lib1.name,
        type: Conf.POLICY,
      });
      fasc1.alive = false;
      lib1.alive = false;
      lib2.confirmedNotHitler = false;
      expect(defaultActionService.confirmedLib(game2, lib2)).toBe(false);
    });

    it('it determines NOT confirmed lib in 7 player game with confs and cnh', () => {
      game2.players = players2.slice(0, 7);
      lib2.confirmedNotHitler = true;
      game2.confs.push({
        confer: fasc1.name,
        confee: lib1.name,
        type: Conf.POLICY,
      });
      fasc1.alive = false;
      lib1.alive = false;
      expect(defaultActionService.confirmedLib(game2, lib2)).toBe(false);
    });

    it('it determines confirmed lib in 7-8 player game with 3 confs', () => {
      game2.players = players2.slice(0, 7);
      game2.confs.push({
        confer: lib1.name,
        confee: fasc1.name,
        type: Conf.POLICY,
      });
      game2.confs.push({
        confer: lib2.name,
        confee: fasc2.name,
        type: Conf.POLICY,
      });
      game2.confs.push({
        confer: hitler.name,
        confee: lib3.name,
        type: Conf.POLICY,
      });
      expect(defaultActionService.confirmedLib(game2, lib4)).toBe(true);
      game2.players = players2.slice(0, 8);
      expect(defaultActionService.confirmedLib(game2, lib5)).toBe(true);
    });
    it('it determines confirmed lib in 7-8 player game with 2 confs and inv lib', () => {
      game2.players = players2.slice(0, 8);
      game2.confs.push({
        confer: lib1.name,
        confee: fasc1.name,
        type: Conf.POLICY,
      });
      game2.confs.push({
        confer: lib2.name,
        confee: fasc2.name,
        type: Conf.POLICY,
      });
      game2.invClaims.push({
        investigator: hitler.name,
        investigatee: lib3.name,
        claim: Team.LIB,
      });
      expect(defaultActionService.confirmedLib(game2, lib3)).toBe(true);
    });
    it('it determines NOT confirmed lib in 7-8 player game with 2 confs and inv lib from someone in conf', () => {
      game2.players = players2.slice(0, 8);
      game2.confs.push({
        confer: lib1.name,
        confee: fasc1.name,
        type: Conf.POLICY,
      });
      game2.confs.push({
        confer: lib2.name,
        confee: fasc2.name,
        type: Conf.POLICY,
      });
      game2.invClaims.push({
        investigator: lib1.name,
        investigatee: lib3.name,
        claim: Team.LIB,
      });
      expect(defaultActionService.confirmedLib(game2, lib3)).toBe(false);
    });
    it('it determines confirmed lib in 9-10 player game with 4 confs', () => {
      game2.confs.push({
        confer: lib1.name,
        confee: fasc1.name,
        type: Conf.POLICY,
      });
      game2.confs.push({
        confer: lib2.name,
        confee: fasc2.name,
        type: Conf.POLICY,
      });
      game2.confs.push({
        confer: lib3.name,
        confee: lib3.name,
        type: Conf.POLICY,
      });
      game2.confs.push({
        confer: hitler.name,
        confee: lib4.name,
        type: Conf.POLICY,
      });

      expect(defaultActionService.confirmedLib(game2, lib5)).toBe(true);
    });
    it('it determines confirmed lib in 9-10 player game with 2 confs and lib chain of two', () => {
      game2.confs.push({
        confer: lib1.name,
        confee: fasc1.name,
        type: Conf.POLICY,
      });
      game2.confs.push({
        confer: lib2.name,
        confee: fasc2.name,
        type: Conf.POLICY,
      });
      game2.invClaims.push({
        investigator: hitler.name,
        investigatee: lib3.name,
        claim: Team.LIB,
      });
      game2.invClaims.push({
        investigator: lib3.name,
        investigatee: lib4.name,
        claim: Team.LIB,
      });

      expect(defaultActionService.confirmedLib(game2, lib4)).toBe(true);
    });

    it('it determines confirmed lib FROM HITLER POV in 9-10 player game with 3 confs', () => {
      game2.confs.push({
        confer: lib1.name,
        confee: fasc1.name,
        type: Conf.POLICY,
      });
      game2.confs.push({
        confer: lib2.name,
        confee: fasc2.name,
        type: Conf.POLICY,
      });
      game2.confs.push({
        confer: lib3.name,
        confee: lib3.name,
        type: Conf.POLICY,
      });

      expect(defaultActionService.confirmedLib(game2, lib4, true)).toBe(true);
    });
    it('it determines confirmed lib FROM HITLER POV in 9-10 player game with 2 confs and hitler inv lib', () => {
      game2.confs.push({
        confer: lib1.name,
        confee: fasc1.name,
        type: Conf.POLICY,
      });
      game2.confs.push({
        confer: lib2.name,
        confee: fasc2.name,
        type: Conf.POLICY,
      });
      game2.invClaims.push({
        investigator: fasc3.name,
        investigatee: hitler.name,
        claim: Team.LIB,
      });

      expect(defaultActionService.confirmedLib(game2, lib3, true)).toBe(true);
      expect(defaultActionService.confirmedLib(game2, lib4, true)).toBe(true);
      expect(defaultActionService.confirmedLib(game2, lib5, true)).toBe(true);
      expect(defaultActionService.confirmedLib(game2, lib6, true)).toBe(true);
    });
  });

  describe('presAgainWithoutTopDeck', () => {
    it('determines if you can get back to current pres in a small game without SE', () => {
      game2.players = players2.slice(0, 5);
      expect(game2.players).toHaveLength(5);
      game2.presIdx = 0;
      game2.currentPres = game2.players[0].name;
      game2.players[1].alive = false;
      game2.players[2].alive = false;
      //down to 3 players
      expect(defaultActionService.presAgainWithoutTopDeck(game2)).toBe(true);
      game2.players[2].alive = true;
      expect(defaultActionService.presAgainWithoutTopDeck(game2)).toBe(false);
    });

    it('determines if you can get back to current pres from SE', () => {
      game2.players = players2.slice(0, 7);
      expect(game2.players).toHaveLength(7);
      game2.presIdx = 3;
      game2.currentPres = game2.players[0].name;
      game2.players[1].alive = true;
      game2.players[2].alive = true;
      game2.players[6].alive = false;
      expect(defaultActionService.presAgainWithoutTopDeck(game2)).toBe(true);
      game2.players[6].alive = true;
      expect(defaultActionService.presAgainWithoutTopDeck(game2)).toBe(false);
    });
  });

  describe('knownFascistToHitler', () => {
    it('recognizing a fascist from hitler investigating', () => {
      game2.invClaims.push({
        investigator: hitler.name,
        investigatee: fasc1.name,
        claim: Team.FASC,
      });
      expect(logicService.getHitler(game2).name).toBe(hitler.name);
      expect(defaultActionService.knownFascistToHitler(game2, fasc1)).toBe(
        true,
      );
    });
    it('recognizes a fascist from fascist investigating hitler lib', () => {
      game2.invClaims.push({
        investigator: fasc1.name,
        investigatee: hitler.name,
        claim: Team.LIB,
      });
      expect(defaultActionService.knownFascistToHitler(game2, fasc1)).toBe(
        true,
      );
    });
    it('does not recognize a fascist from fascist investigating hitler fasc', () => {
      game2.invClaims.push({
        investigator: fasc1.name,
        investigatee: hitler.name,
        claim: Team.FASC,
      });
      expect(defaultActionService.knownFascistToHitler(game2, fasc1)).toBe(
        false,
      );
    });
    it('recognizes a fascist from fascist chan changing the claim', () => {
      game2.govs = [
        new GovMockFactory().create({
          pres: hitler.name,
          chan: fasc1.name,
          chanCards: [B, B],
          chanClaim: CHAN2.RB,
        }),
      ];
      expect(defaultActionService.knownFascistToHitler(game2, fasc1)).toBe(
        true,
      );
      game2.govs = [
        new GovMockFactory().create({
          pres: hitler.name,
          chan: fasc1.name,
          chanCards: [R, B],
          chanClaim: CHAN2.RR,
        }),
      ];
      expect(defaultActionService.knownFascistToHitler(game2, fasc1)).toBe(
        true,
      );
    });

    it('does not recognize a fascist from fascist chan not changing the claim', () => {
      game2.govs = [
        new GovMockFactory().create({
          pres: hitler.name,
          chan: fasc1.name,
          chanCards: [B, B],
          chanClaim: CHAN2.BB,
        }),
      ];
      expect(defaultActionService.knownFascistToHitler(game2, fasc1)).toBe(
        false,
      );
    });

    it('does not recognize a fascist from different player changing claim', () => {
      game2.govs = [
        new GovMockFactory().create({
          pres: hitler.name,
          chan: fasc1.name,
          chanCards: [B, B],
          chanClaim: CHAN2.RB,
        }),
      ];
      game2.govs = [
        new GovMockFactory().create({
          pres: fasc2.name,
          chan: fasc1.name,
          chanCards: [B, B],
          chanClaim: CHAN2.RB,
        }),
      ];
      expect(defaultActionService.knownFascistToHitler(game2, fasc2)).toBe(
        false,
      );
    });

    describe('knownLibToHitler', () => {
      it('determines known lib to hitler if two conflicts', () => {
        game2.players = players2.slice(0, 7);
        game2.confs.push({
          confer: lib1.name,
          confee: fasc1.name,
          type: Conf.POLICY,
        });
        game2.confs.push({
          confer: fasc2.name,
          confee: lib2.name,
          type: Conf.INV,
        });
        expect(defaultActionService.knownLibToHitler(game2, lib3)).toBe(true);
        expect(defaultActionService.knownLibToHitler(game2, lib4)).toBe(true);
      });

      it('does not determines known lib to hitler if not enough confs or player already in a conf', () => {
        game2.players = players2.slice(0, 7);

        game2.confs.push({
          confer: lib1.name,
          confee: fasc1.name,
          type: Conf.POLICY,
        });
        expect(defaultActionService.knownLibToHitler(game2, lib3)).toBe(false);
        game2.confs.push({
          confer: fasc1.name,
          confee: lib2.name,
          type: Conf.INV,
        });

        expect(defaultActionService.knownLibToHitler(game2, lib4)).toBe(false);
      });

      it('does not determine confirmed lib if hitler is the one in conf', () => {
        game2.players = players2.slice(0, 7);
        game2.confs.push({
          confer: lib1.name,
          confee: hitler.name,
          type: Conf.POLICY,
        });
        game2.confs.push({
          confer: fasc2.name,
          confee: lib2.name,
          type: Conf.INV,
        });
        expect(defaultActionService.knownLibToHitler(game2, lib3)).toBe(false);
      });
    });

    describe('nChooseR', () => {
      it('properlyCalculates n choose r', () => {
        expect(defaultActionService.nChooseR(5, 2)).toEqual(10);
        expect(defaultActionService.nChooseR(4, 1)).toEqual(4);
        expect(defaultActionService.nChooseR(12, 12)).toEqual(1);
      });
    });

    describe('probabilityOfDrawingBlues', () => {
      it('properlyCalculates each blue prob', () => {
        defaultActionService.bluesToBeginTheDeck = () => 3;
        game2.drawPileState = [B, B, B, R, R, R, R, R, R, R, R, R];
        let blueProbs = defaultActionService.probabilityofDrawingBlues(game2);
        expect(blueProbs[0]).toEqual(21 / 55);
        game2.drawPileState = [B, R, R, R];

        defaultActionService.bluesToBeginTheDeck = () => 1;
        blueProbs = defaultActionService.probabilityofDrawingBlues(game2);
        expect(blueProbs[0]).toEqual(0.25);
        expect(blueProbs[1]).toEqual(0.75);
        expect(blueProbs[2]).toEqual(0);
        expect(blueProbs[3]).toEqual(0);

        game2.drawPileState = [];
        let blues: number;
        game2.drawPileState = [];
        for (blues = 0; blues < 2; blues++) {
          game2.drawPileState.push(B);
        }
        for (let reds = 0; reds < 9; reds++) {
          game2.drawPileState.push(R);
        }

        defaultActionService.bluesToBeginTheDeck = () => blues;
        blueProbs = defaultActionService.probabilityofDrawingBlues(game2);
        const EV = defaultActionService.expectedValueOfBlues(game2);
      });
    });

    describe('expectedValueOfBlues', () => {
      it('properly calculates EV', () => {
        defaultActionService.bluesToBeginTheDeck = () => 3;
        game2.drawPileState = [B, B, B, R, R, R, R, R, R, R, R, R];
        let blueProbs = defaultActionService.probabilityofDrawingBlues(game2);
        let EV = defaultActionService.expectedValueOfBlues(game2);
        expect(EV).toEqual(blueProbs[1] + 2 * blueProbs[2] + 3 * blueProbs[3]);

        game2.drawPileState = [B, R, R, R];
        defaultActionService.bluesToBeginTheDeck = () => 1;
        EV = defaultActionService.expectedValueOfBlues(game2);
        expect(EV).toEqual(0.75);
      });
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
    });

    it('returns RBB if testProb is met for RRR as a fasc', () => {
      game2.currentPres = fasc1.name;
      cards3 = [R, R, R];
      let claim = defaultActionService.defaultInspect3Claim(game2);
      expect(claim).toBe(PRES3.RBB);
      cards3 = [R, R, B];
      claim = defaultActionService.defaultInspect3Claim(game2);
      expect(claim).toBe(PRES3.RRB);
    });

    it('returns RBB if testProb is met for BBB case as a fasc', () => {
      game2.currentPres = fasc1.name;
      cards3 = [B, B, B];
      let claim = defaultActionService.defaultInspect3Claim(game2);
      expect(claim).toBe(PRES3.RBB);
    });

    it('returns truth on RBB', () => {
      game2.currentPres = fasc1.name;
      cards3 = [R, B, B];
      let claim = defaultActionService.defaultInspect3Claim(game2);
      expect(claim).toBe(PRES3.RBB);
    });

    it('returns truth if lib', () => {
      game2.currentPres = lib1.name;
      cards3 = [R, R, R];
      let claim = defaultActionService.defaultInspect3Claim(game2);
      expect(claim).toBe(PRES3.RRR);
      cards3 = [R, R, B];
      claim = defaultActionService.defaultInspect3Claim(game2);
      expect(claim).toBe(PRES3.RRB);
      cards3 = [R, B, B];
      claim = defaultActionService.defaultInspect3Claim(game2);
      expect(claim).toBe(PRES3.RBB);
      cards3 = [B, B, B];
      claim = defaultActionService.defaultInspect3Claim(game2);
      expect(claim).toBe(PRES3.BBB);
    });
  });

  describe('getInspect3ClaimProbs', () => {
    let cards3: Card[];

    beforeEach(() => {
      jest.spyOn(logicService, 'inspect3').mockImplementation(() => cards3);
    });

    it('underclaims BBB with prob 1 for vanilla fasc and hitler', () => {
      cards3 = [B, B, B];
      game2.currentPres = fasc1.name;
      let [, underclaimBBBInspect3Prob] =
        defaultActionService.getInspect3ClaimProbs(game2);
      expect(underclaimBBBInspect3Prob).toEqual(1);
      game2.currentPres = hitler.name;
      [, underclaimBBBInspect3Prob] =
        defaultActionService.getInspect3ClaimProbs(game2);
      expect(underclaimBBBInspect3Prob).toEqual(1);
    });

    it('overclaims RRR prob .6 if pres if at least 2 blues in deck', () => {
      defaultActionService.probabilityofDrawingBlues = () => [
        0.25, 0.74, 0.01, 0,
      ];
      game2.currentPres = fasc1.name;
      let [overclaimToBBInspect3Prob] =
        defaultActionService.getInspect3ClaimProbs(game2);
      expect(overclaimToBBInspect3Prob).toEqual(0.6);
    });

    it('does not overclaim RRR if pres is hitler or not 2 blues in deck', () => {
      defaultActionService.probabilityofDrawingBlues = () => [0.25, 0.75, 0, 0];
      game2.currentPres = fasc1.name;
      let [overclaimToBBInspect3Prob] =
        defaultActionService.getInspect3ClaimProbs(game2);
      expect(overclaimToBBInspect3Prob).toEqual(0);
      game2.currentPres = hitler.name;
      defaultActionService.probabilityofDrawingBlues = () => [0.25, 0.75, 1, 0];
      [overclaimToBBInspect3Prob] =
        defaultActionService.getInspect3ClaimProbs(game2);
      expect(overclaimToBBInspect3Prob).toEqual(0);
    });
  });

  describe('defaultVetoReply', () => {
    it('accepts veto on RR as a lib', () => {
      game2.currentPres = lib1.name;
      game2.chanCards = [R, R];
      expect(defaultActionService.defaultVetoReply(game2)).toBe(true);
    });

    it('rejects veto on RB or BB as a lib', () => {
      game2.currentPres = lib1.name;
      game2.chanCards = [R, B];
      expect(defaultActionService.defaultVetoReply(game2)).toBe(false);
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultVetoReply(game2)).toBe(false);
    });

    it('rejects veto on RR and RB as a fasc', () => {
      game2.currentPres = fasc1.name;
      game2.chanCards = [R, R];
      expect(defaultActionService.defaultVetoReply(game2)).toBe(false);
      game2.chanCards = [R, B];
      expect(defaultActionService.defaultVetoReply(game2)).toBe(false);
    });

    it('rejects veto on RR and RB as hitler', () => {
      game2.currentPres = hitler.name;
      game2.chanCards = [R, R];
      expect(defaultActionService.defaultVetoReply(game2)).toBe(false);
      game2.chanCards = [R, B];
      expect(defaultActionService.defaultVetoReply(game2)).toBe(false);
    });

    it('accepts veto on BB as a fasc or hitler', () => {
      game2.currentPres = fasc1.name;
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultVetoReply(game2)).toBe(true);
      game2.currentPres = hitler.name;
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultVetoReply(game2)).toBe(true);
    });
  });

  describe('defaultInvClaim', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      jest
        .spyOn(defaultActionService, 'testProb')
        .mockImplementation(() => true);
      game2.currentChan = lib1.name;
    });

    it('tells the truth as a lib', () => {
      game2.currentPres = lib1.name;
      lib1.investigations.push(fasc1.name);
      expect(defaultActionService.defaultInvClaim(game2)).toBe(Team.FASC);
      lib1.investigations.push(lib2.name);
      expect(defaultActionService.defaultInvClaim(game2)).toBe(Team.LIB);
      lib1.investigations.push(hitler.name);
      expect(defaultActionService.defaultInvClaim(game2)).toBe(Team.FASC);
      expect(defaultActionService.testProb).toBeCalledTimes(0);
    });

    it('confs based on test prob as a fasc', () => {
      game2.currentPres = fasc1.name;
      fasc1.investigations.push(lib1.name);
      expect(defaultActionService.defaultInvClaim(game2)).toBe(Team.FASC);
      fasc1.investigations.push(fasc2.name);
      expect(defaultActionService.defaultInvClaim(game2)).toBe(Team.FASC);
      fasc1.investigations.push(hitler.name);
      expect(defaultActionService.defaultInvClaim(game2)).toBe(Team.FASC);
      expect(defaultActionService.testProb).toBeCalledTimes(3);
    });

    it('does not conf based on test prob as a fasc', () => {
      jest
        .spyOn(defaultActionService, 'testProb')
        .mockImplementation(() => false);
      game2.currentPres = fasc1.name;
      fasc1.investigations.push(lib1.name);
      expect(defaultActionService.defaultInvClaim(game2)).toBe(Team.LIB);
      fasc1.investigations.push(fasc2.name);
      expect(defaultActionService.defaultInvClaim(game2)).toBe(Team.LIB);
      fasc1.investigations.push(hitler.name);
      expect(defaultActionService.defaultInvClaim(game2)).toBe(Team.LIB);
      expect(defaultActionService.testProb).toBeCalledTimes(3);
    });

    it('calls simple version when the game setting is simpleBlind', () => {
      jest.spyOn(defaultActionService, 'getSimpleFascInvConfProb');
      jest.spyOn(defaultActionService, 'getFascInvConfProb');
      game2.currentPres = fasc1.name;
      fasc1.investigations.push(lib1.name);
      game2.settings.simpleBlind = true;
      game2.currentPres = fasc1.name;
      defaultActionService.defaultInvClaim(game2);
      expect(defaultActionService.getFascInvConfProb).toBeCalledTimes(0);
      expect(defaultActionService.getSimpleFascInvConfProb).toBeCalledTimes(1);
    });
  });

  describe('defaultPresDiscard', () => {
    beforeEach(() => {
      jest
        .spyOn(defaultActionService, 'testProb')
        .mockImplementation(() => true);
      jest.spyOn(defaultActionService, 'getPresDropProbs');
      jest.spyOn(defaultActionService, 'getSimplePresDropProbs');
      game2.currentChan = fasc2.name;
    });

    it('vanilla fasc discard B when test prob is true', () => {
      game2.currentPres = fasc1.name;
      game2.presCards = [R, R, B];
      expect(defaultActionService.defaultPresDiscard(game2)).toBe(Color.BLUE);
      game2.presCards = [R, B, B];
      expect(defaultActionService.defaultPresDiscard(game2)).toBe(Color.BLUE);
      game2.presCards = [B, B, B];
      expect(defaultActionService.defaultPresDiscard(game2)).toBe(Color.BLUE);
      game2.presCards = [R, R, R];
      expect(defaultActionService.defaultPresDiscard(game2)).toBe(Color.RED);
      expect(defaultActionService.getPresDropProbs).toBeCalledTimes(4);
      expect(defaultActionService.getSimplePresDropProbs).toBeCalledTimes(0);
    });

    it('discards blue when passing test prob for hitler', () => {
      game2.currentPres = hitler.name;
      game2.presCards = [R, R, B];
      expect(defaultActionService.defaultPresDiscard(game2)).toBe(Color.BLUE);
      game2.presCards = [R, B, B];
      expect(defaultActionService.defaultPresDiscard(game2)).toBe(Color.BLUE);
      game2.presCards = [B, B, B];
      expect(defaultActionService.defaultPresDiscard(game2)).toBe(Color.BLUE);
      game2.presCards = [R, R, R];
      expect(defaultActionService.defaultPresDiscard(game2)).toBe(Color.RED);
      expect(defaultActionService.getPresDropProbs).toBeCalledTimes(4);
      expect(defaultActionService.getSimplePresDropProbs).toBeCalledTimes(0);
    });

    it('discards red whenever possible for a lib', () => {
      game2.currentPres = lib1.name;
      game2.presCards = [B, B, B];
      expect(defaultActionService.defaultPresDiscard(game2)).toBe(Color.BLUE);
      game2.presCards = [R, B, B];
      expect(defaultActionService.defaultPresDiscard(game2)).toBe(Color.RED);
      game2.presCards = [R, R, B];
      expect(defaultActionService.defaultPresDiscard(game2)).toBe(Color.RED);
      game2.presCards = [R, R, R];
      expect(defaultActionService.defaultPresDiscard(game2)).toBe(Color.RED);
      expect(defaultActionService.getPresDropProbs).toBeCalledTimes(0);
      expect(defaultActionService.getSimplePresDropProbs).toBeCalledTimes(0);
    });

    it('discards red when failing test prob for a fasc', () => {
      jest
        .spyOn(defaultActionService, 'testProb')
        .mockImplementation(() => false);
      game2.currentPres = fasc1.name;
      game2.presCards = [B, B, B];
      expect(defaultActionService.defaultPresDiscard(game2)).toBe(Color.BLUE);
      game2.presCards = [R, B, B];
      expect(defaultActionService.defaultPresDiscard(game2)).toBe(Color.RED);
      game2.presCards = [R, R, B];
      expect(defaultActionService.defaultPresDiscard(game2)).toBe(Color.RED);
      game2.presCards = [R, R, R];
      expect(defaultActionService.defaultPresDiscard(game2)).toBe(Color.RED);
    });

    it('calls simple version when the game setting is simpleBlind', () => {
      game2.settings.simpleBlind = true;
      game2.currentPres = fasc1.name;
      game2.presCards = [B, B, B];
      defaultActionService.defaultPresDiscard(game2);
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
      game2.currentChan = lib1.name;
      expect(logicService.getCurrentChan(game2).role).toBe(Role.LIB);
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game2)).toBe(Color.BLUE);
      game2.chanCards = [R, B];
      expect(defaultActionService.defaultChanPlay(game2)).toBe(Color.BLUE);
      game2.chanCards = [R, R];
      expect(defaultActionService.defaultChanPlay(game2)).toBe(Color.RED);
    });

    it('plays red when passing testProb for a fasc', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 1);
      game2.currentChan = fasc1.name;
      expect(logicService.getCurrentChan(game2).role).toBe(Role.FASC);
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game2)).toBe(Color.BLUE);
      game2.chanCards = [R, B];
      expect(defaultActionService.defaultChanPlay(game2)).toBe(Color.RED);
      game2.chanCards = [R, R];
      expect(defaultActionService.defaultChanPlay(game2)).toBe(Color.RED);
    });

    it('plays red when passing testProb for hitler', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 1);
      game2.currentChan = hitler.name;
      expect(logicService.getCurrentChan(game2).role).toBe(Role.HITLER);
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game2)).toBe(Color.BLUE);
      game2.chanCards = [R, B];
      expect(defaultActionService.defaultChanPlay(game2)).toBe(Color.RED);
      game2.chanCards = [R, R];
      expect(defaultActionService.defaultChanPlay(game2)).toBe(Color.RED);
    });

    it('plays blue when failing testProb for a fasc', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game2.currentChan = fasc1.name;
      expect(logicService.getCurrentChan(game2).role).toBe(Role.FASC);
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game2)).toBe(Color.BLUE);
      game2.chanCards = [R, B];
      expect(defaultActionService.defaultChanPlay(game2)).toBe(Color.BLUE);
      game2.chanCards = [R, R];
      expect(defaultActionService.defaultChanPlay(game2)).toBe(Color.RED);
    });

    it('does not request veto for a lib on RR if not in veto zone', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game2.currentChan = lib1.name;
      expect(logicService.getCurrentChan(game2).role).toBe(Role.LIB);
      game2.chanCards = [R, R];
      expect(defaultActionService.defaultChanPlay(game2)).not.toBeNull();
    });

    it('does not request veto for a lib on RR in veto zone but veto already declined', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game2.FascPoliciesEnacted = 5;
      game2.status = Status.VETO_DECLINED;
      game2.currentChan = lib1.name;
      expect(logicService.getCurrentChan(game2).role).toBe(Role.LIB);
      game2.chanCards = [R, R];
      expect(defaultActionService.defaultChanPlay(game2)).not.toBeNull();
    });

    it('does request veto for a lib on RR in veto zone', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game2.FascPoliciesEnacted = 5;
      game2.status = Status.CHAN_PLAY;
      game2.currentChan = lib1.name;
      expect(logicService.getCurrentChan(game2).role).toBe(Role.LIB);
      game2.chanCards = [R, R];
      expect(defaultActionService.defaultChanPlay(game2)).toBeNull();
    });

    it('does not request veto for a lib on RB or BB in veto zone', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game2.FascPoliciesEnacted = 5;
      game2.status = Status.CHAN_PLAY;
      game2.currentChan = lib1.name;
      expect(logicService.getCurrentChan(game2).role).toBe(Role.LIB);
      game2.chanCards = [R, B];
      expect(defaultActionService.defaultChanPlay(game2)).not.toBeNull();
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game2)).not.toBeNull();
    });

    it('does not request veto for a fasc on BB with fasc if not in veto zone', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game2.currentChan = fasc1.name;
      game2.currentPres = hitler.name;
      game2.status = Status.CHOOSE_CHAN;
      expect(logicService.getCurrentChan(game2).team).toBe(Team.FASC);
      expect(logicService.getCurrentPres(game2).team).toBe(Team.FASC);
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game2)).not.toBeNull();
    });

    it('does request veto for a fasc on BB with fasc if  in veto zone', () => {
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game2.currentChan = fasc1.name;
      game2.currentPres = hitler.name;
      game2.status = Status.CHOOSE_CHAN;
      game2.FascPoliciesEnacted = 5;
      expect(logicService.getCurrentChan(game2).team).toBe(Team.FASC);
      expect(logicService.getCurrentPres(game2).team).toBe(Team.FASC);
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game2)).toBeNull();
    });

    it('does not request veto for a fasc on BB in veto zone if veto already declined', () => {
      game2.FascPoliciesEnacted = 5;
      game2.status = Status.VETO_DECLINED;
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game2.currentChan = fasc1.name;
      game2.currentPres = fasc2.name;
      expect(logicService.getCurrentChan(game2).team).toBe(Team.FASC);
      expect(logicService.getCurrentPres(game2).team).toBe(Team.FASC);
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game2)).not.toBeNull();
    });

    it('does not request veto for a fasc on BB in veto zone if pres is lib', () => {
      game2.FascPoliciesEnacted = 5;
      game2.status = Status.CHOOSE_CHAN;
      jest
        .spyOn(defaultActionService, 'getChanDropProbs')
        .mockImplementation(() => 0);
      game2.currentChan = fasc1.name;
      game2.currentPres = lib1.name;
      expect(logicService.getCurrentChan(game2).team).toBe(Team.FASC);
      expect(logicService.getCurrentPres(game2).team).toBe(Team.LIB);
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultChanPlay(game2)).not.toBeNull();
    });

    it('calls simple version when the game setting is simpleBlind', () => {
      game2.settings.simpleBlind = true;
      game2.currentChan = fasc1.name;
      game2.chanCards = [B, B];
      defaultActionService.defaultChanPlay(game2);
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
      game2.currentChan = lib1.name;
      expect(logicService.getCurrentChan(game2).role).toBe(Role.LIB);
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultChanClaim(game2)).toBe(CHAN2.BB);
      game2.chanCards = [R, B];
      expect(defaultActionService.defaultChanClaim(game2)).toBe(CHAN2.RB);
      game2.chanCards = [R, R];
      expect(defaultActionService.defaultChanClaim(game2)).toBe(CHAN2.RR);
      expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(0);
      expect(
        defaultActionService.getSimpleFascFascBlueChanClaim,
      ).toBeCalledTimes(0);
    });

    it('fasc claim RR if a red is played', () => {
      game2.currentChan = fasc1.name;
      game2.currentPres = fasc2.name;
      game2.chanPlay = R;
      expect(logicService.getCurrentChan(game2).team).toBe(Team.FASC);
      expect(logicService.getCurrentChan(game2).team).toBe(Team.FASC);
      game2.chanCards = [R, B];
      expect(defaultActionService.defaultChanClaim(game2)).toBe(CHAN2.RR);
      game2.chanCards = [R, R];
      expect(defaultActionService.defaultChanClaim(game2)).toBe(CHAN2.RR);
      expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(0);
      expect(
        defaultActionService.getSimpleFascFascBlueChanClaim,
      ).toBeCalledTimes(0);
    });

    it('doesnt lie as a fasc if pres is lib', () => {
      game2.currentChan = fasc1.name;
      game2.currentPres = lib1.name;
      game2.chanPlay = B;
      expect(logicService.getCurrentChan(game2).team).toBe(Team.FASC);
      expect(logicService.getCurrentPres(game2).team).toBe(Team.LIB);
      game2.chanCards = [R, B];
      expect(defaultActionService.defaultChanClaim(game2)).toBe(CHAN2.RB);
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultChanClaim(game2)).toBe(CHAN2.BB);
      expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(0);
      expect(
        defaultActionService.getSimpleFascFascBlueChanClaim,
      ).toBeCalledTimes(0);
    });

    it('doesnt lie as a fasc if hitler is the chan if not knownFasc', () => {
      defaultActionService.knownFascistToHitler = () => false;
      game2.currentChan = hitler.name;
      game2.currentPres = lib1.name;
      game2.chanPlay = B;
      expect(logicService.getCurrentChan(game2).role).toBe(Role.HITLER);
      expect(logicService.getCurrentPres(game2).team).toBe(Team.LIB);
      game2.chanCards = [R, B];
      expect(defaultActionService.defaultChanClaim(game2)).toBe(CHAN2.RB);
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultChanClaim(game2)).toBe(CHAN2.BB);
      //fasc pres
      game2.currentPres = fasc1.name;
      expect(logicService.getCurrentPres(game2).team).toBe(Team.FASC);
      game2.chanCards = [R, B];
      expect(defaultActionService.defaultChanClaim(game2)).toBe(CHAN2.RB);
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultChanClaim(game2)).toBe(CHAN2.BB);

      expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(0);
      expect(
        defaultActionService.getSimpleFascFascBlueChanClaim,
      ).toBeCalledTimes(0);
    });

    it('it calls getFascFascBlueChanClaim when fasc fasc to get claim', () => {
      game2.currentChan = fasc1.name;
      game2.currentPres = fasc2.name;
      game2.chanPlay = B;
      expect(logicService.getCurrentChan(game2).role).toBe(Role.FASC);
      expect(logicService.getCurrentPres(game2).team).toBe(Team.FASC);
      game2.chanCards = [R, B];
      defaultActionService.testProb = () => true;
      expect(defaultActionService.defaultChanClaim(game2)).toBe(CHAN2.BB); //mockImplementation
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultChanClaim(game2)).toBe(CHAN2.RB); //mockImplementation
      expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(2);
      expect(
        defaultActionService.getSimpleFascFascBlueChanClaim,
      ).toBeCalledTimes(0);
    });

    it('it calls getFascFascBlueChanClaim when hitler is chan with a known fasc to get claim', () => {
      defaultActionService.knownFascistToHitler = () => true;
      game2.currentChan = hitler.name;
      game2.currentPres = fasc1.name;
      game2.chanPlay = B;
      expect(logicService.getCurrentChan(game2).role).toBe(Role.HITLER);
      expect(logicService.getCurrentPres(game2).team).toBe(Team.FASC);
      game2.chanCards = [R, B];
      defaultActionService.testProb = () => true;
      expect(defaultActionService.defaultChanClaim(game2)).toBe(CHAN2.BB); //mockImplementation
      game2.chanCards = [B, B];
      expect(defaultActionService.defaultChanClaim(game2)).toBe(CHAN2.RB); //mockImplementation
      expect(defaultActionService.getFascFascBlueChanClaim).toBeCalledTimes(2);
      expect(
        defaultActionService.getSimpleFascFascBlueChanClaim,
      ).toBeCalledTimes(0);
    });

    it('calls simple version when the game setting is simpleBlind', () => {
      game2.settings.simpleBlind = true;
      game2.currentPres = fasc1.name;
      game2.currentChan = fasc2.name;
      game2.chanPlay = B;
      game2.chanCards = [B, B];
      defaultActionService.defaultChanClaim(game2);
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
        game2.currentPres = lib1.name;
        expect(logicService.getCurrentPres(game2).role).toBe(Role.LIB);
        game2.presCards = [B, B, B];
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.BBB);
        game2.presCards = [R, B, B];
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RBB);
        game2.presCards = [R, R, B];
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RRB);
        game2.presCards = [R, R, R];
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RRR);
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
        game2.currentPres = fasc1.name;
        game2.currentChan = lib1.name;
        game2.presDiscard = B;
        expect(logicService.getCurrentPres(game2).role).toBe(Role.FASC);
        expect(logicService.getCurrentChan(game2).role).toBe(Role.LIB);
        game2.presCards = [R, R, B];
        defaultActionService.testProb = () => true;
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RRB);
        game2.presCards = [R, B, B];
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RRB);
        game2.presCards = [B, B, B];
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RBB);
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
        defaultActionService.testProb = () => false;

        game2.currentPres = fasc1.name;
        game2.currentChan = lib1.name;
        game2.presDiscard = B;
        expect(logicService.getCurrentPres(game2).role).toBe(Role.FASC);
        expect(logicService.getCurrentChan(game2).role).toBe(Role.LIB);
        game2.presCards = [R, R, B];
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RRR);
        game2.presCards = [R, B, B];
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RRB);
        game2.presCards = [B, B, B];
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.BBB);
        expect(defaultActionService.getPresClaimWithLibProbs).toBeCalledTimes(
          3,
        );
        expect(defaultActionService.getPresClaimWithFascProbs).toBeCalledTimes(
          0,
        );
      });

      it('claims different than what was passed when discarding a R if passes testprob', () => {
        defaultActionService.testProb = () => true;

        game2.currentPres = fasc1.name;
        game2.currentChan = lib1.name;
        game2.presDiscard = R;
        expect(logicService.getCurrentPres(game2).role).toBe(Role.FASC);
        expect(logicService.getCurrentChan(game2).role).toBe(Role.LIB);
        game2.presCards = [R, R, R];
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RRB);
        game2.presCards = [R, R, B];
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RBB);
        game2.presCards = [R, B, B];
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.BBB);
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
        defaultActionService.testProb = () => false;

        game2.currentPres = fasc1.name;
        game2.currentChan = lib1.name;
        game2.presDiscard = R;
        expect(logicService.getCurrentPres(game2).role).toBe(Role.FASC);
        expect(logicService.getCurrentChan(game2).role).toBe(Role.LIB);
        game2.presCards = [R, R, R];
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RRR);
        game2.presCards = [R, R, B];
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RRB);
        game2.presCards = [R, B, B];
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RBB);
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
        game2.settings.simpleBlind = true;
        game2.currentPres = hitler.name;
        game2.currentChan = lib1.name;
        game2.presDiscard = B;
        game2.chanCards = [B, B];
        game2.presCards = [B, B, B];
        defaultActionService.defaultPresClaim(game2);
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
        defaultActionService.testProb = () => true;

        game2.currentPres = hitler.name;
        game2.currentChan = fasc1.name;
        game2.presCards = [R, B, B];
        expect(logicService.getCurrentPres(game2).team).toBe(Team.FASC);
        expect(logicService.getCurrentChan(game2).team).toBe(Team.FASC);
        game2.chanClaim = CHAN2.RR;
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RRB);
        game2.chanClaim = CHAN2.RB;
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RRB);
        game2.chanClaim = CHAN2.BB;
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.BBB);
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
        defaultActionService.testProb = () => false;

        game2.currentPres = fasc1.name;
        game2.currentChan = fasc2.name;
        game2.presCards = [R, B, B];
        expect(logicService.getCurrentPres(game2).team).toBe(Team.FASC);
        expect(logicService.getCurrentChan(game2).team).toBe(Team.FASC);
        game2.chanClaim = CHAN2.RR;
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RRR);
        game2.chanClaim = CHAN2.RB;
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RRB);
        game2.chanClaim = CHAN2.BB;
        expect(defaultActionService.defaultPresClaim(game2)).toBe(PRES3.RBB);
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
      let hitlerInvLibLieProbs = [0.65, 0.8, 0.9, 0.95, 1];
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

  // describe('getfascfascbluechanclaim', () => {
  //   let underclaimTotal: number;
  //   beforeEach(() => {
  //     game.currentPres = 'player-2';
  //     game.currentChan = 'player-2';
  //     // defaultActionService.lib3RedOnThisDeck = () => false
  //     defaultActionService.underclaimTotal = () => underclaimTotal;
  //   });

  //   it('underclaims BB prob 1 if overclaims are high ', () => {
  //     underclaimTotal = -2;
  //     expect(
  //       defaultActionService.getFascFascBlueChanClaim(game, CHAN2.BB)[0],
  //     ).toBe(1);
  //   });

  //   it('underclaims BB prob .9 if lib3Red and no underclaim ', () => {
  //     underclaimTotal = 0;
  //     defaultActionService.lib3RedOnThisDeck = () => true;
  //     expect(
  //       defaultActionService.getFascFascBlueChanClaim(game, CHAN2.BB)[0],
  //     ).toBe(0.9);
  //     defaultActionService.lib3RedOnThisDeck = () => false;
  //     expect(
  //       defaultActionService.getFascFascBlueChanClaim(game, CHAN2.BB)[0],
  //     ).not.toBe(0.9);
  //   });

  //   it('underclaims BB prob .9 if <= 1 underclaim and lib3red and no fasc3Red', () => {
  //     underclaimTotal = 0;
  //     defaultActionService.lib3RedOnThisDeck = () => true;
  //     defaultActionService.fasc3RedOnThisDeck = () => false;
  //     expect(
  //       defaultActionService.getFascFascBlueChanClaim(game, CHAN2.BB)[0],
  //     ).toBe(0.9);
  //     defaultActionService.fasc3RedOnThisDeck = () => true;
  //     expect(
  //       defaultActionService.getFascFascBlueChanClaim(game, CHAN2.BB)[0],
  //     ).not.toBe(0.9);
  //     defaultActionService.fasc3RedOnThisDeck = () => false;
  //     defaultActionService.lib3RedOnThisDeck = () => false;
  //     expect(
  //       defaultActionService.getFascFascBlueChanClaim(game, CHAN2.BB)[0],
  //     ).not.toBe(0.9);
  //   });

  //   it('underclaims BB prob 0 if >= 2 underclaim or other', () => {
  //     underclaimTotal = 2;
  //     defaultActionService.lib3RedOnThisDeck = () => true;
  //     defaultActionService.fasc3RedOnThisDeck = () => false;
  //     expect(
  //       defaultActionService.getFascFascBlueChanClaim(game, CHAN2.BB)[0],
  //     ).toBe(0);
  //     underclaimTotal = 1;
  //     defaultActionService.lib3RedOnThisDeck = () => false;
  //     defaultActionService.fasc3RedOnThisDeck = () => false;
  //     expect(
  //       defaultActionService.getFascFascBlueChanClaim(game, CHAN2.BB)[0],
  //     ).toBe(0);
  //   });

  //   it('overclaims RB prob .75 if no underclaims/overclaims and blue count <= 2', () => {
  //     underclaimTotal = 0;
  //     defaultActionService.deck1BlueCount = () => 2;
  //     //not if overclaim
  //     underclaimTotal = -1;
  //     expect(
  //       defaultActionService.getFascFascBlueChanClaim(game, CHAN2.RB)[1],
  //     ).not.toBe(0.75);
  //     // not if deck1BlueCount too high
  //     underclaimTotal = 0;
  //     defaultActionService.deck1BlueCount = () => 3;
  //     expect(
  //       defaultActionService.getFascFascBlueChanClaim(game, CHAN2.RB)[1],
  //     ).not.toBe(0.75);
  //   });

  //   it('overclaims RB prob .9 if underclaim is 1 and no lib3red (cover for fasc)', () => {
  //     underclaimTotal = 1;
  //     defaultActionService.lib3RedOnThisDeck = () => false;
  //     expect(
  //       defaultActionService.getFascFascBlueChanClaim(game, CHAN2.RB)[1],
  //     ).toBe(0.9);
  //     // not if a lib3Red
  //     defaultActionService.lib3RedOnThisDeck = () => true;
  //     expect(
  //       defaultActionService.getFascFascBlueChanClaim(game, CHAN2.RB)[1],
  //     ).not.toBe(0.9);
  //   });

  //   it('overclaims RB prob 1 if underclaim is at least 2', () => {
  //     underclaimTotal = 2;
  //     expect(
  //       defaultActionService.getFascFascBlueChanClaim(game, CHAN2.RB)[1],
  //     ).toBe(1);
  //   });

  //   it('overclaims RB prob 0 otherwise', () => {
  //     underclaimTotal = -1;
  //     defaultActionService.lib3RedOnThisDeck = () => true;
  //     expect(
  //       defaultActionService.getFascFascBlueChanClaim(game, CHAN2.RB)[1],
  //     ).toBe(0);
  //   });
  // });

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

    //change later now that it does conf for hitler
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
});

/**

   */
