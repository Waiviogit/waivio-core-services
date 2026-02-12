import { Controller, Get } from '@nestjs/common';
import { ObjectsBotService } from './objects-bot.service';

@Controller()
export class ObjectsBotController {
  constructor(private readonly objectsBotService: ObjectsBotService) {}

  @Get()
  getHello(): string {
    return this.objectsBotService.getHello();
  }
}
