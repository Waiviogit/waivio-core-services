import { Module } from '@nestjs/common';
import { HiveCustomJsonParser } from './hive-custom-json-parser';

@Module({
  providers: [HiveCustomJsonParser],
  exports: [HiveCustomJsonParser],
})
export class HiveCustomJsonParserModule {}
