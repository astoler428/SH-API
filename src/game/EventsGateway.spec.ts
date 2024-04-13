import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsGateway } from './events.gateway';
import { Socket } from 'socket.io';
import { GameMockFactory } from '../test/GameMockFactory';
import { PlayerMockFactory } from '../test/PlayerMockFactory';
import { GameType, Status } from '../consts';
import { Game } from '../models/game.model';
import {
  JOIN_GAME,
  LEAVE_GAME,
  START_GAME,
  UPDATE_GAME,
} from '../consts/socketEventNames';
import { GameService } from './game.service';
import { io } from 'socket.io-client';
import { Player } from 'src/models/player.model';
import { LogicService } from './logic.service';
import { GameRepository } from './game.repository';
import { DefaultActionService } from './defaultAction.service';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { UtilService } from './util.service';

describe('EventsGateway', () => {
  let eventEmitter: EventEmitter2;
  let eventsGateway: EventsGateway;
  let gameService: GameService;
  let socket: any;
  let game: Game;
  let player: Player;
  let id: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register({
          isGlobal: true,
          store: redisStore as any,
          host: 'localhost',
          port: 6379,
        }),
      ],
      providers: [
        EventsGateway,
        EventEmitter2,
        GameService,
        LogicService,
        GameRepository,
        DefaultActionService,
        UtilService,
      ],
    }).compile();

    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    eventsGateway = module.get<EventsGateway>(EventsGateway);
    gameService = module.get<GameService>(GameService);
    socket = io('http://localhost:4000');
    id = 'testGameId';
    eventsGateway.joinGame({ socketId: socket.id, id });
  });

  afterEach(async () => {
    socket.disconnect();
  });

  describe('handleConnection', () => {
    beforeEach(async () => {
      eventsGateway.handleConnection(socket);
    });

    it('adds socket to socketMap', async () => {
      expect(eventsGateway.socketMap.size).toEqual(1);
      expect(eventsGateway.socketMap.get(socket.id)).toEqual(socket);
    });
  });

  describe('joinGame', () => {
    it('adds item to socketGameIdMap', () => {
      expect(eventsGateway.socketGameIdMap.size).toEqual(1);
      expect(eventsGateway.socketGameIdMap.get(socket.id)).toEqual(id);
    });
  });

  describe('leaveGame', () => {
    it('removes item from socketGameIdMap', () => {
      eventsGateway.leaveGame(socket.id);
      expect(eventsGateway.socketGameIdMap.size).toEqual(0);
    });
  });

  describe('handleDisconnection', () => {
    it('delete socket from socket map', async () => {
      const mockLeaveGame = jest
        .spyOn(gameService, 'leaveGame')
        .mockImplementation(async () => {});
      expect(eventsGateway.socketGameIdMap.size).toEqual(1);
      const gameId = await eventsGateway.handleDisconnect(socket);
      expect(gameId).toBe(id);
      expect(eventsGateway.socketMap.size).toEqual(0);
      expect(mockLeaveGame).toBeCalled();
    });
  });
});
