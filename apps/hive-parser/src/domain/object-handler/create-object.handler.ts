import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { ObjectRepository } from '../../repositories';
import type { ObjectMethodHandler, ObjectMethodContext } from './interface';
import type { WaivioOperation } from '../hive-parser/schemas';
import type { ObjectDocument } from '@waivio-core-services/clients';
import {
  OBJECT_TYPES,
  OBJECT_TYPES_FOR_GROUP_ID,
  SUPPOSED_UPDATES_BY_TYPE,
  SUPPOSED_UPDATES_TRANSLATIONS,
  getPermlink,
} from '@waivio-core-services/common';
import { UserRestrictionService } from '../user-restrictions';
import { ImportUpdatesService } from '../import-updates';
import { DOMAIN_EVENTS } from '../events';

@Injectable()
export class CreateObjectHandler implements ObjectMethodHandler {
  private readonly logger = new Logger(CreateObjectHandler.name);

  constructor(
    private readonly objectRepository: ObjectRepository,
    private readonly userRestrictionService: UserRestrictionService,
    private readonly importUpdatesService: ImportUpdatesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handle(
    operation: WaivioOperation,
    ctx: ObjectMethodContext,
  ): Promise<void> {
    if (operation.method !== 'createObject') return;
    const { permlink, defaultName, creator, objectType, importId } =
      operation.params;

    // Check if author or creator is restricted (spam or muted)
    const usersToCheck = new Set([ctx.account, creator]);
    for (const user of usersToCheck) {
      const isRestricted = await this.userRestrictionService.isRestricted(user);
      if (isRestricted) {
        this.logger.warn(
          `User ${user} is restricted. Skipping object creation.`,
        );
        return;
      }
    }

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

    const createdObject = await this.objectRepository.create(createData);

    // Add supposed updates for the created object
    // Note: locale comes from operation.params, defaulting to 'en-US'
    const locale = operation.params.locale || 'en-US';
    await this.addSupposedUpdates(createdObject, locale);

    // Emit domain event for side effects (e.g. datafinity notification when importId present)
    this.eventEmitter.emit(DOMAIN_EVENTS.OBJECT_CREATED, {
      creator,
      author_permlink: permlink,
      importId,
    });
  }

  /**
   * Add supposed updates for a newly created object
   * Gets supposed updates from SUPPOSED_UPDATES_BY_TYPE and sends them to ImportService
   */
  private async addSupposedUpdates(
    wobject: ObjectDocument,
    locale: string,
  ): Promise<void> {
    if (!wobject.object_type) return;

    const supposedUpdates =
      SUPPOSED_UPDATES_BY_TYPE[
        wobject.object_type as keyof typeof SUPPOSED_UPDATES_BY_TYPE
      ];

    if (!supposedUpdates || supposedUpdates.length === 0) return;

    const importWobjData = {
      object_type: wobject.object_type,
      author_permlink: wobject.author_permlink,
      fields: [] as Array<{
        name: string;
        body: string;
        permlink?: string;
        locale: string;
        creator: string;
        id?: string;
        tagCategory?: string;
      }>,
    };

    for (const update of supposedUpdates) {
      const values = update.values || [];
      for (const value of values) {
        const translation =
          SUPPOSED_UPDATES_TRANSLATIONS[
            value as keyof typeof SUPPOSED_UPDATES_TRANSLATIONS
          ];
        const body =
          translation?.[locale as keyof typeof translation] ||
          translation?.['en-US'] ||
          value;

        const field: {
          name: string;
          body: string;
          permlink?: string;
          locale: string;
          creator: string;
          id?: string;
          tagCategory?: string;
        } = {
          name: update.name,
          body,
          permlink: getPermlink(
            `${wobject.author_permlink}-${update.name.toLowerCase()}-${this.randomString(5)}`,
            'supposed-update',
          ),
          creator: wobject.creator,
          locale,
        };

        if (update.id_path) {
          // Set id field (id_path is typically 'id')
          field.id = randomUUID();
          // For categoryItem fields with id_path='id', also set tagCategory to link to tagCategory field
          if (update.name === 'categoryItem' && update.id_path === 'id') {
            field.tagCategory = value;
          }
        }

        importWobjData.fields.push(field);
      }
    }

    if (importWobjData.fields.length > 0) {
      const result = await this.importUpdatesService.send([importWobjData]);
      if (result.error) {
        this.logger.warn(
          `Failed to send supposed updates for ${wobject.author_permlink}: ${result.error.message}`,
        );
      } else {
        this.logger.log(
          `Sent ${importWobjData.fields.length} supposed updates for ${wobject.author_permlink}`,
        );
      }
    }
  }

  private randomString(length = 5): string {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i += 1) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }
}
