import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as _ from 'lodash';
import {
  PostRepository,
  ObjectRepository,
  CommentRepository,
  UserExpertiseRepository,
} from '../../repositories';
import { CacheService, REDIS_KEYS } from '../cache';
import { SocketClient } from '@waivio-core-services/clients';
import { HiveClient } from '@waivio-core-services/clients';
import {
  FIELDS_NAMES,
  OBJECT_TYPES,
  SUPPOSED_UPDATES_TRANSLATIONS,
} from '@waivio-core-services/common';
import { BlockCacheService } from '@waivio-core-services/processors';
import { NOTIFICATION_ID } from './notifications.constants';
import type { ObjectField } from '@waivio-core-services/clients';

interface NotificationOperation {
  id: string;
  block?: number;
  data: Record<string, unknown>;
}

interface ReblogParams {
  account: string;
  author: string;
  permlink: string;
  title: string;
}

interface FollowParams {
  follower: string;
  following: string;
}

interface ReplyOperation {
  author?: string;
  parent_author: string;
  parent_permlink: string;
  reply?: boolean;
}

interface RestaurantStatusData {
  object_name?: string;
  experts?: string[];
  oldStatus?: string;
  newStatus?: string;
  author_permlink?: string;
}

interface RejectUpdateData {
  creator: string;
  voter: string;
  author_permlink: string;
  fieldName: string;
  parent_permlink?: string;
  parent_name?: string;
  object_name?: string;
}

interface FieldUpdateParams {
  authorPermlink: string;
  field: ObjectField;
  reject: boolean;
  initiator: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly wsSetNotification: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly socketClient: SocketClient,
    private readonly cacheService: CacheService,
    private readonly blockCacheService: BlockCacheService,
    private readonly postRepository: PostRepository,
    private readonly objectRepository: ObjectRepository,
    private readonly commentRepository: CommentRepository,
    private readonly userExpertiseRepository: UserExpertiseRepository,
    private readonly hiveClient: HiveClient,
  ) {
    this.wsSetNotification =
      this.configService.get<string>('notificationsApi.wsSetNotification') ||
      'set';
  }

  private async sendNotification(
    operation: NotificationOperation,
  ): Promise<void> {
    const blockNumber = await this.blockCacheService.getBlockNumber();
    const reqData = {
      id: operation.id,
      block: blockNumber,
      data: operation.data,
    };
    this.sendSocketNotification(reqData);
  }

  private sendSocketNotification(operation: NotificationOperation): void {
    const message = JSON.stringify({
      method: this.wsSetNotification,
      payload: operation,
    });
    this.socketClient.sendMessage(message);
  }

  async reblog(params: ReblogParams): Promise<void> {
    const operation = {
      id: NOTIFICATION_ID.CUSTOM_JSON,
      data: {
        id: NOTIFICATION_ID.REBLOG,
        json: {
          account: params.account,
          author: params.author,
          permlink: params.permlink,
          title: params.title,
        },
      },
    };
    await this.sendNotification(operation);
  }

  async follow(params: FollowParams): Promise<void> {
    const operation = {
      id: NOTIFICATION_ID.CUSTOM_JSON,
      data: {
        id: NOTIFICATION_ID.FOLLOW,
        json: {
          follower: params.follower,
          following: params.following,
        },
      },
    };
    await this.sendNotification(operation);
  }

  async reply(
    operation: ReplyOperation,
    metadata?: { comment?: { userId?: string } },
  ): Promise<void> {
    let replyFlag = false;
    if (metadata?.comment?.userId) {
      operation.author = metadata.comment.userId;
    }

    const post = await this.postRepository.findOneByRootAuthorPermlink(
      operation.parent_author,
      operation.parent_permlink,
    );

    if (!post) {
      // If parent post - comment, find it at guest comments
      const comment = await this.commentRepository.findOneByAuthorPermlink(
        operation.parent_author,
        operation.parent_permlink,
      );
      if (comment) {
        operation.author = comment.guestInfo?.userId || operation.parent_author;
        replyFlag = true;
      } else {
        // Try to get from Hive blockchain
        const hivePost = await this.hiveClient.getContent(
          operation.parent_author,
          operation.parent_permlink,
        );
        if (hivePost && hivePost.depth) {
          const depth = parseInt(hivePost.depth, 10);
          if (!isNaN(depth) && depth >= 1) {
            replyFlag = true;
          }
        }
      }
    } else {
      operation.author = post.author || operation.parent_author;
    }

    operation.reply = replyFlag;
    const op = {
      id: NOTIFICATION_ID.COMMENT,
      data: operation as unknown as Record<string, unknown>,
    };
    await this.sendNotification(op);
  }

  async post(data: Record<string, unknown>): Promise<void> {
    const guestInfo = data.guestInfo as { userId?: string } | undefined;
    data.author = guestInfo?.userId || (data.author as string);
    const operation = {
      id: NOTIFICATION_ID.COMMENT,
      data,
    };
    await this.sendNotification(operation);
  }

  async custom(data: Record<string, unknown>): Promise<void> {
    const operation = {
      id: (data.id as string) || NOTIFICATION_ID.CUSTOM_JSON,
      data,
    };
    await this.sendNotification(operation);
  }

  async restaurantStatus(
    data: RestaurantStatusData,
    permlink: string,
    status?: string,
  ): Promise<void> {
    const wobject =
      await this.objectRepository.findOneByAuthorPermlink(permlink);
    if (!wobject) return;

    const wobjStatus =
      wobject.status &&
      typeof wobject.status === 'object' &&
      'title' in wobject.status
        ? String(wobject.status.title)
        : undefined;

    if (wobjStatus === status || (!wobjStatus && !status)) return;

    const experts =
      await this.userExpertiseRepository.findByAuthorPermlinkWithExpertiseUSD(
        permlink,
      );
    if (!experts || experts.length === 0) return;

    data.object_name = this.getNameFromFields(wobject.fields);
    data.experts = experts.map((expert) => expert.user_name);
    data.oldStatus = wobjStatus || '';
    data.newStatus = status || '';
    data.author_permlink = permlink;

    await this.sendNotification({
      id: NOTIFICATION_ID.RESTAURANT_STATUS,
      data: data as unknown as Record<string, unknown>,
    });
  }

  async rejectUpdate(data: RejectUpdateData): Promise<void> {
    const wobject = await this.objectRepository.findOneByAuthorPermlink(
      data.author_permlink,
    );
    if (!wobject) return;

    if (wobject.parent) {
      const parentWobj = await this.objectRepository.findOneByAuthorPermlink(
        wobject.parent,
      );
      if (parentWobj) {
        data.parent_permlink = wobject.parent;
        data.parent_name = this.getNameFromFields(parentWobj.fields);
      }
    }
    data.object_name = this.getNameFromFields(wobject.fields);

    await this.sendNotification({
      id: NOTIFICATION_ID.REJECT_UPDATE,
      data: data as unknown as Record<string, unknown>,
    });
  }

  private getNameFromFields(fields: ObjectField[]): string {
    const result = _.chain(fields)
      .filter((field) => field.name === FIELDS_NAMES.NAME)
      .sortBy('weight')
      .first()
      .value();
    return _.get(result, 'body', '');
  }

  private async publishLinkRatingUpdate(params: {
    wobject: { object_type: string; author_permlink: string };
    field: ObjectField;
  }): Promise<void> {
    if (params.wobject.object_type !== OBJECT_TYPES.LINK) return;
    if (params.field.name !== FIELDS_NAMES.RATING) return;

    const safetyTranslations = SUPPOSED_UPDATES_TRANSLATIONS.Safety;
    const fieldBody = params.field.body;
    const translationValues = Object.values(safetyTranslations) as string[];
    if (!translationValues.includes(fieldBody)) return;

    const redisClient = this.cacheService.getClient();
    await redisClient.publish(
      REDIS_KEYS.PUB_SUPPOSED_FIELD_UPDATE,
      `${params.field.name}:${params.wobject.author_permlink}`,
    );
  }

  async fieldUpdateNotification(params: FieldUpdateParams): Promise<void> {
    const wobject = await this.objectRepository.findOneByAuthorPermlink(
      params.authorPermlink,
    );
    if (!wobject) return;

    await this.publishLinkRatingUpdate({
      wobject: {
        object_type: wobject.object_type,
        author_permlink: wobject.author_permlink,
      },
      field: params.field,
    });

    const objectName = this.getNameFromFields(wobject.fields);

    const sendTo = _.uniq(
      [
        ...(wobject.authority?.ownership ?? []),
        ...(wobject.authority?.administrative ?? []),
      ].filter((el) => el !== params.field.creator),
    );

    if (params.field.name === FIELDS_NAMES.GROUP_ID) {
      const groupObjects = await this.objectRepository.findByMetaGroupId(
        wobject.metaGroupId,
      );

      const receivers = _.uniq(
        _.flatten(
          groupObjects.map((el) => [
            ...(el.authority?.administrative ?? []),
            ...(el.authority?.ownership ?? []),
          ]),
        ),
      ).filter((el) => el !== params.field.creator && !sendTo.includes(el));

      if (receivers.length > 0) {
        await this.sendNotification({
          id: params.reject
            ? NOTIFICATION_ID.GROUP_ID_UPDATES_REJECT
            : NOTIFICATION_ID.GROUP_ID_UPDATES,
          data: {
            receivers,
            objectName,
            authorPermlink: params.authorPermlink,
            initiator: params.initiator,
          },
        });
      }
    }

    if (sendTo.length === 0) return;

    await this.sendNotification({
      id: params.reject
        ? NOTIFICATION_ID.OBJECT_UPDATES_REJECT
        : NOTIFICATION_ID.OBJECT_UPDATES,
      data: {
        fieldName: params.field.name,
        receivers: sendTo,
        objectName,
        authorPermlink: params.authorPermlink,
        initiator: params.initiator,
      },
    });
  }
}
