import { Injectable, Logger } from '@nestjs/common';
import {
  MongoRepository,
  MongoClientFactory,
  MONGO_CONNECTION,
  objectModel,
} from '@waivio-core-services/clients';
import type { ObjectDocument } from '@waivio-core-services/clients';

@Injectable()
export class ObjectRepository extends MongoRepository<ObjectDocument> {
  constructor(mongoFactory: MongoClientFactory) {
    super(
      objectModel(mongoFactory.getConnection(MONGO_CONNECTION.WAIVIO)),
      new Logger(ObjectRepository.name),
    );
  }

  async updateFieldWeight(
    objectPermlink: string,
    fieldTransactionId: string,
    weight: number,
  ): Promise<void> {
    await this.updateOne({
      filter: {
        author_permlink: objectPermlink,
        'fields.transactionId': fieldTransactionId,
      },
      update: {
        $set: {
          'fields.$.weight': weight,
        },
      },
    });
  }

  async existsByAuthorPermlink(authorPermlink: string): Promise<boolean> {
    const result = await this.findOne({
      filter: { author_permlink: authorPermlink },
      projection: { author_permlink: 1 },
    });
    return result !== null;
  }
}
