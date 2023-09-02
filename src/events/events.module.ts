import { Module } from '@nestjs/common';
import { EventsGateway } from '../game/events.gateway';
import { EventsService } from './events.service';

@Module({
  providers: []
})
export class EventsModule {}
