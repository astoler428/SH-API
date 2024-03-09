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
  CHAN2,
  Color,
  Conf,
  DefaultAction,
  PRES3,
  Role,
  Status,
  Team,
  draws2,
  draws3,
} from '../consts';
import { Card } from 'src/models/card.model';
import { GameRepository } from './game.repository';

describe('DefaultActionService', () => {
  let defaultActionService: DefaultActionService;
  let logicService: LogicService;
  let players: Player[];
  let game: Game;
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
          Role.FASC,
          0,
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
          Role.FASC,
          0,
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
        game2.deck.drawPileLengthBeforeDraw3 = 12;
        let blueProbs = defaultActionService.probabilityofDrawingBlues(game2);
        expect(blueProbs[0]).toEqual(21 / 55);

        game2.deck.drawPileLengthBeforeDraw3 = 4;
        defaultActionService.bluesToBeginTheDeck = () => 1;
        blueProbs = defaultActionService.probabilityofDrawingBlues(game2);
        expect(blueProbs[0]).toEqual(0.25);
        expect(blueProbs[1]).toEqual(0.75);
        expect(blueProbs[2]).toEqual(0);
        expect(blueProbs[3]).toEqual(0);

        game2.deck.drawPileLengthBeforeDraw3 = 10;
        defaultActionService.bluesToBeginTheDeck = () => 2;
        blueProbs = defaultActionService.probabilityofDrawingBlues(game2);
        const EV = defaultActionService.expectedValueOfBlues(game2);
      });
    });

    describe('deck1FinalGovBlueCountTooLow', () => {
      it('properly checks true', () => {
        game2.deck.deckNum = 1;
        game2.deck.drawPileLengthBeforeDraw3 = 5;
        defaultActionService.blueCountOnThisDeck = () => 0;
        expect(
          defaultActionService.deck1FinalGovBlueCountTooLow(game2, 2),
        ).toBe(true);
        defaultActionService.blueCountOnThisDeck = () => 1;
        expect(
          defaultActionService.deck1FinalGovBlueCountTooLow(game2, 2),
        ).toBe(true);
        defaultActionService.blueCountOnThisDeck = () => 2;
        expect(
          defaultActionService.deck1FinalGovBlueCountTooLow(game2, 2),
        ).toBe(true);
      });
      it('properly checks false', () => {
        game2.deck.deckNum = 1;
        game2.deck.drawPileLengthBeforeDraw3 = 5;
        defaultActionService.blueCountOnThisDeck = () => 3;
        expect(
          defaultActionService.deck1FinalGovBlueCountTooLow(game2, 2),
        ).toBe(false);
        defaultActionService.blueCountOnThisDeck = () => 0;
        game2.deck.drawPileLengthBeforeDraw3 = 6;
        expect(
          defaultActionService.deck1FinalGovBlueCountTooLow(game2, 2),
        ).toBe(false);
        game2.deck.deckNum = 2;
        game2.deck.drawPileLengthBeforeDraw3 = 1;
        defaultActionService.blueCountOnThisDeck = () => 0;
        expect(
          defaultActionService.deck1FinalGovBlueCountTooLow(game2, 2),
        ).toBe(false);
      });
    });
    describe('expectedValueOfBlues', () => {
      it('properly calculates EV', () => {
        defaultActionService.bluesToBeginTheDeck = () => 3;
        game2.deck.drawPileLengthBeforeDraw3 = 12;
        let blueProbs = defaultActionService.probabilityofDrawingBlues(game2);
        let EV = defaultActionService.expectedValueOfBlues(game2);
        expect(EV).toEqual(blueProbs[1] + 2 * blueProbs[2] + 3 * blueProbs[3]);

        game2.deck.drawPileLengthBeforeDraw3 = 4;
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

    it('overclaims RRR prob even more if underclaims', () => {
      defaultActionService.probabilityofDrawingBlues = () => [
        0.25, 0.74, 0.01, 0,
      ];
      defaultActionService.underclaimTotal = () => 1;
      game2.currentPres = fasc1.name;
      let [overclaimToBBInspect3Prob] =
        defaultActionService.getInspect3ClaimProbs(game2);
      expect(overclaimToBBInspect3Prob).toEqual(0.8);
      defaultActionService.underclaimTotal = () => 2;
      game2.currentPres = fasc1.name;
      [overclaimToBBInspect3Prob] =
        defaultActionService.getInspect3ClaimProbs(game2);
      expect(overclaimToBBInspect3Prob).toEqual(1);
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
    it('uses a different deck count if just reshuffle', () => {
      game2.deck.justReshuffled = true;
      game2.deck.deckNum = 1;
      game2.govs.push(new GovMockFactory().create({ underclaim: 2 }));
      defaultActionService.probabilityofDrawingBlues = () => [0.25, 0.75, 1, 0];
      const [overclaimToBBInspect3Prob] =
        defaultActionService.getInspect3ClaimProbs(game2);
      expect(overclaimToBBInspect3Prob).toEqual(0.6);
    });
  });
  describe('getSimpleInspect3ClaimProbs', () => {
    let cards3: Card[];

    it('underclaims BBB with prob 1 for vanilla fasc and hitler', () => {
      cards3 = [B, B, B];
      game2.currentPres = fasc1.name;
      let [, underclaimBBBInspect3Prob] =
        defaultActionService.getSimpleInspect3ClaimProbs(game2);
      expect(underclaimBBBInspect3Prob).toEqual(1);
      game2.currentPres = hitler.name;
      [, underclaimBBBInspect3Prob] =
        defaultActionService.getSimpleInspect3ClaimProbs(game2);
      expect(underclaimBBBInspect3Prob).toEqual(1);
    });

    it('overclaims RRR prob 1 for fasc and never for hitler', () => {
      game2.currentPres = fasc1.name;
      let [overclaimFromRRRtoRBBInspect3Prob] =
        defaultActionService.getSimpleInspect3ClaimProbs(game2);
      expect(overclaimFromRRRtoRBBInspect3Prob).toEqual(1);
      game2.currentPres = hitler.name;
      [overclaimFromRRRtoRBBInspect3Prob] =
        defaultActionService.getSimpleInspect3ClaimProbs(game2);
      expect(overclaimFromRRRtoRBBInspect3Prob).toEqual(0);
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
    let isDoubleDipping: boolean;

    beforeEach(() => {
      jest.resetAllMocks();
      jest
        .spyOn(defaultActionService, 'underclaimTotal')
        .mockImplementation(() => underclaimTotal);
      jest
        .spyOn(defaultActionService, 'doubleDipping')
        .mockImplementation(() => isDoubleDipping);
    });

    it('calls fasc fasc if already in conflict', () => {
      game2.confs.push({
        confer: fasc1.name,
        confee: lib1.name,
        type: Conf.INV,
      });
      expect(
        defaultActionService.getFascInvConfProb(game2, fasc1, lib1),
      ).toEqual(1);
    });

    it('calls fasc fasc if already in conflict - advanced', () => {
      game2.invClaims.push({
        investigator: hitler.name,
        investigatee: lib1.name,
        claim: Team.LIB,
      });
      game2.confs.push({
        confer: fasc1.name,
        confee: lib1.name,
        type: Conf.POLICY,
      });
      logicService.addIndirectConfs(game2, fasc1.name, lib1.name, Conf.POLICY);
      expect(
        defaultActionService.getFascInvConfProb(game2, fasc1, hitler),
      ).toEqual(1);
    });

    it('confs based on the correct prob on double dip after confing a lib', () => {
      isDoubleDipping = true;
      game2.currentChan = lib1.name;
      expect(
        defaultActionService.getFascInvConfProb(game2, fasc1, lib2),
      ).toEqual(0.6);
      expect(
        defaultActionService.getFascInvConfProb(game2, fasc1, fasc2),
      ).toEqual(0.33);
      expect(
        defaultActionService.getFascInvConfProb(game2, fasc1, hitler),
      ).toEqual(0.15);
    });

    it('confs based on the correct prob on double dip after confing a fasc', () => {
      isDoubleDipping = true;
      game2.currentChan = fasc2.name;
      expect(
        defaultActionService.getFascInvConfProb(game2, fasc1, lib1),
      ).toEqual(1);
      expect(
        defaultActionService.getFascInvConfProb(game2, fasc1, fasc3),
      ).toEqual(0);
      expect(
        defaultActionService.getFascInvConfProb(game2, fasc1, hitler),
      ).toEqual(0);
    });

    it('confs as hitler who knows the role of blind conf based on the correct prob on double dip after confing a lib', () => {
      isDoubleDipping = true;
      game2.currentChan = lib1.name;
      defaultActionService.knownRoleToHitler = () => true;
      expect(
        defaultActionService.getFascInvConfProb(game2, hitler, lib2),
      ).toEqual(0.4);
      expect(
        defaultActionService.getFascInvConfProb(game2, hitler, fasc2),
      ).toEqual(0.2);
    });

    it('confs as hitler who knows the role of blind conf based on the correct prob on double dip after confing a fasc', () => {
      isDoubleDipping = true;
      game2.currentChan = fasc1.name;
      defaultActionService.knownRoleToHitler = () => true;
      expect(
        defaultActionService.getFascInvConfProb(game2, hitler, lib1),
      ).toEqual(1);
      expect(
        defaultActionService.getFascInvConfProb(game2, fasc1, fasc3),
      ).toEqual(0);
    });

    it('confs as hitler who does not know the role of blind conf based on the correct prob on double dip after confing a lib', () => {
      isDoubleDipping = true;
      game2.currentChan = lib1.name;
      defaultActionService.knownRoleToHitler = () => false;
      expect(
        defaultActionService.getFascInvConfProb(game2, hitler, lib2),
      ).toEqual(0.5);
      expect(
        defaultActionService.getFascInvConfProb(game2, hitler, fasc2),
      ).toEqual(0);
      game2.currentChan = fasc1.name;
      expect(
        defaultActionService.getFascInvConfProb(game2, hitler, lib2),
      ).toEqual(0.5);
      expect(
        defaultActionService.getFascInvConfProb(game2, hitler, fasc2),
      ).toEqual(0);
    });

    it('returns the proper hitlerProb based on number of blues', () => {
      isDoubleDipping = false;
      let hitlerInvLibLieProbs = [0.65, 0.8, 0.9, 0.95, 1];
      for (let blues = 0; blues <= 4; blues++) {
        game2.LibPoliciesEnacted = blues;
        expect(
          defaultActionService.getFascInvConfProb(game2, hitler, lib1),
        ).toEqual(hitlerInvLibLieProbs[blues]);
      }
    });

    it('returns the proper vanilla Prob based on number of blues', () => {
      isDoubleDipping = false;
      let vanillaFascInvLibLieProbs = [0.85, 0.95, 1, 1, 1];
      for (let blues = 0; blues <= 4; blues++) {
        game2.LibPoliciesEnacted = blues;
        expect(
          defaultActionService.getFascInvConfProb(game2, fasc1, lib1),
        ).toEqual(vanillaFascInvLibLieProbs[blues]);
      }
    });

    it('returns the proper fasc fasc inv conf prob based on underclaims and deck', () => {
      isDoubleDipping = false;
      underclaimTotal = 3;
      game2.deck.deckNum = 2;
      expect(
        defaultActionService.getFascInvConfProb(game2, fasc1, fasc2),
      ).toEqual(0);
      game2.deck.deckNum = 1;

      expect(
        defaultActionService.getFascInvConfProb(game2, fasc1, fasc2),
      ).toEqual(1);
      underclaimTotal = 2;
      expect(
        defaultActionService.getFascInvConfProb(game2, fasc1, fasc2),
      ).toEqual(0.6);
      underclaimTotal = 1;
      expect(
        defaultActionService.getFascInvConfProb(game2, fasc1, fasc2),
      ).toEqual(0);
    });

    describe('getSimpleFascInvConfProb', () => {
      it('never confs a fellow fasc', () => {
        expect(
          defaultActionService.getSimpleFascInvConfProb(game2, fasc1, fasc2),
        ).toEqual(0);
        expect(
          defaultActionService.getSimpleFascInvConfProb(game2, fasc1, hitler),
        ).toEqual(0);
        expect(
          defaultActionService.getSimpleFascInvConfProb(game2, hitler, fasc1),
        ).toEqual(0);
      });

      it('returns the proper hitlerProb based on number of blues', () => {
        let hitlerInvLibLieProbs = [0.65, 0.8, 0.9, 0.95, 1];
        for (let blues = 0; blues <= 4; blues++) {
          game2.LibPoliciesEnacted = blues;
          expect(
            defaultActionService.getSimpleFascInvConfProb(game2, hitler, lib1),
          ).toEqual(hitlerInvLibLieProbs[blues]);
        }
      });

      it('returns 1 for vanilla fasc', () => {
        for (let blues = 0; blues <= 4; blues++) {
          game2.LibPoliciesEnacted = blues;
          expect(
            defaultActionService.getSimpleFascInvConfProb(game2, fasc1, lib1),
          ).toEqual(1);
        }
      });
    });
  });

  describe('getPresDropProbs', () => {
    let numberOf3RedFascs: number;
    let numberOf3RedLibs: number;
    let underclaimTotal: number;

    beforeEach(() => {
      game2.currentPres = fasc1.name;
      game2.currentChan = lib1.name;
      game2.LibPoliciesEnacted = 0;
      game2.FascPoliciesEnacted = 0;
      game2.deck.deckNum = 1;
      numberOf3RedFascs = 0;
      numberOf3RedLibs = 0;
      underclaimTotal = 0;
      defaultActionService.isPower = () => false;
      defaultActionService.numberOf3RedLibsOnThisDeck = () => numberOf3RedLibs;
      defaultActionService.numberOf3RedFascsOnThisDeck = () =>
        numberOf3RedFascs;
      defaultActionService.underclaimTotal = () => underclaimTotal;
      defaultActionService.knownFascistToHitler = () => false;
      defaultActionService.knownLibToHitler = () => false;
      defaultActionService.deck1FinalGovBlueCountTooLow = () => false;
      defaultActionService.isAntiDD = () => false;
      defaultActionService.isCucu = () => false;
      defaultActionService.probabilityofDrawingBlues = () => [
        0.25, 0.25, 0.25, 0.25,
      ];
    });
    describe('determines RBB drop prob for vanilla Fasc', () => {
      it('returns 0 if more 3RedFasc than 3Red Lib', () => {
        numberOf3RedFascs = 1;
        numberOf3RedLibs = 0;
        const [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(0);
      });
      it('returns 0 if more than 2 underclaims', () => {
        numberOf3RedFascs = 0;
        numberOf3RedLibs = 2;
        underclaimTotal = 2;
        const [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(0);
      });
      it('returns .25 if 1 underclaim', () => {
        numberOf3RedFascs = 0;
        numberOf3RedLibs = 2;
        underclaimTotal = 1;
        const [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(0.25);
      });
      it('returns 1 if at least one overclaim', () => {
        numberOf3RedFascs = 0;
        numberOf3RedLibs = 2;
        underclaimTotal = -1;
        const [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(1);
      });
      it('returns correct amount relative to number lib 3 red vs fasc 3 red if count is correct', () => {
        underclaimTotal = 0;
        numberOf3RedFascs = 0;
        numberOf3RedLibs = 2;
        let [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(1);
        numberOf3RedFascs = 1;
        numberOf3RedLibs = 2;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(0.75);
        numberOf3RedFascs = 1;
        numberOf3RedLibs = 1;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(0.5);
      });
      it('drops with prob 1 in a known fasc fasc and power', () => {
        game2.currentChan = fasc2.name;
        numberOf3RedFascs = 1;
        numberOf3RedLibs = 0;
        let [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).not.toEqual(1);
        defaultActionService.isPower = () => true;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(1);

        defaultActionService.isPower = () => false;
        game2.currentChan = hitler.name;
        numberOf3RedFascs = 1;
        numberOf3RedLibs = 0;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).not.toEqual(1);
        defaultActionService.isPower = () => true;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).not.toEqual(1);

        defaultActionService.isPower = () => false;
        defaultActionService.knownFascistToHitler = () => true;
        game2.currentChan = hitler.name;
        numberOf3RedFascs = 1;
        numberOf3RedLibs = 0;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).not.toEqual(1);
        defaultActionService.isPower = () => true;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(1);
      });
      it('drops with prob 1 in a known fasc fasc and > 1 blue down', () => {
        game2.currentChan = fasc2.name;
        numberOf3RedFascs = 1;
        numberOf3RedLibs = 0;
        let [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).not.toEqual(1);
        game2.LibPoliciesEnacted = 2;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(1);

        game2.LibPoliciesEnacted = 1;
        game2.currentChan = hitler.name;
        numberOf3RedFascs = 1;
        numberOf3RedLibs = 0;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).not.toEqual(1);
        game2.LibPoliciesEnacted = 2;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).not.toEqual(1);

        game2.LibPoliciesEnacted = 1;
        defaultActionService.knownFascistToHitler = () => true;
        game2.currentChan = hitler.name;
        numberOf3RedFascs = 1;
        numberOf3RedLibs = 0;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).not.toEqual(1);
        game2.LibPoliciesEnacted = 2;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(1);
      });
      it('returns .1 if 4th blue with lib', () => {
        game2.LibPoliciesEnacted = 3;
        const [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(0.1);
      });
      it('returns 1 for special cases', () => {
        defaultActionService.isAntiDD = () => true;
        let [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(1);
        defaultActionService.isAntiDD = () => false;
        defaultActionService.isCucu = () => true;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(1);
        defaultActionService.isCucu = () => false;
        game2.LibPoliciesEnacted = 4;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(1);
      });
      it('returns the probs for deck 2', () => {
        game2.deck.deckNum = 2;
        defaultActionService.isPower = () => true;
        const [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(0.9);
      });
    });

    describe('determines RBB drop prob for Hitler', () => {
      beforeEach(() => {
        game2.currentPres = hitler.name;
        game2.currentChan = lib1.name;
      });

      it('returns .9 if 2 blues down', () => {
        game2.LibPoliciesEnacted = 2;
        const [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(0.9);
      });
      it('returns 1 if 3 blues down', () => {
        game2.LibPoliciesEnacted = 3;
        const [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(1);
      });
      it('returns .6 if less than 2 blues down', () => {
        game2.LibPoliciesEnacted = 1;
        let [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(0.6);
        game2.LibPoliciesEnacted = 1;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(0.6);
      });
      it('returns 0 if deck1FinalBlueCountTooLow', () => {
        defaultActionService.deck1FinalGovBlueCountTooLow = () => true;
        let [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(0);
      });
      it('returns 1 if known fasc and power or > 1 blue', () => {
        game2.currentChan = fasc1.name;
        defaultActionService.isPower = () => true;
        let [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).not.toEqual(1);
        defaultActionService.knownFascistToHitler = () => true;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(1);
        defaultActionService.isPower = () => false;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).not.toEqual(1);

        defaultActionService.knownFascistToHitler = () => false;
        game2.LibPoliciesEnacted = 2;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).not.toEqual(1);
        defaultActionService.knownFascistToHitler = () => true;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(1);
        game2.LibPoliciesEnacted = 1;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).not.toEqual(1);
      });
      it('returns .9 for second deck', () => {
        game2.deck.deckNum = 2;
        let [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(0.9);
      });
      it('returns .1 for a known lib with on 4th blue', () => {
        game2.LibPoliciesEnacted = 3;
        let [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).not.toEqual(0.1);
        defaultActionService.knownLibToHitler = () => true;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(0.1);
      });
      it('returns 1 for special cases', () => {
        defaultActionService.isAntiDD = () => true;
        let [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(1);
        defaultActionService.isAntiDD = () => false;
        defaultActionService.isCucu = () => true;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(1);
        defaultActionService.isCucu = () => false;
        game2.LibPoliciesEnacted = 4;
        [RBBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RBBDropProb).toEqual(1);
      });
    });

    describe('determines RRB drop prob for vanilla fasc', () => {
      it('returns 1 for fasc pres with lib chan', () => {
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RRBDropProb).toEqual(1);
      });

      it('returns 0 for fasc pres with vanilla fasc chan or hitler who knows', () => {
        game2.currentChan = fasc2.name;
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RRBDropProb).toEqual(0);
        game2.currentChan = hitler.name;
        defaultActionService.isPower = () => true;
        [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RRBDropProb).not.toEqual(0);
        defaultActionService.knownFascistToHitler = () => true;
        game2.currentChan = hitler.name;
        [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RRBDropProb).toEqual(0);
      });

      it('returns 0 for fasc pres with hitler chan with <= 1 blue and no power', () => {
        game2.currentChan = hitler.name;
        game2.LibPoliciesEnacted = 1;
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RRBDropProb).toEqual(0);
      });
      it('returns .4 for fasc pres with hitler chan with <= 3 blue and no power', () => {
        game2.currentChan = hitler.name;
        game2.LibPoliciesEnacted = 2;
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RRBDropProb).toEqual(0.4);
        game2.LibPoliciesEnacted = 3;
        [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RRBDropProb).toEqual(0.4);
      });
      it('returns 0 or 1 depending on knowledge in antiDD', () => {
        defaultActionService.isAntiDD = () => true;
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RRBDropProb).toEqual(1);
        game2.currentChan = fasc1.name;
        [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RRBDropProb).toEqual(0);
      });
    });

    describe('determines RRB drop prob for hitler', () => {
      beforeEach(() => {
        game2.currentPres = hitler.name;
        game2.currentChan = lib1.name;
      });

      it('returns 1 if >= 3 reds down', () => {
        game2.FascPoliciesEnacted = 3;
        const [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RRBDropProb).toEqual(1);
      });

      it('returns 1 if 3 or 4 blues down', () => {
        game2.LibPoliciesEnacted = 3;
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RRBDropProb).toEqual(1);
        game2.LibPoliciesEnacted = 4;
        [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
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
            hitler.bluesPlayed = bluesPlayed;
            game2.LibPoliciesEnacted = bluesDown;
            let [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
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
            hitler.bluesPlayed = bluesPlayed;
            game2.LibPoliciesEnacted = bluesDown;
            let [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
            expect(RRBDropProb).toEqual(hitlerProbs[bluesDown][bluesPlayed]);
          }
        }
      });

      it('returns 0 or 1 in antiDD depending on knowledge', () => {
        defaultActionService.isAntiDD = () => true;
        let [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RRBDropProb).toEqual(1);
        game2.currentChan = fasc1.name;
        [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RRBDropProb).toEqual(1);
        defaultActionService.knownFascistToHitler = () => true;
        [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
        expect(RRBDropProb).toEqual(0);
      });
    });

    it('drops on RRB and RBB for both if not possible to draw blues', () => {
      defaultActionService.probabilityofDrawingBlues = () => [0.5, 0, 0, 0];
      game2.currentPres = fasc1.name;
      game2.currentChan = fasc2.name;
      defaultActionService.knownFascistToHitler = () => true;

      let [RBBDropProb, RRBDropProb] =
        defaultActionService.getPresDropProbs(game2);
      expect(RBBDropProb).toEqual(1);
      expect(RRBDropProb).toEqual(1);
      game2.currentPres = hitler.name;
      [RBBDropProb, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
      expect(RBBDropProb).toEqual(1);
      expect(RRBDropProb).toEqual(1);
    });
  });

  describe('getSimplePresDropProbs', () => {
    it('returns 1 always for vanilla fasc on RBB and RRB', () => {
      const [RBBDropProb, RRBDropProb] =
        defaultActionService.getSimplePresDropProbs(game2);
      expect(RBBDropProb).toEqual(1);
      expect(RRBDropProb).toEqual(1);
    });

    it('returns according to chart with no power', () => {
      game2.currentPres = hitler.name;
      defaultActionService.isPower = () => false;
      let hitlerProbs = [
        [0.25, null, null, null, null],
        [0.4, 0.3, null, null, null],
        [0.9, 0.5, 0.7, null, null],
        [1, 1, 1, 1, null],
        [1, 1, 1, 1, 1],
      ];

      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        for (let bluesPlayed = 0; bluesPlayed <= bluesDown; bluesPlayed++) {
          hitler.bluesPlayed = bluesPlayed;
          game2.LibPoliciesEnacted = bluesDown;
          let [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
          expect(RRBDropProb).toEqual(hitlerProbs[bluesDown][bluesPlayed]);
        }
      }
    });

    it('returns according to chart with power', () => {
      game2.currentPres = hitler.name;
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
          hitler.bluesPlayed = bluesPlayed;
          game2.LibPoliciesEnacted = bluesDown;
          let [, RRBDropProb] = defaultActionService.getPresDropProbs(game2);
          expect(RRBDropProb).toEqual(hitlerProbs[bluesDown][bluesPlayed]);
        }
      }
    });
  });

  describe('getChanDropProbs', () => {
    let numberOf3RedFascs: number;
    let numberOf3RedLibs: number;
    let underclaimTotal: number;

    beforeEach(() => {
      game2.currentPres = lib1.name;
      game2.currentChan = fasc1.name;
      game2.LibPoliciesEnacted = 0;
      game2.FascPoliciesEnacted = 0;
      game2.deck.deckNum = 1;
      numberOf3RedFascs = 0;
      numberOf3RedLibs = 0;
      underclaimTotal = 0;
      defaultActionService.isPower = () => false;
      defaultActionService.invPower = () => false;
      defaultActionService.numberOf3RedLibsOnThisDeck = () => numberOf3RedLibs;
      defaultActionService.numberOf3RedFascsOnThisDeck = () =>
        numberOf3RedFascs;
      defaultActionService.underclaimTotal = () => underclaimTotal;
      defaultActionService.knownFascistToHitler = () => false;
      defaultActionService.knownLibToHitler = () => false;
      defaultActionService.deck1FinalGovBlueCountTooLow = () => false;
      defaultActionService.isAntiDD = () => false;
      defaultActionService.isCucu = () => false;
      defaultActionService.probabilityofDrawingBlues = () => [
        0.25, 0.25, 0.25, 0.25,
      ];
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
          fasc1.bluesPlayed = bluesPlayed;
          game2.LibPoliciesEnacted = bluesDown;
          let dropProb = defaultActionService.getChanDropProbs(game2);
          expect(dropProb).toEqual(vanillaProbs[bluesDown][bluesPlayed]);
        }
      }
    });

    it('returns according to the chart for hitler', () => {
      game2.currentChan = hitler.name;
      let hitlerProbs = [
        [0.2, null, null, null, null],
        [0.3, 0.15, null, null, null],
        [0.7, 0.4, 0.3, null, null],
        [0.85, 0.75, 0.5, 0.25, null],
        [1, 1, 1, 1, 1],
      ];

      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        for (let bluesPlayed = 0; bluesPlayed <= bluesDown; bluesPlayed++) {
          hitler.bluesPlayed = bluesPlayed;
          game2.LibPoliciesEnacted = bluesDown;
          let dropProb = defaultActionService.getChanDropProbs(game2);
          expect(dropProb).toEqual(hitlerProbs[bluesDown][bluesPlayed]);
        }
      }
    });

    it('drops if fasc fasc for power', () => {
      game2.currentPres = fasc2.name;
      defaultActionService.isPower = () => true;
      let dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(1);
    });

    it('hitler knows fasc pres drops if fasc fasc for power', () => {
      game2.currentPres = fasc2.name;
      game2.currentChan = hitler.name;
      defaultActionService.isPower = () => true;
      let dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).not.toEqual(1);
      defaultActionService.knownFascistToHitler = () => true;
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(1);
    });

    it('returns lower if fasc fasc <= 1 blue and no power ', () => {
      game2.currentPres = fasc2.name;
      defaultActionService.isPower = () => false;
      let dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(0.05);
      game2.LibPoliciesEnacted = 1;
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(0.1);
    });

    it('returns lower if fasc hitler (known) <= 1 blue and no power ', () => {
      game2.currentPres = fasc2.name;
      game2.currentChan = hitler.name;
      defaultActionService.isPower = () => false;
      let dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).not.toEqual(0.05);
      game2.LibPoliciesEnacted = 1;
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).not.toEqual(0.1);
      defaultActionService.knownFascistToHitler = () => true;
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(0.1);
      game2.LibPoliciesEnacted = 0;
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(0.05);
    });

    it('returns lower if lower game count and lower blue count', () => {
      game2.players = players2.slice(0, 6);
      defaultActionService.invPower = () => false;
      game2.LibPoliciesEnacted = 1;
      let dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(0.2);
      game2.players = players2.slice(0, 8);
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(0.2);
      game2.currentChan = hitler.name;
      game2.LibPoliciesEnacted = 0;
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(0.1);
      game2.players = players2.slice(0, 8);
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(0.1);
      game2.LibPoliciesEnacted = 2;
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).not.toEqual(0.1);
      game2.players = players2.slice(0, 7);
      game2.currentChan = fasc1.name;
      game2.LibPoliciesEnacted = 0;
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).not.toEqual(0.2);
    });

    it('returns lower if inv and <= 1 blue', () => {
      defaultActionService.invPower = () => true;
      game2.LibPoliciesEnacted = 1;
      let dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(0.65);
      game2.players = players2.slice(0, 7);
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(0.3);
      game2.players = players2.slice(0, 8);
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(0.1);
    });

    it('handles cucu with fasc fasc', () => {
      game2.currentPres = fasc2.name;
      defaultActionService.isCucu = () => true;
      game2.FascPoliciesEnacted = 3;
      let dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(1);
      game2.FascPoliciesEnacted = 0;
      game2.LibPoliciesEnacted = 3;
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(1);
      game2.LibPoliciesEnacted = 2;
      game2.FascPoliciesEnacted = 2;
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(0.75);
    });

    it('returns 0 cucu with lib hitler', () => {
      game2.currentChan = hitler.name;
      defaultActionService.isCucu = () => true;
      let dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(0);
    });

    it('handles cucu with fasc hitler', () => {
      game2.currentPres = fasc2.name;
      game2.currentChan = hitler.name;
      defaultActionService.isCucu = () => true;
      game2.FascPoliciesEnacted = 3;
      let dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(1);
      game2.FascPoliciesEnacted = 0;
      game2.LibPoliciesEnacted = 3;
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(1);
      game2.LibPoliciesEnacted = 2;
      game2.FascPoliciesEnacted = 2;
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(0.3);
    });

    it('drops for vanilla fasc in no blue should be found', () => {
      defaultActionService.probabilityofDrawingBlues = () => [1, 0, 0, 0];
      let dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(1);
    });

    it('returns 1 if 4 blues or 5 reds', () => {
      game2.LibPoliciesEnacted = 4;
      let dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(1);
      game2.LibPoliciesEnacted = 0;
      game2.FascPoliciesEnacted = 5;
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(1);
      game.currentChan = hitler.name;
      game2.LibPoliciesEnacted = 4;
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(1);
      game2.LibPoliciesEnacted = 0;
      game2.FascPoliciesEnacted = 5;
      dropProb = defaultActionService.getChanDropProbs(game2);
      expect(dropProb).toEqual(1);
    });

    it('returns varying probs in 8 or under player the gun situation', () => {
      game2.players = players2.slice(0, 8);
      defaultActionService.gunPower = () => true;
      game2.FascPoliciesEnacted = 3;
      // <= 3 blue down and pres without topdeck
      defaultActionService.presAgainWithoutTopDeck = () => true;
      game2.LibPoliciesEnacted = 3;
      expect(defaultActionService.getChanDropProbs(game2)).toEqual(1.1);
      // <= 3 blue down and not pres without topdeck
      defaultActionService.presAgainWithoutTopDeck = () => false;
      game2.LibPoliciesEnacted = 3;
      expect(defaultActionService.getChanDropProbs(game2)).toEqual(0.5);
      //confirmed lib
      defaultActionService.confirmedLib = () => true;
      expect(
        Math.abs(defaultActionService.getChanDropProbs(game2) - 0.3),
      ).toBeLessThanOrEqual(0.001);
      //inANyConflict
      defaultActionService.inAnyConflict = () => true;
      expect(
        Math.abs(defaultActionService.getChanDropProbs(game2) - 0.1),
      ).toBeLessThanOrEqual(0.001);
    });

    it('returns varying probs in 8 or under player the gun situation remaining special cases', () => {
      game2.players = players2.slice(0, 8);
      defaultActionService.gunPower = () => true;
      game2.FascPoliciesEnacted = 4;
      // <= 1 blue down
      game2.LibPoliciesEnacted = 1;
      expect(defaultActionService.getChanDropProbs(game2)).toEqual(0.05);
      // 4 blues down
      game2.LibPoliciesEnacted = 4;
      expect(defaultActionService.getChanDropProbs(game2)).toEqual(1);
      //in fasc fasc conflict
      game2.LibPoliciesEnacted = 1;
      game2.confs.push({
        confer: fasc1.name,
        confee: fasc2.name,
        type: Conf.INV,
      });
      expect(defaultActionService.getChanDropProbs(game2)).toEqual(1);
      //no lib majority
      lib3.alive = false;
      lib4.alive = false;
      expect(defaultActionService.getChanDropProbs(game2)).toEqual(0);
    });
  });

  describe('getSimpleChanDropProbs', () => {
    beforeEach(() => {
      game2.currentPres = lib1.name;
      game2.currentChan = hitler.name;
      game2.LibPoliciesEnacted = 0;
      game2.FascPoliciesEnacted = 0;
      defaultActionService.isCucu = () => false;
    });

    it('returns 1 for vanilla fasc', () => {
      game2.currentChan = fasc1.name;
      const fascChanDropProb =
        defaultActionService.getSimpleChanDropProbs(game2);
      expect(fascChanDropProb).toEqual(1);
    });
    it('returns hitler according to chart', () => {
      let hitlerProbs = [
        [0.25, null, null, null, null],
        [0.3, 0.15, null, null, null],
        [0.7, 0.4, 0.3, null, null],
        [0.85, 0.75, 0.5, 0.1, null],
        [1, 1, 1, 1, 1],
      ];

      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        for (let bluesPlayed = 0; bluesPlayed <= bluesDown; bluesPlayed++) {
          hitler.bluesPlayed = bluesPlayed;
          game2.LibPoliciesEnacted = bluesDown;
          const fascChanDropProb =
            defaultActionService.getSimpleChanDropProbs(game2);
          expect(fascChanDropProb).toEqual(hitlerProbs[bluesDown][bluesPlayed]);
        }
      }
    });
    it('does not out as hitler', () => {
      defaultActionService.isCucu = () => true;
      const fascChanDropProb =
        defaultActionService.getSimpleChanDropProbs(game2);
      expect(fascChanDropProb).toEqual(0);
    });
    it('drop with prob 1 if game ending', () => {
      defaultActionService.isCucu = () => true;
      game2.LibPoliciesEnacted = 4;
      let fascChanDropProb = defaultActionService.getSimpleChanDropProbs(game2);
      expect(fascChanDropProb).toEqual(1);
      game2.LibPoliciesEnacted = 0;
      game2.FascPoliciesEnacted = 5;
      fascChanDropProb = defaultActionService.getSimpleChanDropProbs(game2);
      expect(fascChanDropProb).toEqual(1);
    });
  });

  describe('getHitlerBlindConfProbs', () => {
    let underclaimTotal: number;
    let blueCount: number;
    let bluesToBeginDeck: number;
    beforeEach(() => {
      game2.currentPres = hitler.name;
      game2.currentChan = lib1.name;
      game2.deck.deckNum = 1;
      underclaimTotal = 0;
      blueCount = 0;
      bluesToBeginDeck = 6;
      defaultActionService.underclaimTotal = () => underclaimTotal;
      defaultActionService.blueCountOnThisDeck = () => blueCount;
      defaultActionService.invPower = () => false;
      defaultActionService.deck1FinalGovBlueCountTooLow = () => false;
      defaultActionService.bluesToBeginTheDeck = () => bluesToBeginDeck;
    });

    it('returns deck 1 (with underclaim) RRRHitlerBlindConfProb based on blues played by hitler and chan', () => {
      underclaimTotal = 1;
      hitler.bluesPlayed = 2;
      lib1.bluesPlayed = 0;
      let [, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - -0.1)).toBeLessThanOrEqual(
        0.001,
      );
      hitler.bluesPlayed = 1;
      lib1.bluesPlayed = 1;
      [, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - 0.3)).toBeLessThanOrEqual(0.001);
      hitler.bluesPlayed = 1;
      lib1.bluesPlayed = 2;
      [, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - 0.5)).toBeLessThanOrEqual(0.001);
    });
    it('returns deck 1 (without underclaim) RRRHitlerBlindConfProb based on blues played by hitler and chan', () => {
      hitler.bluesPlayed = 2;
      lib1.bluesPlayed = 0;
      let [, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - -0.1)).toBeLessThanOrEqual(
        0.001,
      );
      hitler.bluesPlayed = 1;
      lib1.bluesPlayed = 1;
      [, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - 0.2)).toBeLessThanOrEqual(0.001);
      hitler.bluesPlayed = 1;
      lib1.bluesPlayed = 2;
      [, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - 0.2)).toBeLessThanOrEqual(0.001);
      underclaimTotal = -1;
      [, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - 0)).toBeLessThanOrEqual(0.001);
    });
    it('returns deck 1 RRBHitlerBlindConfProb based on blues played by hitler and chan and underclaim', () => {
      hitler.bluesPlayed = 2;
      lib1.bluesPlayed = 0;
      let [RRBHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(Math.abs(RRBHitlerBlindConfProb - 0)).toBeLessThanOrEqual(0.001);
      hitler.bluesPlayed = 1;
      lib1.bluesPlayed = 1;
      underclaimTotal = 1;
      [RRBHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(Math.abs(RRBHitlerBlindConfProb - 0.65)).toBeLessThanOrEqual(
        0.001,
      );
      hitler.bluesPlayed = 1;
      lib1.bluesPlayed = 2;
      underclaimTotal = -1;
      [RRBHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(Math.abs(RRBHitlerBlindConfProb - 0.35)).toBeLessThanOrEqual(
        0.001,
      );
    });
    it('returns deck 2 probs', () => {
      game2.deck.deckNum = 2;
      bluesToBeginDeck = 3;
      blueCount = 0;
      game2.deck.drawPileLengthBeforeDraw3 = 12;
      let [RRBHitlerBlindConfProb, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - 0.61818)).toBeLessThanOrEqual(
        0.001,
      );
      expect(Math.abs(RRBHitlerBlindConfProb - 0.61818)).toBeLessThanOrEqual(
        0.001,
      );
      game2.FascPoliciesEnacted = 3;
      [RRBHitlerBlindConfProb, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - 0.61818)).toBeLessThanOrEqual(
        0.001,
      );
      expect(Math.abs(RRBHitlerBlindConfProb - 0.86818)).toBeLessThanOrEqual(
        0.001,
      );

      bluesToBeginDeck = 2;
      game2.FascPoliciesEnacted = 0;
      blueCount = 0;
      game2.deck.drawPileLengthBeforeDraw3 = 12;
      [RRBHitlerBlindConfProb, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - 0.4545)).toBeLessThanOrEqual(
        0.001,
      );
      expect(Math.abs(RRBHitlerBlindConfProb - 0.4545)).toBeLessThanOrEqual(
        0.001,
      );
      game2.FascPoliciesEnacted = 3;
      [RRBHitlerBlindConfProb, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - 0.4545)).toBeLessThanOrEqual(
        0.001,
      );
      expect(Math.abs(RRBHitlerBlindConfProb - 0.7045)).toBeLessThanOrEqual(
        0.001,
      );
    });

    it('returns differently if inv power', () => {
      defaultActionService.invPower = () => true;
      underclaimTotal = 1;
      lib1.bluesPlayed = 3;
      let [RRBHitlerBlindConfProb, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(RRBHitlerBlindConfProb).toEqual(0.5);
      expect(RRRHitlerBlindConfProb).toEqual(0.5);
    });

    it('returns differently if game playes count is below 6 or 8', () => {
      game2.players = players2.slice(0, 5);
      let [RRBHitlerBlindConfProb, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(RRBHitlerBlindConfProb).toEqual(0.1);
      expect(RRRHitlerBlindConfProb).toEqual(0.1);
      game2.players = players2.slice(0, 6);
      [RRBHitlerBlindConfProb, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(RRBHitlerBlindConfProb).toEqual(0.1);
      expect(RRRHitlerBlindConfProb).toEqual(0.1);
      game2.players = players2.slice(0, 8);
      [RRBHitlerBlindConfProb, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(RRBHitlerBlindConfProb).toEqual(0.1);
      expect(RRRHitlerBlindConfProb).toEqual(0.1);
    });

    it('does not conf is all blues claimed', () => {
      defaultActionService.bluesToBeginTheDeck = () => 0;
      const [RRBHitlerBlindConfProb, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(RRBHitlerBlindConfProb).toEqual(0);
      expect(RRRHitlerBlindConfProb).toEqual(0);
    });
    it('does not conf if first gun', () => {
      game2.FascPoliciesEnacted = 4;
      const [RRBHitlerBlindConfProb, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(RRBHitlerBlindConfProb).toEqual(0);
      expect(RRRHitlerBlindConfProb).toEqual(0);
    });
    it('confs if blue count too low', () => {
      defaultActionService.deck1FinalGovBlueCountTooLow = () => true;
      const [RRBHitlerBlindConfProb, RRRHitlerBlindConfProb] =
        defaultActionService.getHitlerBlindConfProbs(game2);
      expect(RRBHitlerBlindConfProb).toEqual(1);
      expect(RRRHitlerBlindConfProb).toEqual(1);
    });
  });

  describe('getSimpleHitlerBlindConfProbs', () => {
    let underclaimTotal: number;
    let blueCount: number;
    let bluesToBeginDeck: number;
    beforeEach(() => {
      game2.currentPres = hitler.name;
      game2.currentChan = lib1.name;
      game2.deck.deckNum = 1;
      underclaimTotal = 0;
      blueCount = 0;
      bluesToBeginDeck = 6;
      defaultActionService.underclaimTotal = () => underclaimTotal;
      defaultActionService.blueCountOnThisDeck = () => blueCount;
      defaultActionService.invPower = () => false;
      defaultActionService.deck1FinalGovBlueCountTooLow = () => false;
      defaultActionService.bluesToBeginTheDeck = () => bluesToBeginDeck;
    });

    it('returns deck 1 (with underclaim) RRRHitlerBlindConfProb based on blues played by hitler and chan', () => {
      underclaimTotal = 1;
      hitler.bluesPlayed = 2;
      lib1.bluesPlayed = 0;
      let [, RRRHitlerBlindConfProb] =
        defaultActionService.getSimpleHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - -0.1)).toBeLessThanOrEqual(
        0.001,
      );
      hitler.bluesPlayed = 1;
      lib1.bluesPlayed = 1;
      [, RRRHitlerBlindConfProb] =
        defaultActionService.getSimpleHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - 0.3)).toBeLessThanOrEqual(0.001);
      hitler.bluesPlayed = 1;
      lib1.bluesPlayed = 2;
      [, RRRHitlerBlindConfProb] =
        defaultActionService.getSimpleHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - 0.5)).toBeLessThanOrEqual(0.001);
    });
    it('returns deck 1 (without underclaim) RRRHitlerBlindConfProb based on blues played by hitler and chan', () => {
      hitler.bluesPlayed = 2;
      lib1.bluesPlayed = 0;
      let [, RRRHitlerBlindConfProb] =
        defaultActionService.getSimpleHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - -0.1)).toBeLessThanOrEqual(
        0.001,
      );
      hitler.bluesPlayed = 1;
      lib1.bluesPlayed = 1;
      [, RRRHitlerBlindConfProb] =
        defaultActionService.getSimpleHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - 0.2)).toBeLessThanOrEqual(0.001);
      hitler.bluesPlayed = 1;
      lib1.bluesPlayed = 2;
      [, RRRHitlerBlindConfProb] =
        defaultActionService.getSimpleHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - 0.2)).toBeLessThanOrEqual(0.001);
      underclaimTotal = -1;
      [, RRRHitlerBlindConfProb] =
        defaultActionService.getSimpleHitlerBlindConfProbs(game2);
      expect(Math.abs(RRRHitlerBlindConfProb - 0)).toBeLessThanOrEqual(0.001);
    });
    it('returns deck 1 RRBHitlerBlindConfProb based on blues played by hitler and chan and underclaim', () => {
      hitler.bluesPlayed = 2;
      lib1.bluesPlayed = 0;
      let [RRBHitlerBlindConfProb] =
        defaultActionService.getSimpleHitlerBlindConfProbs(game2);
      expect(Math.abs(RRBHitlerBlindConfProb - 0)).toBeLessThanOrEqual(0.001);
      hitler.bluesPlayed = 1;
      lib1.bluesPlayed = 1;
      underclaimTotal = 1;
      [RRBHitlerBlindConfProb] =
        defaultActionService.getSimpleHitlerBlindConfProbs(game2);
      expect(Math.abs(RRBHitlerBlindConfProb - 0.65)).toBeLessThanOrEqual(
        0.001,
      );
      hitler.bluesPlayed = 1;
      lib1.bluesPlayed = 2;
      underclaimTotal = -1;
      [RRBHitlerBlindConfProb] =
        defaultActionService.getSimpleHitlerBlindConfProbs(game2);
      expect(Math.abs(RRBHitlerBlindConfProb - 0.35)).toBeLessThanOrEqual(
        0.001,
      );
    });
    it('returns deck 2 probs', () => {
      game2.deck.deckNum = 2;
      const [RRBHitlerBlindConfProb, RRRHitlerBlindConfProb] =
        defaultActionService.getSimpleHitlerBlindConfProbs(game2);
      expect(RRBHitlerBlindConfProb).toEqual(1);
      expect(RRRHitlerBlindConfProb).toEqual(1);
    });
  });

  describe('getfascfascbluechanclaim', () => {
    let underclaimTotal: number;
    let numberOf3RedFascs: number;
    let numberOf3RedLibs: number;
    let deck1BlueCount: number;
    beforeEach(() => {
      underclaimTotal = 0;
      numberOf3RedFascs = 0;
      numberOf3RedLibs = 0;
      deck1BlueCount = 0;
      defaultActionService.deck1BlueCount = () => deck1BlueCount;
      defaultActionService.underclaimTotal = () => underclaimTotal;
      defaultActionService.numberOf3RedLibsOnThisDeck = () => numberOf3RedLibs;
      defaultActionService.numberOf3RedFascsOnThisDeck = () =>
        numberOf3RedFascs;
      game2.deck.deckNum = 1;
      game2.currentPres = fasc1.name;
      game2.currentChan = fasc2.name;
    });

    it('underclaims BB prob 1 if overclaims are high ', () => {
      underclaimTotal = -1;
      let [BBUnderclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(BBUnderclaimProb).toEqual(1);
      underclaimTotal = -2;
      [BBUnderclaimProb] = defaultActionService.getFascFascBlueChanClaim(game2);
      expect(BBUnderclaimProb).toEqual(1);
    });

    it('underclaims BB with low underclaim and not more 3redFascs', () => {
      underclaimTotal = 0;
      numberOf3RedFascs = 0;
      numberOf3RedLibs = 0;
      let [BBUnderclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(BBUnderclaimProb).toEqual(0.7);
      underclaimTotal = 1;
      [BBUnderclaimProb] = defaultActionService.getFascFascBlueChanClaim(game2);
      expect(BBUnderclaimProb).toEqual(0.7);
      numberOf3RedLibs = 2;
      numberOf3RedFascs = 1;
      [BBUnderclaimProb] = defaultActionService.getFascFascBlueChanClaim(game2);
      expect(BBUnderclaimProb).toEqual(0.85);
    });

    it('does not underclaim if at least 2 underclaims or more 3 red fasc', () => {
      numberOf3RedFascs = 2;
      numberOf3RedLibs = 1;
      let [BBUnderclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(BBUnderclaimProb).toEqual(0);
      numberOf3RedFascs = 0;
      numberOf3RedLibs = 2;
      underclaimTotal = 2;
      [BBUnderclaimProb] = defaultActionService.getFascFascBlueChanClaim(game2);
      expect(BBUnderclaimProb).toEqual(0);
    });

    it('underclaims always on deck 2 or later', () => {
      game2.deck.deckNum = 2;
      let [BBUnderclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(BBUnderclaimProb).toEqual(1);
      game2.deck.deckNum = 3;
      [BBUnderclaimProb] = defaultActionService.getFascFascBlueChanClaim(game2);
      expect(BBUnderclaimProb).toEqual(1);
    });

    //

    it('does not overclaim if more 3 red libs', () => {
      numberOf3RedLibs = 1;
      numberOf3RedFascs = 0;
      let [, RBOverclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(RBOverclaimProb).toEqual(0);
      numberOf3RedLibs = 2;
      numberOf3RedFascs = 1;
      [, RBOverclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(RBOverclaimProb).toEqual(0);
    });
    it('overclaims RB prob .5 if no count is right and <= 3 blues', () => {
      deck1BlueCount = 4;
      let [, RBOverclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(RBOverclaimProb).not.toEqual(0.5);
      deck1BlueCount = 3;
      underclaimTotal = 1;
      [, RBOverclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(RBOverclaimProb).not.toEqual(0.5);
      underclaimTotal = -1;
      [, RBOverclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(RBOverclaimProb).not.toEqual(0.5);
      underclaimTotal = 0;
      [, RBOverclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(RBOverclaimProb).toEqual(0.5);
    });

    it('overclaims RB based on factors with 1 underclaim', () => {
      underclaimTotal = 1;
      numberOf3RedFascs = 0;
      numberOf3RedLibs = 0;
      let [, RBOverclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(RBOverclaimProb).toEqual(0.7);
      numberOf3RedFascs = 3;
      numberOf3RedLibs = 2;
      [, RBOverclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(RBOverclaimProb).toEqual(0.85);
      numberOf3RedFascs = 3;
      numberOf3RedLibs = 1;
      [, RBOverclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(RBOverclaimProb).toEqual(1);
    });

    it('overclaims RB always if at least 2 underclaims', () => {
      underclaimTotal = 2;
      let [, RBOverclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(RBOverclaimProb).toEqual(1);
      underclaimTotal = 3;
      [, RBOverclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(RBOverclaimProb).toEqual(1);
    });

    it('overclaims RB always if final gov count too low', () => {
      deck1BlueCount = 4;
      defaultActionService.deck1FinalGovBlueCountTooLow = () => true;
      let [, RBOverclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(RBOverclaimProb).toEqual(1);
    });

    it('never underclaims on deck 2 or later', () => {
      game2.deck.deckNum = 2;
      let [, RBOverclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(RBOverclaimProb).toEqual(0);
      game2.deck.deckNum = 3;
      [, RBOverclaimProb] =
        defaultActionService.getFascFascBlueChanClaim(game2);
      expect(RBOverclaimProb).toEqual(0);
    });
  });

  describe('getSimplePresClaimWithLibProbs', () => {
    it('always changes the claim', () => {
      const [BBUnderclaimProb, RBOverclaimProb] =
        defaultActionService.getSimpleFascFascBlueChanClaim(game2);
      expect(BBUnderclaimProb).toEqual(1);
      expect(RBOverclaimProb).toEqual(1);
    });
  });

  describe('getPresClaimWithLibProbs', () => {
    let numberOf3RedFascs: number;
    let numberOf3RedLibs: number;
    let underclaimTotal: number;
    let blueCount: number;
    let bluesToBeginTheDeck: number;

    beforeEach(() => {
      game2.currentPres = fasc1.name;
      game2.currentChan = lib1.name;
      game2.LibPoliciesEnacted = 0;
      game2.FascPoliciesEnacted = 0;
      game2.deck.deckNum = 1;
      numberOf3RedFascs = 0;
      numberOf3RedLibs = 0;
      underclaimTotal = 0;
      blueCount = 0;
      defaultActionService.invPower = () => false;
      defaultActionService.numberOf3RedLibsOnThisDeck = () => numberOf3RedLibs;
      defaultActionService.numberOf3RedFascsOnThisDeck = () =>
        numberOf3RedFascs;
      defaultActionService.underclaimTotal = () => underclaimTotal;
      defaultActionService.blueCountOnThisDeck = () => blueCount;
      defaultActionService.bluesToBeginTheDeck = () => bluesToBeginTheDeck;
      defaultActionService.knownFascistToHitler = () => false;
      defaultActionService.knownLibToHitler = () => false;
      defaultActionService.deck1FinalGovBlueCountTooLow = () => false;
      defaultActionService.confirmedLib = () => false;
    });

    it('never overclaims RRB with lib', () => {
      const [, , , fascRRBoverclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRRBoverclaimProb).toEqual(0);
    });

    it('always underclaims BBB if more 3 red libs', () => {
      numberOf3RedFascs = 1;
      numberOf3RedLibs = 2;
      const [, fascBBBunderclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascBBBunderclaimProb).toEqual(1);
    });

    it('underclaims BBB .75 if same', () => {
      numberOf3RedFascs = 1;
      numberOf3RedLibs = 1;
      const [, fascBBBunderclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascBBBunderclaimProb).toEqual(0.75);
    });

    it('underclaims BBB 0 if more 3 red fascs', () => {
      numberOf3RedFascs = 1;
      numberOf3RedLibs = 0;
      const [, fascBBBunderclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascBBBunderclaimProb).toEqual(0);
    });

    it('never overclaims RBB if more 3 red libs', () => {
      numberOf3RedFascs = 1;
      numberOf3RedLibs = 0;
      const [, , , , fascRBBoverclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRBBoverclaimProb).toEqual(0);
    });

    it('always overclaims RBB if at least 2 underclaims', () => {
      numberOf3RedFascs = 1;
      numberOf3RedLibs = 1;
      underclaimTotal = 2;
      const [, , , , fascRBBoverclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRBBoverclaimProb).toEqual(1);
    });

    it('overclaims RBB .75 if 1 undercaim', () => {
      numberOf3RedFascs = 2;
      numberOf3RedLibs = 1;
      underclaimTotal = 1;
      const [, , , , fascRBBoverclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRBBoverclaimProb).toEqual(0.75);
    });

    it('overclaims RBB with <= 0 underclaims if final gov deck count too low underclaims according to probs', () => {
      numberOf3RedFascs = 0;
      numberOf3RedLibs = 0;
      underclaimTotal = 0;
      defaultActionService.deck1FinalGovBlueCountTooLow = () => true;
      let [, , , , fascRBBoverclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRBBoverclaimProb).toEqual(0.6);
      numberOf3RedFascs = 2;
      numberOf3RedLibs = 1;
      [, , , , fascRBBoverclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRBBoverclaimProb).toEqual(0.8);
    });

    it('overclaims RBB with <= 0 underclaims if enough cards in deck and low blue count underclaims according to probs', () => {
      numberOf3RedFascs = 0;
      numberOf3RedLibs = 0;
      underclaimTotal = 0;
      blueCount = 1;
      game2.deck.drawPileLengthBeforeDraw3 = 12;
      let [, , , , fascRBBoverclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRBBoverclaimProb).toEqual(0.25);
    });

    it('does not overclaim in any other scenario', () => {
      numberOf3RedFascs = 0;
      numberOf3RedLibs = 0;
      underclaimTotal = 0;
      blueCount = 2;
      game2.deck.drawPileLengthBeforeDraw3 = 13;
      let [, , , , fascRBBoverclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRBBoverclaimProb).toEqual(0);
    });

    it('returns the right deck 2 probs for BBB underclaim and RBB overclaim', () => {
      game2.deck.deckNum = 2;
      let [, fascBBBunderclaimProb, , , fascRBBoverclaimProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRBBoverclaimProb).toEqual(0);
      defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascBBBunderclaimProb).toEqual(1);
    });

    //
    it('returns RRBConfProb according to blues blues down', () => {
      const fascRRBconfProbs = [0.75, 0.85, 0.95, 1, 1];
      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        game2.LibPoliciesEnacted = bluesDown;
        let [fascRRBconfProb] =
          defaultActionService.getPresClaimWithLibProbs(game2);
        expect(fascRRBconfProb).toEqual(fascRRBconfProbs[bluesDown]);
      }
    });

    it('returns RRRConfProb according to blues blues down', () => {
      const fascRRRconfProbs = [0.4, 0.6, 0.8, 0.9, 1];
      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        game2.LibPoliciesEnacted = bluesDown;
        let [, , fascRRRconfProb] =
          defaultActionService.getPresClaimWithLibProbs(game2);
        expect(fascRRRconfProb).toEqual(fascRRRconfProbs[bluesDown]);
      }
    });

    it('RRRconfProb if underlcaims not more 3 red libs', () => {
      underclaimTotal = 1;
      let [, , fascRRRconfProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRRRconfProb).toEqual(0.4 + 0.25);
      underclaimTotal = 2;
      [, , fascRRRconfProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRRRconfProb).toEqual(0.4 + 0.5);
    });

    it('returns proper deck 2 RRR and RRB conf probs', () => {
      game2.deck.deckNum = 2;
      let [fascRRBconfProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRRBconfProb).toEqual(1);

      let [, , fascRRRconfProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRRRconfProb).toEqual(0.4);
      underclaimTotal = 1;
      [, , fascRRRconfProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRRRconfProb).toEqual(1);
    });

    it('returns RRBConfProb of .5 on inv regardless of blues down', () => {
      defaultActionService.invPower = () => true;
      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        game2.LibPoliciesEnacted = bluesDown;
        let [fascRRBconfProb] =
          defaultActionService.getPresClaimWithLibProbs(game2);
        expect(fascRRBconfProb).toEqual(0.5);
      }
    });

    it('returns RRRConfProb of max .5 on inv', () => {
      defaultActionService.invPower = () => true;
      for (let bluesDown = 1; bluesDown <= 4; bluesDown++) {
        game2.LibPoliciesEnacted = bluesDown;
        let [, , fascRRRconfProb] =
          defaultActionService.getPresClaimWithLibProbs(game2);
        expect(fascRRRconfProb).toEqual(0.5);
      }
      game2.LibPoliciesEnacted = 0;
      let [, , fascRRRconfProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRRRconfProb).toEqual(0.4);
      underclaimTotal = 2;
      [, , fascRRRconfProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRRRconfProb).toEqual(0.5);
    });

    it('it confs if deck1finalgov blue count too low', () => {
      defaultActionService.deck1FinalGovBlueCountTooLow = () => true;
      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        game2.LibPoliciesEnacted = bluesDown;
        let [fascRRBconfProb, , fascRRRconfProb] =
          defaultActionService.getPresClaimWithLibProbs(game2);
        expect(fascRRBconfProb).toEqual(1);
        expect(fascRRRconfProb).toEqual(1);
      }
    });

    it('returns RRBConfProb of .2 and RRRconfProb of .1 if less than 7 players or 8 players', () => {
      game2.players = players2.slice(0, 6);
      defaultActionService.invPower = () => true;
      defaultActionService.deck1FinalGovBlueCountTooLow = () => true;
      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        game2.LibPoliciesEnacted = bluesDown;
        let [fascRRBconfProb, , fascRRRconfProb] =
          defaultActionService.getPresClaimWithLibProbs(game2);
        expect(fascRRBconfProb).toEqual(0.2);
        expect(fascRRRconfProb).toEqual(0.1);
      }
      game2.players = players2.slice(0, 6);
      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        game2.LibPoliciesEnacted = bluesDown;
        let [fascRRBconfProb, , fascRRRconfProb] =
          defaultActionService.getPresClaimWithLibProbs(game2);
        expect(fascRRBconfProb).toEqual(0.2);
        expect(fascRRRconfProb).toEqual(0.1);
      }
      game2.players = players2.slice(0, 8);
      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        game2.LibPoliciesEnacted = bluesDown;
        let [fascRRBconfProb, , fascRRRconfProb] =
          defaultActionService.getPresClaimWithLibProbs(game2);
        expect(fascRRBconfProb).toEqual(0.2);
        expect(fascRRRconfProb).toEqual(0.1);
      }
    });

    it('it confs if deck1finalgov blue count too low', () => {
      defaultActionService.deck1FinalGovBlueCountTooLow = () => true;
      blueCount = 6;
      bluesToBeginTheDeck = 6;
      for (let bluesDown = 0; bluesDown <= 4; bluesDown++) {
        game2.LibPoliciesEnacted = bluesDown;
        let [fascRRBconfProb, , fascRRRconfProb] =
          defaultActionService.getPresClaimWithLibProbs(game2);
        expect(fascRRBconfProb).toEqual(0);
        expect(fascRRRconfProb).toEqual(0);
      }
    });

    //change later now that it does conf for hitler
    it('uses getHitlerBlindConfProbs if hitler and does not know they are lib', () => {
      game2.currentPres = hitler.name;
      jest.spyOn(defaultActionService, 'getHitlerBlindConfProbs');
      defaultActionService.getPresClaimWithLibProbs(game2);
      expect(defaultActionService.getHitlerBlindConfProbs).toBeCalledTimes(1);
    });

    it('does not conf if investgiated lib on RRR or RRB', () => {
      game2.invClaims.push({
        investigator: fasc1.name,
        investigatee: lib1.name,
        claim: Team.LIB,
      });
      let [fascRRBconfProb, , fascRRRconfProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRRBconfProb).toEqual(0);
      expect(fascRRRconfProb).toEqual(0);
    });

    it('does not conf if confirmed lib', () => {
      defaultActionService.confirmedLib = () => true;
      let [fascRRBconfProb, , fascRRRconfProb] =
        defaultActionService.getPresClaimWithLibProbs(game2);
      expect(fascRRBconfProb).toEqual(0);
      expect(fascRRRconfProb).toEqual(0);
    });
  });

  describe('getSimplePresClaimWithFascProbs', () => {
    it('returns 1 always for vanilla fasc', () => {
      let [
        fascRRBconfProb,
        fascBBBunderclaimProb,
        fascRRRconfProb,
        fascRRBoverclaimProb,
        fascRBBoverclaimProb,
      ] = defaultActionService.getSimplePresClaimWithLibProbs(game2);
      expect(fascRRBconfProb).toEqual(1);
      expect(fascBBBunderclaimProb).toEqual(1);
      expect(fascRRRconfProb).toEqual(1);
      expect(fascRRBoverclaimProb).toEqual(1);
      expect(fascRBBoverclaimProb).toEqual(1);
    });

    it('uses get simple hitler blind conf probs for hitler', () => {
      game2.currentPres = hitler.name;
      jest.spyOn(defaultActionService, 'getSimpleHitlerBlindConfProbs');
      defaultActionService.getSimplePresClaimWithLibProbs(game2);
      expect(
        defaultActionService.getSimpleHitlerBlindConfProbs,
      ).toBeCalledTimes(1);
    });
  });

  //
  describe('getPresClaimWithFascProbs', () => {
    let numberOf3RedFascs: number;
    let numberOf3RedLibs: number;
    let underclaimTotal: number;
    let blueCount: number;
    let bluesToBeginTheDeck: number;
    let presCards: PRES3;

    beforeEach(() => {
      game2.currentPres = fasc1.name;
      game2.currentChan = fasc2.name;
      game2.LibPoliciesEnacted = 0;
      game2.FascPoliciesEnacted = 0;
      game2.deck.deckNum = 1;
      numberOf3RedFascs = 0;
      numberOf3RedLibs = 0;
      underclaimTotal = 0;
      blueCount = 0;
      presCards = PRES3.BBB;
      defaultActionService.invPower = () => false;
      defaultActionService.numberOf3RedLibsOnThisDeck = () => numberOf3RedLibs;
      defaultActionService.numberOf3RedFascsOnThisDeck = () =>
        numberOf3RedFascs;
      defaultActionService.underclaimTotal = () => underclaimTotal;
      defaultActionService.blueCountOnThisDeck = () => blueCount;
      defaultActionService.bluesToBeginTheDeck = () => bluesToBeginTheDeck;
      defaultActionService.knownFascistToHitler = () => false;
      defaultActionService.knownLibToHitler = () => false;
      defaultActionService.deck1FinalGovBlueCountTooLow = () => false;
      defaultActionService.confirmedLib = () => false;
      defaultActionService.lib3RedOnThisDeck = () => false;
      defaultActionService.isAntiDD = () => false;
      defaultActionService.determine3Cards = () => presCards;
    });

    it('does not claim BBB if more 3 red libs on BBB', () => {
      numberOf3RedFascs = 0;
      numberOf3RedLibs = 1;
      presCards = PRES3.BBB;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(0);
    });

    it('claim BBB .25 if same number of 3 red libs and fasc on BBB', () => {
      numberOf3RedFascs = 0;
      numberOf3RedLibs = 0;
      presCards = PRES3.BBB;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(0.25);
    });

    it('claim BBB if more 3 red fasc on BBB', () => {
      numberOf3RedFascs = 1;
      numberOf3RedLibs = 0;
      presCards = PRES3.BBB;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(1);
    });

    it('does not overclaim RBB if more 3 red libs', () => {
      numberOf3RedFascs = 0;
      numberOf3RedLibs = 1;
      presCards = PRES3.RBB;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(0);
    });

    it('does overclaim RBB if 2 underclaims', () => {
      presCards = PRES3.RBB;
      underclaimTotal = 2;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(1);
    });

    it('overclaim RBB if deck1finalgovbluecounttoo low', () => {
      defaultActionService.deck1FinalGovBlueCountTooLow = () => true;
      presCards = PRES3.RBB;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(0.6);
      numberOf3RedFascs = 1;
      numberOf3RedLibs = 0;
      [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(0.8);
    });

    it('overclaim RBB .75 if 1 underclaim', () => {
      presCards = PRES3.RBB;
      underclaimTotal = 1;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(0.75);
    });

    it('overclaim RBB .25 if no underclaims and early deck and <= 1 blue', () => {
      presCards = PRES3.RBB;
      game2.deck.drawPileLengthBeforeDraw3 = 12;
      blueCount = 1;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(0.25);
    });

    it('does not overclaim in all other scenarios', () => {
      presCards = PRES3.RBB;
      underclaimTotal = 0;
      blueCount = 2;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(0);
    });

    //

    it('does not overclaim RRB if more 3 red libs', () => {
      numberOf3RedFascs = 0;
      numberOf3RedLibs = 1;
      presCards = PRES3.RRB;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(0);
    });

    it('does overclaim RRB if 3 underclaims', () => {
      presCards = PRES3.RRB;
      underclaimTotal = 3;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(1);
    });

    it('overclaim RRB if deck1finalgovbluecounttoo low', () => {
      defaultActionService.deck1FinalGovBlueCountTooLow = () => true;
      presCards = PRES3.RRB;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(0.6);
      numberOf3RedFascs = 1;
      numberOf3RedLibs = 0;
      [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(0.8);
    });

    it('overclaim RBB .75 if 2 underclaim', () => {
      presCards = PRES3.RRB;
      underclaimTotal = 2;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(0.75);
    });

    it('overclaim RRB .25 if 1 underclaim and early deck and <= 1 blue', () => {
      presCards = PRES3.RRB;
      game2.deck.drawPileLengthBeforeDraw3 = 12;
      blueCount = 1;
      underclaimTotal = 1;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(0.25);
    });

    it('does not overclaim in all other scenarios', () => {
      presCards = PRES3.RRB;
      underclaimTotal = 0;
      game2.deck.drawPileLengthBeforeDraw3 = 12;
      blueCount = 1;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(0);
    });

    it('never claims BBB on deck 2', () => {
      game2.deck.deckNum = 2;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(0);
    });

    it('does not fasc fasc conf in standard scenario', () => {
      presCards = PRES3.RRB;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0);
    });

    it('confs .95 if claiming RRR would be 3 underclaims', () => {
      underclaimTotal = 1;
      presCards = PRES3.RBB;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0.95);
      underclaimTotal = 2;
      presCards = PRES3.RRB;
      [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0.95);
    });

    it('confs .35 if claiming RRR would be 2 underclaims', () => {
      underclaimTotal = 1;
      presCards = PRES3.RRB;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0.35);
      underclaimTotal = 2;
      presCards = PRES3.RRR;
      [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0.35);
      underclaimTotal = 0;
      presCards = PRES3.RBB;
      [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0.35);
    });

    it('does not conf hitler chan in cucu', () => {
      defaultActionService.isCucu = () => true;
      game2.currentChan = hitler.name;
      underclaimTotal = 2;
      presCards = PRES3.RBB;
      let [fascFascConfProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0);
    });

    it('confs .95 in cucu RRR would be 2 underclaims', () => {
      defaultActionService.isCucu = () => true;
      underclaimTotal = 2;
      presCards = PRES3.RRR;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0.95);
      underclaimTotal = 1;
      presCards = PRES3.RRB;
      [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0.95);
      underclaimTotal = 0;
      presCards = PRES3.RBB;
      [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0.95);
    });

    it('confs .95 in cucu if deck1 finalbluecount too low', () => {
      defaultActionService.isCucu = () => true;
      defaultActionService.deck1FinalGovBlueCountTooLow = () => true;
      underclaimTotal = 0;
      presCards = PRES3.RRB;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0.95);
    });

    it('confs .4 in cucu if claiming RRR would be 1 underclaims', () => {
      defaultActionService.isCucu = () => true;
      underclaimTotal = 1;
      presCards = PRES3.RRR;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0.4);
      underclaimTotal = 0;
      presCards = PRES3.RRB;
      [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0.4);
    });

    it('does not conf if antiDD', () => {
      defaultActionService.isAntiDD = () => true;
      underclaimTotal = 2;
      presCards = PRES3.RBB;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0);
    });

    it('does not conf if shoot', () => {
      game2.FascPoliciesEnacted = 4;
      underclaimTotal = 2;
      presCards = PRES3.RBB;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0);
    });

    it('does not conf if blues already claimed', () => {
      blueCount = 6;
      bluesToBeginTheDeck = 6;
      underclaimTotal = 2;
      presCards = PRES3.RBB;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0);
    });

    it('calls hitler blind conf probs for hitler pres and not known fasc', () => {
      game2.currentPres = hitler.name;
      jest.spyOn(defaultActionService, 'getHitlerBlindConfProbs');
      presCards = PRES3.RBB;
      defaultActionService.getPresClaimWithFascProbs(game2);
      expect(defaultActionService.getHitlerBlindConfProbs).toBeCalledTimes(1);
    });

    it('does not conf a player you inved lib', () => {
      game2.invClaims = [
        {
          investigator: fasc1.name,
          investigatee: fasc2.name,
          claim: Team.LIB,
        },
      ];
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getPresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0);
    });
  });

  describe('getSimplePresClaimWithFascProbs', () => {
    it('always changes the claim on BB chan claim', () => {
      defaultActionService.determine3Cards = () => PRES3.RBB;
      let [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getSimplePresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(1);
      defaultActionService.determine3Cards = () => PRES3.BBB;
      [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getSimplePresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(0);
      defaultActionService.determine3Cards = () => PRES3.RRB;
      [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getSimplePresClaimWithFascProbs(game2);
      expect(BBBfromBBclaimProb).toEqual(0);
    });

    it('never confs another fasc', () => {
      defaultActionService.determine3Cards = () => PRES3.RBB;
      game2.currentPres = fasc1.name;
      const [fascFascConfProb, BBBfromBBclaimProb] =
        defaultActionService.getSimplePresClaimWithFascProbs(game2);
      expect(fascFascConfProb).toEqual(0);
    });

    it('calls getSipmleHitlerBlindConfProbs for hitler', () => {
      defaultActionService.determine3Cards = () => PRES3.RBB;
      game2.currentPres = hitler.name;
      defaultActionService.knownFascistToHitler = () => false;
      jest.spyOn(defaultActionService, 'getSimpleHitlerBlindConfProbs');
      defaultActionService.getSimplePresClaimWithFascProbs(game2);
      expect(
        defaultActionService.getSimpleHitlerBlindConfProbs,
      ).toBeCalledTimes(1);
    });
  });
});
