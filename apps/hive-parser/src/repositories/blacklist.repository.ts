import { Injectable, Logger } from '@nestjs/common';
import {
  MongoRepository,
  MongoClientFactory,
  MONGO_CONNECTION,
  blacklistModel,
} from '@waivio-core-services/clients';
import type { BlacklistDocument } from '@waivio-core-services/clients';

@Injectable()
export class BlacklistRepository extends MongoRepository<BlacklistDocument> {
  constructor(mongoFactory: MongoClientFactory) {
    super(
      blacklistModel(mongoFactory.getConnection(MONGO_CONNECTION.WAIVIO)),
      new Logger(BlacklistRepository.name),
    );
  }

  async findByUser(user: string): Promise<BlacklistDocument | null> {
    return this.findOne({
      filter: { user },
    });
  }

  async findWithFollowLists(user: string): Promise<BlacklistDocument | null> {
    const blacklist = await this.findByUser(user);
    if (
      !blacklist ||
      !blacklist.followLists ||
      blacklist.followLists.length === 0
    ) {
      return blacklist;
    }

    // Populate followLists with actual blacklist documents
    // Note: This replaces the post('findOne') hook behavior
    const followListDocs = await this.find({
      filter: { user: { $in: blacklist.followLists } },
    });

    // Convert to array of user strings (matching original hook behavior)
    blacklist.followLists = followListDocs.map((doc) => doc.user);

    return blacklist;
  }

  async findByUsersWithProjection(
    users: string[],
    projection: { followLists?: number; blackList?: number },
  ): Promise<BlacklistDocument[]> {
    return this.find({
      filter: { user: { $in: users } },
      projection,
    });
  }

  async findBlackListsByUsers(users: string[]): Promise<BlacklistDocument[]> {
    return this.find({
      filter: { user: { $in: users } },
      projection: { blackList: 1 },
    });
  }
}
