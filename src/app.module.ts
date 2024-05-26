import { Module } from '@nestjs/common';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { GameModule } from './game/game.module';
import { RepositoryModule } from './repository/repository.module';
import { EventsModule } from './events/events.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    GameModule,
    RepositoryModule,
    EventsModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
