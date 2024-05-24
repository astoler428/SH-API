import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { GameService } from './game.service';
import { Socket } from 'socket.io';
import {
  CHAN2,
  GameSettings,
  GameType,
  PRES3,
  Role,
  Status,
  Team,
  Vote,
} from '../consts';
import { Card } from 'src/models/card.model';

class CreateGameDTO {
  constructor(
    public name: string,
    public socketId: string,
  ) {}
}

class JoinGameDTO {
  constructor(
    public name: string,
    public socketId: string,
  ) {}
}

class LeaveGameDTO {
  constructor(
    public socketId: string,
    public enteringGame: boolean,
  ) {}
}

class VoteDTO {
  constructor(
    public name: string,
    public vote: Vote,
  ) {}
}

@Controller('game')
export class GameController {
  public acceptingRequests: boolean = true;
  public canChangeMap: Map<string, boolean> = new Map();

  constructor(private gameService: GameService) {}

  @Post('/')
  async create(@Body() body: CreateGameDTO) {
    const id = await this.gameService.createGame(body.name, body.socketId);
    return id;
  }

  @Post('/existingGames')
  async getExistingGames() {
    return this.gameService.getExistingGames();
  }

  @Post('/join/:id')
  async join(@Param('id') id: string, @Body() body: JoinGameDTO) {
    return this.gameService.joinGame(id, body.name, body.socketId);
  }

  @Post('/leave/:id')
  async leave(@Param('id') id: string, @Body() body: LeaveGameDTO) {
    if (!body.enteringGame) {
      return this.gameService.leaveGame(id, body.socketId);
    }
    return;
  }

  @Post('/settings/:id')
  setGameSettings(
    @Param('id') id: string,
    @Body() body: { gameSettings: GameSettings },
  ) {
    return this.gameService.setGameSettings(id, body.gameSettings);
  }

  @Post('/start/:id')
  async startGame(@Param('id') id: string) {
    return this.gameService.startGame(id);
  }

  @Post('/chooseChan/:id')
  async chooseChan(
    @Param('id') id: string,
    @Body() body: { chanName: string },
  ) {
    const res = await this.gameService.chooseChan(id, body.chanName);
    return res;
  }

  @Post('/vote/:id')
  async vote(@Param('id') id: string, @Body() body: VoteDTO) {
    return this.gameService.vote(id, body.name, body.vote);
    // if (!this.acceptingRequests) {
    //   throw new BadRequestException(`Voting locked`);
    // }
    // this.acceptingRequests = false;
    // this.allowRequests();
    // return res;
  }

  @Post('/voteResult/:id')
  async voteResult(@Param('id') id: string) {
    if (!this.acceptingRequests) {
      return;
    }
    this.acceptingRequests = false;
    const res = await this.gameService.determineResultOfVote(id);
    this.allowRequests();
    return res;
  }

  @Post('/presDiscard/:id')
  async presDiscard(
    @Param('id') id: string,
    @Body() body: { cardColor: string },
  ) {
    const res = await this.gameService.presDiscard(id, body.cardColor);
    return res;
  }

  @Post('/chanPlay/:id')
  async chanPlay(@Param('id') id: string, @Body() body: { cardColor: string }) {
    const res = await this.gameService.chanPlay(id, body.cardColor);
    return res;
  }

  @Post('/chanClaim/:id')
  async chanClaim(@Param('id') id: string, @Body() body: { claim: CHAN2 }) {
    const res = await this.gameService.chanClaim(id, body.claim);
    return res;
  }

  @Post('/presClaim/:id')
  async presClaim(@Param('id') id: string, @Body() body: { claim: PRES3 }) {
    const res = await this.gameService.presClaim(id, body.claim);
    return res;
  }

  @Post('/chooseInv/:id')
  async chooseInv(@Param('id') id: string, @Body() body: { invName: string }) {
    const res = await this.gameService.chooseInv(id, body.invName);
    return res;
  }

  @Post('/invClaim/:id')
  async invClaim(@Param('id') id: string, @Body() body: { claim: Team }) {
    const res = await this.gameService.invClaim(id, body.claim);
    return res;
  }

  @Post('/chooseSE/:id')
  async chooseSE(@Param('id') id: string, @Body() body: { seName: string }) {
    const res = await this.gameService.chooseSE(id, body.seName);
    return res;
  }

  @Post('/chooseGun/:id')
  async chooseGun(@Param('id') id: string, @Body() body: { shotName: string }) {
    const res = await this.gameService.chooseGun(id, body.shotName);
    return res;
  }

  @Post('/chooseLibSpy/:id')
  async chooseLibSpy(
    @Param('id') id: string,
    @Body() body: { spyName: string },
  ) {
    const res = this.gameService.chooseLibSpy(id, body.spyName);
    return res;
  }

  @Post('/libSpyResult/:id')
  async libSpyResult(
    @Param('id') id: string,
    @Body() body: { spyName: string },
  ) {
    if (!this.acceptingRequests) {
      return;
    }
    this.acceptingRequests = false;
    const res = await this.gameService.determineResultOfLibSpyGuess(
      id,
      body.spyName,
    );
    this.allowRequests();
    return res;
  }

  @Post('/inspect3Claim/:id')
  async inspect3Claim(@Param('id') id: string, @Body() body: { claim: PRES3 }) {
    const res = await this.gameService.inspect3Claim(id, body.claim);
    return res;
  }

  @Post('/vetoRequest/:id')
  async vetoRequest(@Param('id') id: string) {
    const res = await this.gameService.vetoRequest(id);
    return res;
  }

  @Post('/vetoReply/:id')
  async vetoReply(
    @Param('id') id: string,
    @Body() body: { vetoAccepted: boolean },
  ) {
    const res = await this.gameService.vetoReply(id, body.vetoAccepted);
    return res;
  }

  //blind controllers

  @Post(`/confirmFasc/:id`)
  async confirmFasc(@Param('id') id: string, @Body() body: { name: string }) {
    if (this.canChangeMap.get(id) === false) {
      return;
    }
    this.canChangeMap.set(id, false);
    const res = await this.gameService.confirmFasc(id, body.name);
    setTimeout(() => {
      this.canChangeMap.set(id, true);
    }, 500);
    return res;
  }

  @Post(`/default/${Status.PRES_DISCARD}/:id`)
  async defaultPresDiscard(@Param('id') id: string) {
    const res = await this.gameService.defaultPresDiscard(id);
    return res;
  }

  @Post(`/default/${Status.CHAN_PLAY}/:id`)
  async defaultChanPlay(@Param('id') id: string) {
    const res = await this.gameService.defaultChanPlay(id);
    return res;
  }

  @Post(`/default/${Status.CHAN_CLAIM}/:id`)
  async defaultChanClaim(@Param('id') id: string) {
    const res = await this.gameService.defaultChanClaim(id);
    return res;
  }

  @Post(`/default/${Status.PRES_CLAIM}/:id`)
  async defaultPresClaim(@Param('id') id: string) {
    const res = await this.gameService.defaultPresClaim(id);
    return res;
  }

  @Post(`/default/${Status.INV_CLAIM}/:id`)
  async defaultInvClaim(@Param('id') id: string) {
    const res = await this.gameService.defaultInvClaim(id);
    return res;
  }

  @Post(`/default/${Status.INSPECT_TOP3}/:id`)
  async defaultInspect3Claim(@Param('id') id: string) {
    const res = this.gameService.defaultInspect3Claim(id);
    return res;
  }

  //confusing but this is actually for the reply, the veto request comes in through chan_play
  @Post(`/default/${Status.VETO_REPLY}/:id`)
  async defaultVetoReply(@Param('id') id: string) {
    const res = await this.gameService.defaultVetoReply(id);
    return res;
  }

  @Post('/remake/:id')
  async remakeGame(@Param('id') id: string, @Body() body: { name: string }) {
    const newId = this.gameService.remakeGame(id, body.name);
    return newId;
  }

  allowRequests(delay = 500) {
    setTimeout(() => (this.acceptingRequests = true), delay);
  }
}
