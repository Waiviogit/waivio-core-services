import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HiveProcessorService } from './hive-processor.service';

import hiveParserConfig from '../../config/hive-parser.config';
import { validateHiveParser } from '../../config/env.validation';
import { CacheModule } from '../cache-module/cache.module';
import { HiveMainParser } from './hive-main-parser';
import { HiveClientModule } from '../../infrastructure/clients/hive-client/hive.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [hiveParserConfig],
      validate: validateHiveParser,
    }),
    HiveClientModule,
    CacheModule,
  ],
  providers: [HiveProcessorService, HiveMainParser],
})
export class HiveParserModule {}
