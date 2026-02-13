import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HiveMainParser } from './hive-main-parser';
import { HiveCustomJsonParserModule } from './hive-custom-json-parser.module';
import { HiveProcessorModule } from '@waivio-core/processors';

@Module({
  imports: [
    HiveCustomJsonParserModule,
    HiveProcessorModule.forRootAsync({
      imports: [HiveCustomJsonParserModule],
      useFactory: (config: ConfigService) => ({
        blockNumberKey: config.get<string>(
          'hive.blockNumberKey',
          'hiveParser:blockNumber',
        ),
        startBlockNumber: config.get<number>(
          'hive.startBlockNumber',
          102138605,
        ),
        redisDb: 2,
      }),
      inject: [ConfigService],
      blockParser: HiveMainParser,
    }),
  ],
})
export class HiveParserModule {}
