import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { GameModule } from './game/game.module';
import { RepositoryModule } from './repository/repository.module';
import { EventsModule } from './events/events.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as redisStore from 'cache-manager-redis-store'

@Module({
  imports: [GameModule,
    RepositoryModule,
    EventsModule,
    EventEmitterModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
      store: redisStore as any,
      host: 'localhost',
      port: 6379
    })
   ],
  controllers: [],
  providers: [],
})
export class AppModule {}
