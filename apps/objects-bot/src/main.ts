import { NestFactory } from '@nestjs/core';
import { ObjectsBotModule } from './objects-bot.module';

async function bootstrap() {
  const app = await NestFactory.create(ObjectsBotModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
