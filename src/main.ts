import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GameRepository } from './game/game.repository';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //, { cors: true }
  app.enableCors({
    // origin: [
    //   'https://blind-sh.netlify.app',
    //   'https://blind-sh-staging.netlify.app',
    // ],
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST'],
  });

  const gameRespository = app.get(GameRepository);
  await gameRespository.connect();
  await app.listen(4000);
}
bootstrap();
