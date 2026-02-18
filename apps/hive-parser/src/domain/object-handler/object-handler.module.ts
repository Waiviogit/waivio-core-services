import { Module } from '@nestjs/common';
import { UtilsModule } from '@waivio-core-services/common';
import { RepositoriesModule } from '../../repositories';
import { CreateObjectHandler } from './create-object.handler';
import { UpdateObjectHandler } from './update-object.handler';
import { VoteObjectFieldHandler } from './vote-object-field.handler';
import { FieldWeightRecalcService } from './field-weight-recalc.service';
import { ObjectHandlerService } from './object-handler.service';
import { UpdateObjectValidatorService } from './update-object-validator.service';
import { UserRestrictionsModule } from '../user-restrictions';

@Module({
  imports: [RepositoriesModule, UtilsModule, UserRestrictionsModule],
  providers: [
    CreateObjectHandler,
    UpdateObjectHandler,
    VoteObjectFieldHandler,
    FieldWeightRecalcService,
    ObjectHandlerService,
    UpdateObjectValidatorService,
  ],
  exports: [ObjectHandlerService, FieldWeightRecalcService],
})
export class ObjectHandlerModule {}
