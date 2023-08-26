import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { RepositoryModule } from './repository/repository.module';

@Module({
  imports: [GameModule, RepositoryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
