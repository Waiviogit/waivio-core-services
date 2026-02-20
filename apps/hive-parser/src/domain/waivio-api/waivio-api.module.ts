import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ListItemProcessService } from './list-item-process.service';

@Module({
  imports: [ConfigModule],
  providers: [ListItemProcessService],
  exports: [ListItemProcessService],
})
export class WaivioApiModule {}
