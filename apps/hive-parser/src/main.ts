import { NestFactory } from '@nestjs/core';
import { HiveParserModule } from './domain/hive-parser/hive-parser.module';

async function bootstrap() {
  const hiveParser = await NestFactory.createApplicationContext(
    HiveParserModule,
    {
      logger: ['log', 'error', 'warn'],
    },
  );

  process.on('SIGINT', () => {
    void hiveParser.close().then(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    void hiveParser.close().then(() => process.exit(0));
  });
}

void bootstrap();
