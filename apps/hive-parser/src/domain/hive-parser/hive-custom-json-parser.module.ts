import { Module } from '@nestjs/common';
import { UtilsModule } from '@waivio-core-services/common';
import { HiveCustomJsonParser } from './hive-custom-json-parser';
import { ObjectHandlerModule } from '../object-handler';
import { RepositoriesModule } from '../../repositories';

@Module({
  imports: [UtilsModule, ObjectHandlerModule, RepositoriesModule],
  providers: [HiveCustomJsonParser],
  exports: [HiveCustomJsonParser],
})
export class HiveCustomJsonParserModule {}
