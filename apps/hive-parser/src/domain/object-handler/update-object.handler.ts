import { Injectable, Logger } from '@nestjs/common';
import { ObjectRepository } from '../../repositories';
import type { ObjectMethodHandler, ObjectMethodContext } from './interface';
import type { WaivioOperation } from '../hive-parser/schemas';

@Injectable()
export class UpdateObjectHandler implements ObjectMethodHandler {
  private readonly logger = new Logger(UpdateObjectHandler.name);

  constructor(private readonly objectRepository: ObjectRepository) {}

  async handle(
    operation: WaivioOperation,
    ctx: ObjectMethodContext,
  ): Promise<void> {
    if (operation.method !== 'updateObject') return;
    const { name, locale, body, creator, objectPermlink } = operation.params;

    this.logger.log(`updateObject: field "${name}" by ${creator}`);

    await this.objectRepository.updateOne({
      filter: { permlink: objectPermlink },
      update: {
        $push: {
          fields: {
            author: ctx.account,
            name,
            body,
            locale,
            creator,
            transactionId: ctx.transactionId,
          },
        },
      },
    });
  }
}
