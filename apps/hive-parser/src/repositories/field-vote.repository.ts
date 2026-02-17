import { Injectable, Logger } from '@nestjs/common';
import {
  MongoRepository,
  MongoClientFactory,
  MONGO_CONNECTION,
  fieldVoteModel,
} from '@waivio-core-services/clients';
import type { FieldVoteDocument } from '@waivio-core-services/clients';

export interface VoteWithStake {
  voter: string;
  weight: number;
  stake: number;
}

@Injectable()
export class FieldVoteRepository extends MongoRepository<FieldVoteDocument> {
  constructor(mongoFactory: MongoClientFactory) {
    super(
      fieldVoteModel(mongoFactory.getConnection(MONGO_CONNECTION.WAIVIO)),
      new Logger(FieldVoteRepository.name),
    );
  }

  async findVotesWithStakes(
    objectPermlink: string,
    fieldTransactionId: string,
  ): Promise<VoteWithStake[]> {
    return this.aggregate<VoteWithStake>({
      pipeline: [
        {
          $match: {
            objectPermlink,
            fieldTransactionId,
          },
        },
        {
          $lookup: {
            from: 'waiv-stakes',
            localField: 'voter',
            foreignField: 'account',
            as: 'stake',
          },
        },
        {
          $unwind: {
            path: '$stake',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            voter: 1,
            weight: 1,
            stake: { $ifNull: ['$stake.stake', 0] },
          },
        },
      ],
    });
  }

  async upsertVote(
    objectPermlink: string,
    fieldTransactionId: string,
    voter: string,
    weight: number,
    timestamp: string,
  ): Promise<void> {
    await this.updateOne({
      filter: {
        objectPermlink,
        fieldTransactionId,
        voter,
      },
      update: {
        $set: {
          objectPermlink,
          fieldTransactionId,
          voter,
          weight,
          timestamp,
        },
      },
      options: { upsert: true },
    });
  }
}
