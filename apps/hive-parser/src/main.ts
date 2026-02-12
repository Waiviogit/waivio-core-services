import { NestFactory } from '@nestjs/core';
import { HiveParserModule } from './domain/hive-parser/hive-parser.module';

async function bootstrap() {
  const hiveParser = await NestFactory.createApplicationContext(
    HiveParserModule,
    {
      logger: ['log', 'error', 'warn'],
    },
  );

  process.on('SIGINT', async () => {
    await hiveParser.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await hiveParser.close();
    process.exit(0);
  });
}

bootstrap();
