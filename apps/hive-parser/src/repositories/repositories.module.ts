import { Module } from '@nestjs/common';
import { AppRepository } from './app.repository';
import { ObjectRepository } from './object.repository';

@Module({
  providers: [AppRepository, ObjectRepository],
  exports: [AppRepository, ObjectRepository],
})
export class RepositoriesModule {}
