import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { RepositoryModule } from './repository/repository.module';
import { EventsModule } from './events/events.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SampleModule } from './sample/sample.module';
import { typeOrmConfig } from './typeorm.config';

@Module({
  imports: [GameModule,
    RepositoryModule,
    EventsModule,
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot(typeOrmConfig),
    SampleModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
