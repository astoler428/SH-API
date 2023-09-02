import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway,OnGatewayConnection } from "@nestjs/websockets";
import { JOIN_GAME, UPDATE_GAME, UPDATE, UPDATE_PLAYERS, START_GAME, LEAVE_GAME } from "src/consts/socketEventNames";
import { Socket } from "socket.io";
import { Game } from "src/models/game.model";
import { OnEvent } from "@nestjs/event-emitter";
import { GameService } from "./game.service";

@WebSocketGateway({
  cors: true,
  transports: ["websocket", "polling"],
})
export class EventsGateway{
  private socketMap: Map<string, Socket> = new Map()
  private socketGameIdMap: Map<string, string> = new Map() //socketid to id of game they are in

  constructor(private gameService: GameService){}


  handleConnection(socket: Socket) {
    this.socketMap.set(socket.id, socket);
  }

  handleDisconnect(socket: Socket) {
    console.log('disconnected')
    this.socketMap.delete(socket.id);
    const id = this.socketGameIdMap.get(socket.id)
    if(id){
      this.gameService.leaveGame(id, socket.id)
    }
  }

  // @SubscribeMessage(LEAVE_GAME)
  // handleLeaveGame(@MessageBody('socketId') socketId: string, @MessageBody('id') id: string, @MessageBody('enteringGame') enteringGame: boolean){
  //   if(enteringGame){
  //     return
  //   }
  //   this.leaveGame(socketId)
  // }



  // @SubscribeMessage(JOIN_GAME)
  // handleJoinGame(@MessageBody('socketId') socketId: string, @MessageBody('name') name: string, @MessageBody('id') id: string){


  // }

  @OnEvent(JOIN_GAME)
  handleJoinGame({socketId, id}: {socketId: string, id: string}){
    this.socketGameIdMap.set(socketId, id)
    for (const [key, value] of this.socketGameIdMap) {
      console.log(`Key: ${key} Value: ${value}`);
    }
  }

  @OnEvent(LEAVE_GAME)
  leaveGame(socketId: string){
    this.socketGameIdMap.delete(socketId)

    for (const [key, value] of this.socketGameIdMap) {
      console.log(`Key: ${key} Value: ${value}`);
    }
  }

  @OnEvent(UPDATE_GAME)
  sendUpdate(game: Game){
    for (const player of game.players) {
      const socket = this.socketMap.get(player.socketId)
      socket?.emit(UPDATE, game);
    }
  }

  // @OnEvent(UPDATE_PLAYERS)
  // updatePlayers(game: Game){
  //   for (const player of game.players) {
  //     const socket = this.socketMap.get(player.socketId)
  //     socket?.emit(UPDATE_PLAYERS, game);
  //   }
  // }

  // @OnEvent(START_GAME)
  // startGame(game: Game){
  //   for (const player of game.players) {
  //     const socket = this.socketMap.get(player.socketId)
  //     socket?.emit(START_GAME, game);
  //   }
  // }
}

