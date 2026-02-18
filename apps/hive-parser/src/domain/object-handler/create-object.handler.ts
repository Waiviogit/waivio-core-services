import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ObjectRepository } from '../../repositories';
import type { ObjectMethodHandler, ObjectMethodContext } from './interface';
import type { WaivioOperation } from '../hive-parser/schemas';
import type { ObjectDocument } from '@waivio-core-services/clients';
import {
  OBJECT_TYPES,
  OBJECT_TYPES_FOR_GROUP_ID,
} from '@waivio-core-services/common';

@Injectable()
export class CreateObjectHandler implements ObjectMethodHandler {
  private readonly logger = new Logger(CreateObjectHandler.name);

  constructor(private readonly objectRepository: ObjectRepository) {}

  async handle(
    operation: WaivioOperation,
    ctx: ObjectMethodContext,
  ): Promise<void> {
    if (operation.method !== 'createObject') return;
    const { permlink, defaultName, creator, objectType } = operation.params;

    if (!(Object.values(OBJECT_TYPES) as string[]).includes(objectType)) {
      this.logger.warn(
        `Invalid objectType "${objectType}" for createObject: ${permlink} by ${creator}. Skipping object creation.`,
      );
      return;
    }

    const exists = await this.objectRepository.existsByAuthorPermlink(permlink);

    if (exists) {
      this.logger.warn(
        `Object with author_permlink "${permlink}" already exists. Skipping object creation.`,
      );
      return;
    }

    this.logger.log(`createObject: ${objectType}/${permlink} by ${creator}`);

    const createData: Partial<ObjectDocument> = {
      author: ctx.account,
      author_permlink: permlink,
      default_name: defaultName,
      creator,
      object_type: objectType,
      transactionId: ctx.transactionId,
    };

    if ((OBJECT_TYPES_FOR_GROUP_ID as readonly string[]).includes(objectType)) {
      createData.metaGroupId = randomUUID();
    }

    await this.objectRepository.create(createData);
  }
}
