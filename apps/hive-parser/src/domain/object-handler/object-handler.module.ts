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
import { DepartmentModule } from '../department';
import { ConfigModule } from '@nestjs/config';
import {
  FieldUpdateOrchestrator,
  DepartmentFieldUpdateStrategy,
  ListItemUpdateStrategy,
  TagCategoryUpdateStrategy,
  SupposedUpdatesStrategy,
  SearchFieldUpdateStrategy,
} from './strategies';
import { ObjectCreatedEventSubscriber } from '../events';

@Module({
  imports: [
    RepositoriesModule,
    UtilsModule,
    UserRestrictionsModule,
    DepartmentModule,
    ObjectProcessorIntegrationModule, // Import the shared integration module
    NotificationsModule,
    CacheModule,
    ImportUpdatesModule,
    WaivioApiModule,
    ConfigModule,
  ],
  providers: [
    DepartmentFieldUpdateStrategy,
    ListItemUpdateStrategy,
    TagCategoryUpdateStrategy,
    SupposedUpdatesStrategy,
    SearchFieldUpdateStrategy,
    {
      provide: FieldUpdateOrchestrator,
      useFactory: (
        dep: DepartmentFieldUpdateStrategy,
        list: ListItemUpdateStrategy,
        tag: TagCategoryUpdateStrategy,
        supposed: SupposedUpdatesStrategy,
        search: SearchFieldUpdateStrategy,
      ) => new FieldUpdateOrchestrator([dep, list, tag, supposed, search]),
      inject: [
        DepartmentFieldUpdateStrategy,
        ListItemUpdateStrategy,
        TagCategoryUpdateStrategy,
        SupposedUpdatesStrategy,
        SearchFieldUpdateStrategy,
      ],
    },
    CreateObjectHandler,
    UpdateObjectHandler,
    VoteObjectFieldHandler,
    FieldWeightRecalcService,
    ObjectHandlerService,
    UpdateObjectValidatorService,
    UpdateSpecificFieldsService,
    ObjectCreatedEventSubscriber,
  ],
  exports: [
    ObjectHandlerService,
    FieldWeightRecalcService,
    UpdateSpecificFieldsService,
  ],
})
export class ObjectHandlerModule {}
