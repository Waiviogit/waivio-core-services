import { Injectable, Logger } from '@nestjs/common';
import { ObjectRepository } from '../../repositories';
import type {
  ObjectMethodHandler,
  ObjectMethodContext,
} from './interface';
import type { WaivioOperation } from '../hive-parser/schemas';

@Injectable()
export class CreateObjectHandler implements ObjectMethodHandler {
  private readonly logger = new Logger(CreateObjectHandler.name);

  constructor(private readonly objectRepository: ObjectRepository) {}

  async handle(
    operation: WaivioOperation,
    ctx: ObjectMethodContext,
  ): Promise<void> {
    if (operation.method !== 'createObject') return;
    const {  permlink, defaultName, creator, objectType } =
      operation.params;

    this.logger.log(`createObject: ${objectType}/${permlink} by ${creator}`);

    await this.objectRepository.create({
      author: ctx.account,
      permlink,
      defaultName,
      creator,
      objectType,
      transactionId: ctx.transactionId,
    });
  }
}
