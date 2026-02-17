import { Injectable, Logger } from '@nestjs/common';
import { FieldVoteRepository } from '../../repositories';
import type { ObjectMethodHandler, ObjectMethodContext } from './interface';
import type { WaivioOperation } from '../hive-parser/schemas';
import { FieldWeightRecalcService } from './field-weight-recalc.service';

@Injectable()
export class VoteObjectFieldHandler implements ObjectMethodHandler {
  private readonly logger = new Logger(VoteObjectFieldHandler.name);

  constructor(
    private readonly fieldVoteRepository: FieldVoteRepository,
    private readonly fieldWeightRecalcService: FieldWeightRecalcService,
  ) {}

  async handle(
    operation: WaivioOperation,
    ctx: ObjectMethodContext,
  ): Promise<void> {
    if (operation.method !== 'voteObjectField') return;
    const { objectPermlink, fieldTransactionId, weight } = operation.params;

    this.logger.log(
      `voteObjectField: ${fieldTransactionId} on ${objectPermlink} by ${ctx.account} (weight: ${weight})`,
    );

    const voter = ctx.account;

    await this.fieldVoteRepository.upsertVote(
      objectPermlink,
      fieldTransactionId,
      voter,
      weight,
      ctx.timestamp,
    );

    await this.fieldWeightRecalcService.recalculateFieldWeight(
      objectPermlink,
      fieldTransactionId,
    );
  }
}
