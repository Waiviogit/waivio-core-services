import { Module } from '@nestjs/common';
import { AppRepository } from './app.repository';
import { ObjectRepository } from './object.repository';
import { FieldVoteRepository } from './field-vote.repository';
import { WaivStakeRepository } from './waiv-stake.repository';
import { UserRepository } from './user.repository';
import { PostRepository } from './post.repository';
import { DepartmentRepository } from './department.repository';
import { UserShopDeselectRepository } from './user-shop-deselect.repository';
import { SpamUserRepository } from './spam-user.repository';
import { MutedUserRepository } from './muted-user.repository';
import { BlacklistRepository } from './blacklist.repository';

@Module({
  providers: [
    AppRepository,
    ObjectRepository,
    FieldVoteRepository,
    WaivStakeRepository,
    UserRepository,
    PostRepository,
    DepartmentRepository,
    UserShopDeselectRepository,
    SpamUserRepository,
    MutedUserRepository,
    BlacklistRepository,
  ],
  exports: [
    AppRepository,
    ObjectRepository,
    FieldVoteRepository,
    WaivStakeRepository,
    UserRepository,
    PostRepository,
    DepartmentRepository,
    UserShopDeselectRepository,
    SpamUserRepository,
    MutedUserRepository,
    BlacklistRepository,
  ],
})
export class RepositoriesModule {}
