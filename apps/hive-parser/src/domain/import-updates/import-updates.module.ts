import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImportUpdatesService } from './import-updates.service';

@Module({
  imports: [ConfigModule],
  providers: [ImportUpdatesService],
  exports: [ImportUpdatesService],
})
export class ImportUpdatesModule {}
