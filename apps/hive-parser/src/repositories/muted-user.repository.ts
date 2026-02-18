import { Injectable, Logger } from '@nestjs/common';
import {
  MongoRepository,
  MongoClientFactory,
  MONGO_CONNECTION,
  mutedUserModel,
} from '@waivio-core-services/clients';
import type { MutedUserDocument } from '@waivio-core-services/clients';

@Injectable()
export class MutedUserRepository extends MongoRepository<MutedUserDocument> {
  constructor(mongoFactory: MongoClientFactory) {
    super(
      mutedUserModel(mongoFactory.getConnection(MONGO_CONNECTION.WAIVIO)),
      new Logger(MutedUserRepository.name),
    );
  }
}
