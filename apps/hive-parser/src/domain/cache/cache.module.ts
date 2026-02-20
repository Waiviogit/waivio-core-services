import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './cache.service';

@Module({
  imports: [ConfigModule],
  // RedisClientModule is global, so RedisClientFactory is available without explicit import
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
