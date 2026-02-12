import { Global, Module } from '@nestjs/common';

import { HiveClient } from './hive-client';

@Global()
@Module({
  providers: [HiveClient],
  exports: [HiveClient],
})
export class HiveClientModule {}
