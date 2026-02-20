import { Module } from '@nestjs/common';
import { UtilsModule } from '@waivio-core-services/common';
import { RepositoriesModule } from '../../repositories';
import { CreateObjectHandler } from './create-object.handler';
import { UpdateObjectHandler } from './update-object.handler';
import { VoteObjectFieldHandler } from './vote-object-field.handler';
import { FieldWeightRecalcService } from './field-weight-recalc.service';
import { ObjectHandlerService } from './object-handler.service';
import { UpdateObjectValidatorService } from './update-object-validator.service';
import { UpdateSpecificFieldsService } from './update-specific-fields.service';
import { UserRestrictionsModule } from '../user-restrictions';
import { ObjectProcessorIntegrationModule } from '../object-processor-integration';
import { NotificationsModule } from '../notifications';
import { CacheModule } from '../cache';
import { ImportUpdatesModule } from '../import-updates';
import { WaivioApiModule } from '../waivio-api';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    RepositoriesModule,
    UtilsModule,
    UserRestrictionsModule,
    ObjectProcessorIntegrationModule, // Import the shared integration module
    NotificationsModule,
    CacheModule,
    ImportUpdatesModule,
    WaivioApiModule,
    ConfigModule,
  ],
  providers: [
    CreateObjectHandler,
    UpdateObjectHandler,
    VoteObjectFieldHandler,
    FieldWeightRecalcService,
    ObjectHandlerService,
    UpdateObjectValidatorService,
    UpdateSpecificFieldsService,
  ],
  exports: [
    ObjectHandlerService,
    FieldWeightRecalcService,
    UpdateSpecificFieldsService,
  ],
})
export class ObjectHandlerModule {}
