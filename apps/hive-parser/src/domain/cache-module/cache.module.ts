import { Module } from '@nestjs/common';
import { HiveParserCacheService } from './hive-parser-cache.service';

@Module({
  providers: [HiveParserCacheService],
  exports: [HiveParserCacheService],
})
export class CacheModule {}
