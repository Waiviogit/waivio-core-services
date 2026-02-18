import { Injectable, Logger } from '@nestjs/common';
import {
  MongoRepository,
  MongoClientFactory,
  MONGO_CONNECTION,
  postModel,
} from '@waivio-core-services/clients';
import type { PostDocument } from '@waivio-core-services/clients';

@Injectable()
export class PostRepository extends MongoRepository<PostDocument> {
  constructor(mongoFactory: MongoClientFactory) {
    super(
      postModel(mongoFactory.getConnection(MONGO_CONNECTION.WAIVIO)),
      new Logger(PostRepository.name),
    );
  }
}
