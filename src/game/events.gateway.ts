import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  JOIN_GAME,
  UPDATE_GAME,
  UPDATE,
  LEAVE_GAME,
  EXISTING_GAMES,
} from '../consts/socketEventNames';
import { Socket } from 'socket.io';
import { Game } from 'src/models/game.model';
import { OnEvent } from '@nestjs/event-emitter';
import { GameService } from './game.service';
import { Server } from 'socket.io';
import { Inject, forwardRef } from '@nestjs/common';
import { GameRepository } from './game.repository';

class JoinGameDTO {
  constructor(
    public socketId: string,
    public id: string,
  ) {}
}

class ChatMessageDTO {
  constructor(
    public id: string,
    public name: string,
    public message: string,
  ) {}
}

@WebSocketGateway({
  cors: true,
  // origin: [
  //   'https://blind-sh.netlify.app',
  //   'https://blind-sh-staging.netlify.app',
  // ],
  origin: 'http://localhost:3001',
  transports: ['websocket', 'polling'],
  pingInterval: 60000,
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;
  public socketMap: Map<string, Socket> = new Map();
  public socketGameIdMap: Map<string, string> = new Map(); //socketid to id of game they are in

  constructor(
    @Inject(forwardRef(() => GameService))
    private gameService: GameService,
    private gameRepository: GameRepository,
  ) {}

  handleConnection(socket: Socket) {
    this.socketMap.set(socket.id, socket);
  }

  async handleDisconnect(socket: Socket) {
    this.socketMap.delete(socket.id);
    const id = this.socketGameIdMap.get(socket.id);
    if (id) {
      try {
        await this.gameService.leaveGame(id, socket.id);
      } catch (error) {
        console.error(error);
      }
    }
    return id;
  }

  @OnEvent(JOIN_GAME)
  joinGame(body: JoinGameDTO) {
    this.socketGameIdMap.set(body.socketId, body.id);
  }

  @OnEvent(LEAVE_GAME)
  leaveGame(socketId: string) {
    this.socketGameIdMap.delete(socketId);
  }

  @OnEvent(UPDATE_GAME)
  sendUpdate(game: Game) {
    for (const player of game.players) {
      const socket = this.socketMap.get(player.socketId);
      socket?.emit(UPDATE, game);
    }
  }

  @OnEvent(EXISTING_GAMES)
  async updateExistingGames() {
    const allGameIds = await this.gameRepository.getAllGameIds();
    this.server.emit(EXISTING_GAMES, allGameIds);
  }
  confirmInGame(socketId: string) {
    for (const [socketID, socket] of this.server.sockets.sockets) {
      // console.log(socketId, socketID);
      if (socketId === socketID) {
        return true;
      }
    }
    return false;
  }

  @SubscribeMessage('chat')
  async chatMessage(@MessageBody() body: ChatMessageDTO) {
    await this.gameService.chatMessage(body.id, body.name, body.message);
  }
}
