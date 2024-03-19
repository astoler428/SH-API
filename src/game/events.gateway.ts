import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
} from '@nestjs/websockets';
import {
  JOIN_GAME,
  UPDATE_GAME,
  UPDATE,
  UPDATE_PLAYERS,
  START_GAME,
  LEAVE_GAME,
  DISPLAY,
} from '../consts/socketEventNames';
import { Socket } from 'socket.io';
import { Game } from 'src/models/game.model';
import { OnEvent } from '@nestjs/event-emitter';
import { GameService } from './game.service';
import { DisplayType } from 'src/consts';

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
  // origin: 'https://blind-sh.netlify.app',
  origin: 'http://localhost:3001',
  transports: ['websocket', 'polling'],
})
export class EventsGateway {
  public socketMap: Map<string, Socket> = new Map();
  public socketGameIdMap: Map<string, string> = new Map(); //socketid to id of game they are in

  constructor(private gameService: GameService) {}

  handleConnection(socket: Socket) {
    this.socketMap.set(socket.id, socket);
  }

  async handleDisconnect(socket: Socket) {
    this.socketMap.delete(socket.id);
    const id = this.socketGameIdMap.get(socket.id);
    if (id) {
      await this.gameService.leaveGame(id, socket.id);
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
      socket?.emit(UPDATE, game, { test: '123' });
    }
  }

  // @OnEvent(DISPLAY)
  // sendDisplayUpdate(game: Game, displayType: DisplayType){
  //   for (const player of game.players) {
  //     const socket = this.socketMap.get(player.socketId)
  //     socket?.emit(displayType, game);
  //   }
  // }

  @SubscribeMessage('chat')
  async chatMessage(@MessageBody() body: ChatMessageDTO) {
    await this.gameService.chatMessage(body.id, body.name, body.message);
  }
}
