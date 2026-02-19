import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';

@Module({
  // RedisClientModule is global, so RedisClientFactory is available without explicit import
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
