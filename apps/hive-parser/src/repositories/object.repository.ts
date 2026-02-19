import { Injectable, Logger } from '@nestjs/common';
import {
  MongoRepository,
  MongoClientFactory,
  MONGO_CONNECTION,
  objectModel,
} from '@waivio-core-services/clients';
import { FIELDS_NAMES } from '@waivio-core-services/common';
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

  async appendField(
    objectPermlink: string,
    field: {
      author: string;
      name: string;
      body: string;
      locale: string;
      creator: string;
      transactionId: string;
    },
  ): Promise<void> {
    await this.updateOne({
      filter: { author_permlink: objectPermlink },
      update: {
        $push: {
          fields: field,
        },
      },
    });
  }

  async findOneByAuthorPermlink(
    authorPermlink: string,
  ): Promise<ObjectDocument | null> {
    return this.findOne({
      filter: { author_permlink: authorPermlink },
    });
  }

  async findParentsByPermlinks(permlinks: string[]): Promise<ObjectDocument[]> {
    return this.find({
      filter: { author_permlink: { $in: permlinks } },
      projection: { search: 0, departments: 0 },
    });
  }

  async findByGroupIds(
    ids: string[],
    excludeStatuses: string[],
  ): Promise<ObjectDocument[]> {
    return this.find({
      filter: {
        fields: {
          $elemMatch: {
            name: FIELDS_NAMES.GROUP_ID,
            body: { $in: ids },
          },
        },
        'status.title': { $nin: excludeStatuses },
      },
    });
  }

  async findByMetaGroupId(metaGroupId: string): Promise<ObjectDocument[]> {
    return this.find({
      filter: { metaGroupId },
      projection: { authority: 1 },
    });
  }
}
