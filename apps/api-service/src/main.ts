import { NestFactory } from '@nestjs/core';
import { ApiServiceModule } from './api-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
