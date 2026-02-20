import { Module } from '@nestjs/common';
import { AppRepository } from './app.repository';
import { ObjectRepository } from './object.repository';
import { WaivStakeRepository } from './waiv-stake.repository';
import { UserRepository } from './user.repository';
import { PostRepository } from './post.repository';
import { DepartmentRepository } from './department.repository';
import { UserShopDeselectRepository } from './user-shop-deselect.repository';
import { WobjectPendingUpdateRepository } from './wobject-pending-update.repository';
import { SpamUserRepository } from './spam-user.repository';
import { MutedUserRepository } from './muted-user.repository';
import { BlacklistRepository } from './blacklist.repository';
import { CommentRepository } from './comment.repository';
import { UserExpertiseRepository } from './user-expertise.repository';

@Module({
  providers: [
    AppRepository,
    ObjectRepository,
    WaivStakeRepository,
    UserRepository,
    PostRepository,
    DepartmentRepository,
    UserShopDeselectRepository,
    SpamUserRepository,
    MutedUserRepository,
    BlacklistRepository,
    CommentRepository,
    UserExpertiseRepository,
    WobjectPendingUpdateRepository,
  ],
  exports: [
    AppRepository,
    ObjectRepository,
    WaivStakeRepository,
    UserRepository,
    PostRepository,
    DepartmentRepository,
    UserShopDeselectRepository,
    SpamUserRepository,
    MutedUserRepository,
    BlacklistRepository,
    CommentRepository,
    UserExpertiseRepository,
    WobjectPendingUpdateRepository,
  ],
})
export class RepositoriesModule {}
