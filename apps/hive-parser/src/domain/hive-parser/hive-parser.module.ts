import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import hiveParserConfig from '../../config/hive-parser.config';
import { validateHiveParser } from '../../config/env.validation';
import { HiveMainParser } from './hive-main-parser';
import {
  RedisClientModule,
  HiveClientModule,
} from '@waivio-core/clients';
import { HiveProcessorModule } from '@waivio-core/processors';
import { HIVE_RPC_NODES } from '../../constants/hive-parser';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [hiveParserConfig],
      validate: validateHiveParser,
    }),
    RedisClientModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('redis.uri') ?? '',
      }),
      inject: [ConfigService],
    }),
    HiveClientModule.forRoot({
      nodes: HIVE_RPC_NODES,
    }),
    HiveProcessorModule.forRootAsync({
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
