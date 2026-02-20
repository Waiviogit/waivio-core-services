import { Injectable, Logger } from '@nestjs/common';
import { ObjectRepository } from '../../repositories';

@Injectable()
export class FieldWeightRecalcService {
  private readonly logger = new Logger(FieldWeightRecalcService.name);

  constructor(private readonly objectRepository: ObjectRepository) {}

  async recalculateFieldWeightsForVoter(voter: string): Promise<void> {
    // Find all objects that have votes from this voter
    const objects = await this.objectRepository.find({
      filter: {
        'fields.active_votes.voter': voter,
      },
    });

    if (objects.length === 0) return;

    const processedFields = new Set<string>();
    for (const object of objects) {
      if (!object.fields) continue;

      for (const field of object.fields) {
        if (!field.active_votes || field.active_votes.length === 0) continue;

        const key = `${object.author_permlink}:${field.transactionId}`;
        if (processedFields.has(key)) continue;
        processedFields.add(key);

        await this.recalculateFieldWeight(
          object.author_permlink,
          field.transactionId,
        );
      }
    }
  }

  async recalculateFieldWeight(
    objectPermlink: string,
    fieldTransactionId: string,
  ): Promise<void> {
    const fieldData = await this.objectRepository.getFieldWithVotes(
      objectPermlink,
      fieldTransactionId,
    );

    if (
      !fieldData ||
      !fieldData.active_votes ||
      fieldData.active_votes.length === 0
    ) {
      // No votes, set weight to 0
      await this.objectRepository.updateFieldWeight(
        objectPermlink,
        fieldTransactionId,
        0,
      );
      return;
    }

    // Calculate total weight: sum of all vote weights
    // Note: weight is already calculated as (percent * stake) / 10000 in the handler
    const totalWeight = fieldData.active_votes.reduce((sum, vote) => {
      return sum + vote.weight;
    }, 0);

    await this.objectRepository.updateFieldWeight(
      objectPermlink,
      fieldTransactionId,
      totalWeight,
    );
  }
}
