import { Injectable, Logger } from '@nestjs/common';
import {
  MongoRepository,
  MongoClientFactory,
  MONGO_CONNECTION,
  userModel,
} from '@waivio-core-services/clients';
import type { UserDocument } from '@waivio-core-services/clients';

@Injectable()
export class UserRepository extends MongoRepository<UserDocument> {
  constructor(mongoFactory: MongoClientFactory) {
    super(
      userModel(mongoFactory.getConnection(MONGO_CONNECTION.WAIVIO)),
      new Logger(UserRepository.name),
    );
  }
}
