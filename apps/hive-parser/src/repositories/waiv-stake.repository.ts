import { Injectable, Logger } from '@nestjs/common';
import {
  MongoRepository,
  MongoClientFactory,
  MONGO_CONNECTION,
  waivStakeModel,
} from '@waivio-core-services/clients';
import type { WaivStakeDocument } from '@waivio-core-services/clients';

@Injectable()
export class WaivStakeRepository extends MongoRepository<WaivStakeDocument> {
  constructor(mongoFactory: MongoClientFactory) {
    super(
      waivStakeModel(mongoFactory.getConnection(MONGO_CONNECTION.WAIVIO)),
      new Logger(WaivStakeRepository.name),
    );
  }

  async upsertStake(account: string, stake: number): Promise<void> {
    await this.updateOne({
      filter: { account },
      update: {
        $set: {
          account,
          stake,
        },
      },
      options: { upsert: true },
    });
  }
}
