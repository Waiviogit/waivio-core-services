import { Injectable, Logger } from '@nestjs/common';
import type { WaivioOperation, WaivioMethod } from '../hive-parser/schemas';
import type { ObjectMethodHandler, ObjectMethodContext } from './interface';
import { CreateObjectHandler } from './create-object.handler';
import { UpdateObjectHandler } from './update-object.handler';
import { VoteObjectFieldHandler } from './vote-object-field.handler';

@Injectable()
export class ObjectHandlerService {
  private readonly logger = new Logger(ObjectHandlerService.name);
  private readonly handlers: Record<WaivioMethod, ObjectMethodHandler>;

  constructor(
    createObjectHandler: CreateObjectHandler,
    updateObjectHandler: UpdateObjectHandler,
    voteObjectFieldHandler: VoteObjectFieldHandler,
  ) {
    this.handlers = {
      createObject: createObjectHandler,
      updateObject: updateObjectHandler,
      voteObjectField: voteObjectFieldHandler,
    };
  }

  async handle(
    operation: WaivioOperation,
    ctx: ObjectMethodContext,
  ): Promise<void> {
    const handler = this.handlers[operation.method];
    if (!handler) {
      this.logger.warn(`No handler for method: ${operation.method}`);
      return;
    }
    await handler.handle(operation, ctx);
  }
}
