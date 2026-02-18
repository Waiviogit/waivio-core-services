import { Injectable, Logger } from '@nestjs/common';
import {
  MongoRepository,
  MongoClientFactory,
  MONGO_CONNECTION,
  spamUserModel,
} from '@waivio-core-services/clients';
import type { SpamUserDocument } from '@waivio-core-services/clients';

@Injectable()
export class SpamUserRepository extends MongoRepository<SpamUserDocument> {
  constructor(mongoFactory: MongoClientFactory) {
    super(
      spamUserModel(mongoFactory.getConnection(MONGO_CONNECTION.WAIVIO)),
      new Logger(SpamUserRepository.name),
    );
  }
}
