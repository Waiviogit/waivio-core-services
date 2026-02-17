import { Injectable, Logger } from '@nestjs/common';
import { ObjectRepository, FieldVoteRepository } from '../../repositories';

@Injectable()
export class FieldWeightRecalcService {
  private readonly logger = new Logger(FieldWeightRecalcService.name);

  constructor(
    private readonly objectRepository: ObjectRepository,
    private readonly fieldVoteRepository: FieldVoteRepository,
  ) {}

  async recalculateFieldWeightsForVoter(voter: string): Promise<void> {
    const votes = await this.fieldVoteRepository.find({
      filter: { voter },
    });

    if (votes.length === 0) return;

    const voteGroups = new Map<string, Array<(typeof votes)[0]>>();
    for (const vote of votes) {
      const key = `${vote.objectPermlink}:${vote.fieldTransactionId}`;
      if (!voteGroups.has(key)) {
        voteGroups.set(key, []);
      }
      voteGroups.get(key)!.push(vote);
    }

    for (const [key] of voteGroups) {
      const [objectPermlink, fieldTransactionId] = key.split(':');
      await this.recalculateFieldWeight(objectPermlink, fieldTransactionId);
    }
  }

  async recalculateFieldWeight(
    objectPermlink: string,
    fieldTransactionId: string,
  ): Promise<void> {
    const votes = await this.fieldVoteRepository.findVotesWithStakes(
      objectPermlink,
      fieldTransactionId,
    );

    const totalWeight = votes.reduce((sum, vote) => {
      return sum + vote.weight * vote.stake;
    }, 0);

    await this.objectRepository.updateFieldWeight(
      objectPermlink,
      fieldTransactionId,
      totalWeight,
    );
  }
}
