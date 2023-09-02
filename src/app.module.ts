import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { RepositoryModule } from './repository/repository.module';
import { EventsModule } from './events/events.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [GameModule, RepositoryModule, EventsModule, EventEmitterModule.forRoot()],
  controllers: [],
  providers: [],
})
export class AppModule {}
