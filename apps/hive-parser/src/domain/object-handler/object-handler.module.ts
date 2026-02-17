import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../repositories';
import { CreateObjectHandler } from './create-object.handler';
import { UpdateObjectHandler } from './update-object.handler';
import { VoteObjectFieldHandler } from './vote-object-field.handler';
import { FieldWeightRecalcService } from './field-weight-recalc.service';
import { ObjectHandlerService } from './object-handler.service';

@Module({
  imports: [RepositoriesModule],
  providers: [
    CreateObjectHandler,
    UpdateObjectHandler,
    VoteObjectFieldHandler,
    FieldWeightRecalcService,
    ObjectHandlerService,
  ],
  exports: [ObjectHandlerService, FieldWeightRecalcService],
})
export class ObjectHandlerModule {}
