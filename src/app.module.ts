import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { RepositoryModule } from './repository/repository.module';
import { EventsModule } from './events/events.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from 'nestjs-redis';

@Module({
  imports: [GameModule, EventsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
