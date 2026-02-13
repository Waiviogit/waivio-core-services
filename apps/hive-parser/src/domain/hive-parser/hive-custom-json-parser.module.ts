import { Module } from '@nestjs/common';
import { UtilsModule } from '@waivio-core/common';
import { HiveCustomJsonParser } from './hive-custom-json-parser';

@Module({
  imports: [UtilsModule],
  providers: [HiveCustomJsonParser],
  exports: [HiveCustomJsonParser],
})
export class HiveCustomJsonParserModule {}
