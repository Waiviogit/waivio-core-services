import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DOMAIN_EVENTS,
  type ObjectCreatedEventPayload,
} from './domain-events.types';
import { CacheService } from '../cache';

@Injectable()
export class ObjectCreatedEventSubscriber {
  private readonly logger = new Logger(ObjectCreatedEventSubscriber.name);

  constructor(private readonly cacheService: CacheService) {}

  @OnEvent(DOMAIN_EVENTS.OBJECT_CREATED)
  async handleObjectCreated(payload: ObjectCreatedEventPayload): Promise<void> {
    if (!payload.importId) return;

    const message = JSON.stringify({
      user: payload.creator,
      author_permlink: payload.author_permlink,
      importId: payload.importId,
    });

    try {
      await this.cacheService.publish('datafinityObject', message);
      this.logger.log(
        `Published datafinity object creation for ${payload.author_permlink} importId=${payload.importId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish datafinity object notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
