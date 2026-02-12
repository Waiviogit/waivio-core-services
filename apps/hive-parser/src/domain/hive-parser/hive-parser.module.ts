import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HiveProcessorService } from './hive-processor.service';
import hiveParserConfig from '../../config/hive-parser.config';
import { validateHiveParser } from '../../config/env.validation';
import { CacheModule } from '../cache-module/cache.module';
import { HiveMainParser } from './hive-main-parser';
import {
  RedisClientModule,
  HiveClientModule,
} from '@waivio-core/clients';
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
    CacheModule,
  ],
  providers: [HiveProcessorService, HiveMainParser],
})
export class HiveParserModule {}
