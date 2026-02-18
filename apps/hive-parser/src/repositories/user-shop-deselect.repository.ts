import { Injectable, Logger } from '@nestjs/common';
import {
  MongoRepository,
  MongoClientFactory,
  MONGO_CONNECTION,
  userShopDeselectModel,
} from '@waivio-core-services/clients';
import type { UserShopDeselectDocument } from '@waivio-core-services/clients';

@Injectable()
export class UserShopDeselectRepository extends MongoRepository<UserShopDeselectDocument> {
  constructor(mongoFactory: MongoClientFactory) {
    super(
      userShopDeselectModel(
        mongoFactory.getConnection(MONGO_CONNECTION.WAIVIO),
      ),
      new Logger(UserShopDeselectRepository.name),
    );
  }
}
