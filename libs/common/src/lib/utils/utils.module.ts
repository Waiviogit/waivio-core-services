import { Module } from '@nestjs/common';
import { JsonHelper } from './json-helper';

@Module({
  providers: [JsonHelper],
  exports: [JsonHelper],
})
export class UtilsModule {}
