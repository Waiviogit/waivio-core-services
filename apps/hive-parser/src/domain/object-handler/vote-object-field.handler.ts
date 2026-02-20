import { Injectable, Logger } from '@nestjs/common';
import { ObjectRepository, WaivStakeRepository } from '../../repositories';
import type { ObjectMethodHandler, ObjectMethodContext } from './interface';
import type { WaivioOperation } from '../hive-parser/schemas';
import { FieldWeightRecalcService } from './field-weight-recalc.service';
import { UpdateSpecificFieldsService } from './update-specific-fields.service';

@Injectable()
export class VoteObjectFieldHandler implements ObjectMethodHandler {
  private readonly logger = new Logger(VoteObjectFieldHandler.name);

  constructor(
    private readonly objectRepository: ObjectRepository,
    private readonly waivStakeRepository: WaivStakeRepository,
    private readonly fieldWeightRecalcService: FieldWeightRecalcService,
    private readonly updateSpecificFieldsService: UpdateSpecificFieldsService,
  ) {}

  async handle(
    operation: WaivioOperation,
    ctx: ObjectMethodContext,
  ): Promise<void> {
    if (operation.method !== 'voteObjectField') return;
    const { objectPermlink, fieldTransactionId, percent } = operation.params;

    this.logger.log(
      `voteObjectField: ${fieldTransactionId} on ${objectPermlink} by ${ctx.account} (percent: ${percent})`,
    );

    const voter = ctx.account;

    // Get WAIV stake for the voter
    const stakeDoc = await this.waivStakeRepository.findOne({
      filter: { account: voter },
    });
    const stake = stakeDoc?.stake || 0;

    // Calculate weight: weight = percent * stake / 10000
    // percent is in range -10000 to 10000 (like Hive percent)
    const weight = (percent * stake) / 10000;

    // Store vote directly in the field's active_votes array
    await this.objectRepository.upsertFieldVote(
      objectPermlink,
      fieldTransactionId,
      {
        voter,
        percent,
        weight,
        timestamp: ctx.timestamp,
      },
    );

    // Recalculate field weight based on all votes
    await this.fieldWeightRecalcService.recalculateFieldWeight(
      objectPermlink,
      fieldTransactionId,
    );

    // Update specific fields after vote
    await this.updateSpecificFieldsService.update({
      objectPermlink,
      fieldTransactionId,
      voter,
      percent,
    });
  }
}
