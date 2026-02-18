import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../repositories';
import { UserRestrictionService } from './user-restriction.service';

@Module({
  imports: [RepositoriesModule],
  providers: [UserRestrictionService],
  exports: [UserRestrictionService],
})
export class UserRestrictionsModule {}
