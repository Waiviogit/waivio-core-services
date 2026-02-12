import { Global, Module } from '@nestjs/common';
import { RedisClientFactory } from './redis-client';
import { UrlRotationService } from './url-rotation.service';

@Global()
@Module({
  providers: [RedisClientFactory, UrlRotationService],
  exports: [RedisClientFactory, UrlRotationService],
})
export class RedisClientModule {}
