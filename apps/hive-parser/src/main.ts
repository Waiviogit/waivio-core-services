import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  process.on('SIGINT', () => {
    void app.close().then(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    void app.close().then(() => process.exit(0));
  });
}

void bootstrap();
