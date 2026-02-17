import { Module } from '@nestjs/common';
import { AppRepository } from './app.repository';
import { ObjectRepository } from './object.repository';
import { FieldVoteRepository } from './field-vote.repository';
import { WaivStakeRepository } from './waiv-stake.repository';

@Module({
  providers: [
    AppRepository,
    ObjectRepository,
    FieldVoteRepository,
    WaivStakeRepository,
  ],
  exports: [
    AppRepository,
    ObjectRepository,
    FieldVoteRepository,
    WaivStakeRepository,
  ],
})
export class RepositoriesModule {}
