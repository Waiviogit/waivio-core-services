import { Injectable, Logger } from '@nestjs/common';
import {
  MongoRepository,
  MongoClientFactory,
  MONGO_CONNECTION,
  objectModel,
} from '@waivio-core/clients';
import type { ObjectDocument } from '@waivio-core/clients';

@Injectable()
export class ObjectRepository extends MongoRepository<ObjectDocument> {
  constructor(mongoFactory: MongoClientFactory) {
    super(
      objectModel(mongoFactory.getConnection(MONGO_CONNECTION.WAIVIO)),
      new Logger(ObjectRepository.name),
    );
  }
}
