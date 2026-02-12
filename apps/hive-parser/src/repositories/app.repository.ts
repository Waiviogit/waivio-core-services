import { Injectable, Logger } from '@nestjs/common';
import {
  MongoRepository,
  MongoClientFactory,
  MONGO_CONNECTION,
  appModel,
} from '@waivio-core/clients';
import type { AppDocument } from '@waivio-core/clients';

@Injectable()
export class AppRepository extends MongoRepository<AppDocument> {
  constructor(mongoFactory: MongoClientFactory) {
    super(
      appModel(mongoFactory.getConnection(MONGO_CONNECTION.WAIVIO)),
      new Logger(AppRepository.name),
    );
  }
}
