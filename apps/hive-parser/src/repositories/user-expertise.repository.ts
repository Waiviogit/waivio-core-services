import { Injectable, Logger } from '@nestjs/common';
import {
  MongoRepository,
  MongoClientFactory,
  MONGO_CONNECTION,
  userExpertiseModel,
} from '@waivio-core-services/clients';
import type { UserExpertiseDocument } from '@waivio-core-services/clients';

@Injectable()
export class UserExpertiseRepository extends MongoRepository<UserExpertiseDocument> {
  constructor(mongoFactory: MongoClientFactory) {
    super(
      userExpertiseModel(mongoFactory.getConnection(MONGO_CONNECTION.WAIVIO)),
      new Logger(UserExpertiseRepository.name),
    );
  }

  async findByAuthorPermlinkWithExpertiseUSD(
    authorPermlink: string,
  ): Promise<UserExpertiseDocument[]> {
    // Note: Original code used expertiseUSD field, but schema has weight field
    // Using weight > 0 as equivalent check
    return this.find({
      filter: {
        author_permlink: authorPermlink,
        weight: { $gt: 0 },
      },
    });
  }
}
