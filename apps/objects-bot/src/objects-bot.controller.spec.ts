import { Test, TestingModule } from '@nestjs/testing';
import { ObjectsBotController } from './objects-bot.controller';
import { ObjectsBotService } from './objects-bot.service';

describe('ObjectsBotController', () => {
  let objectsBotController: ObjectsBotController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ObjectsBotController],
      providers: [ObjectsBotService],
    }).compile();

    objectsBotController = app.get<ObjectsBotController>(ObjectsBotController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(objectsBotController.getHello()).toBe('Hello World!');
    });
  });
});
