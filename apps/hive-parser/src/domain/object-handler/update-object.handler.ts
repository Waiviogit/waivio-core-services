import { Injectable, Logger } from '@nestjs/common';
import { ObjectRepository } from '../../repositories';
import type { ObjectMethodHandler, ObjectMethodContext } from './interface';
import type { WaivioOperation } from '../hive-parser/schemas';
import { UpdateObjectValidatorService } from './update-object-validator.service';
import { UpdateSpecificFieldsService } from './update-specific-fields.service';

@Injectable()
export class UpdateObjectHandler implements ObjectMethodHandler {
  private readonly logger = new Logger(UpdateObjectHandler.name);

  constructor(
    private readonly objectRepository: ObjectRepository,
    private readonly validatorService: UpdateObjectValidatorService,
    private readonly updateSpecificFieldsService: UpdateSpecificFieldsService,
  ) {}

  async handle(
    operation: WaivioOperation,
    ctx: ObjectMethodContext,
  ): Promise<void> {
    if (operation.method !== 'updateObject') return;
    const { name, locale, body, creator, objectPermlink } = operation.params;

    this.logger.log(`updateObject: field "${name}" by ${creator}`);

    // Check if author or creator is restricted (spam or muted)
    const usersToCheck = new Set([ctx.account, creator]);
    for (const user of usersToCheck) {
      const isAllowed =
        await this.validatorService.validateUserOnBlacklist(user);
      if (!isAllowed) {
        this.logger.warn(`User ${user} is restricted. Skipping field update.`);
        return;
      }
    }

    // Validate field before appending
    const isValidSameFields = await this.validatorService.validateSameFields({
      objectPermlink,
      field: {
        name,
        body,
        locale,
        author: ctx.account,
        creator,
        transactionId: ctx.transactionId,
      },
    });

    if (!isValidSameFields) {
      this.logger.warn(
        `Validation failed for same fields: ${name} on ${objectPermlink}`,
      );
      return;
    }

    const isValidSpecifiedFields =
      await this.validatorService.validateSpecifiedFields({
        objectPermlink,
        field: {
          name,
          body,
          locale,
          author: ctx.account,
          creator,
          transactionId: ctx.transactionId,
        },
      });

    if (!isValidSpecifiedFields) {
      this.logger.warn(
        `Validation failed for specified fields: ${name} on ${objectPermlink}`,
      );
      return;
    }

    // Append field using repository method
    await this.objectRepository.appendField(objectPermlink, {
      author: ctx.account,
      name,
      body,
      locale,
      creator,
      transactionId: ctx.transactionId,
    });

    // Update specific fields after field append
    await this.updateSpecificFieldsService.update({
      objectPermlink,
      fieldTransactionId: ctx.transactionId,
    });
  }
}
