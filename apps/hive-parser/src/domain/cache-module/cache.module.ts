import { Module } from '@nestjs/common';
import { HiveParserCacheService } from './hive-parser-cache.service';
import { RedisClientModule } from '../../infrastructure/clients/redis-client';

@Module({
  imports: [RedisClientModule],
  providers: [HiveParserCacheService],
  exports: [HiveParserCacheService],
})
export class CacheModule {}
