import { Module } from '@nestjs/common';
import { AppRepository } from './app.repository';

@Module({
  providers: [AppRepository],
  exports: [AppRepository],
})
export class RepositoriesModule {}
