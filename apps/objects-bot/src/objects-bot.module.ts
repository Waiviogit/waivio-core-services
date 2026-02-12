import { Module } from '@nestjs/common';
import { ObjectsBotController } from './objects-bot.controller';
import { ObjectsBotService } from './objects-bot.service';

@Module({
  imports: [],
  controllers: [ObjectsBotController],
  providers: [ObjectsBotService],
})
export class ObjectsBotModule {}
