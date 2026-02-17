import { Module } from '@nestjs/common';

import { HiveMainParser } from './hive-main-parser';
import { HiveCustomJsonParserModule } from './hive-custom-json-parser.module';
import { BLOCK_PARSER } from '@waivio-core-services/processors';

@Module({
  imports: [HiveCustomJsonParserModule],
  providers: [
    HiveMainParser,
    { provide: BLOCK_PARSER, useExisting: HiveMainParser },
  ],
  exports: [BLOCK_PARSER],
})
export class HiveParserProvidersModule {}
