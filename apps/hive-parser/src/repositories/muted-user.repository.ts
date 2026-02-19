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

  async isMutedByGlobalAccounts(
    userName: string,
    globalMuteAccounts: string[],
  ): Promise<boolean> {
    if (globalMuteAccounts.length === 0) {
      return false;
    }
    const result = await this.findOne({
      filter: {
        userName,
        mutedBy: { $in: globalMuteAccounts },
      },
      projection: { _id: 1 },
    });
    return result !== null;
  }

  async findByMutedBy(mutedBy: string[]): Promise<MutedUserDocument[]> {
    return this.find({
      filter: { mutedBy: { $in: mutedBy } },
      projection: { userName: 1 },
    });
  }
}
