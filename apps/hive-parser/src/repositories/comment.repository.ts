import { Injectable, Logger } from '@nestjs/common';
import {
  MongoRepository,
  MongoClientFactory,
  MONGO_CONNECTION,
  commentModel,
} from '@waivio-core-services/clients';
import type { CommentDocument } from '@waivio-core-services/clients';

@Injectable()
export class CommentRepository extends MongoRepository<CommentDocument> {
  constructor(mongoFactory: MongoClientFactory) {
    super(
      commentModel(mongoFactory.getConnection(MONGO_CONNECTION.WAIVIO)),
      new Logger(CommentRepository.name),
    );
  }

  async findOneByAuthorPermlink(
    author: string,
    permlink: string,
  ): Promise<CommentDocument | null> {
    return this.findOne({
      filter: { author, permlink },
    });
  }
}
