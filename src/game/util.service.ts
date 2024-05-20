import { BadRequestException, Injectable } from '@nestjs/common';
import { Game } from '../models/game.model';
import { GameRepository } from './game.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EXISTING_GAMES, UPDATE_GAME } from '../consts/socketEventNames';
import { getFormattedDate } from '../helperFunctions';
import { LogChatMessage } from 'src/models/logChatMessage.model';
import { LogType } from 'src/consts';

@Injectable()
export class UtilService {
  constructor(
    private gameRespository: GameRepository,
    private eventEmitter: EventEmitter2,
  ) {}

  async findById(id: string): Promise<Game> {
    const game = await this.gameRespository.get(id);
    if (!game) {
      throw new BadRequestException(`No game found with ID ${id}`);
    }
    return game;
  }

  async handleUpdate(id: string, game: Game) {
    await this.gameRespository.update(id, game);
    this.eventEmitter.emit(UPDATE_GAME, game);
  }

  async updateExistingGames() {
    this.eventEmitter.emit(EXISTING_GAMES);
  }

  async addToLog(
    id: string,
    timeout: number,
    logMessagesWithoutDate: { type: LogType; payload?: object }[],
  ) {
    setTimeout(async () => {
      const game = await this.findById(id);
      logMessagesWithoutDate.forEach((logMessageWithoutDate) =>
        game.log.push({ ...logMessageWithoutDate, date: getFormattedDate() }),
      );
      await this.handleUpdate(id, game);
    }, timeout);
  }
}
