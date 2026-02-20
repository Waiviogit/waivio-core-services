import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as _ from 'lodash';
import {
  ObjectRepository,
  AppRepository,
  DepartmentRepository,
  UserShopDeselectRepository,
} from '../../repositories';
import {
  FIELDS_NAMES,
  SEARCH_FIELDS,
  TAG_CLOUDS_UPDATE_COUNT,
  RATINGS_UPDATE_COUNT,
  SUPPOSED_UPDATES_BY_TYPE,
} from '@waivio-core-services/common';
import { ObjectProcessorService } from '@waivio-core-services/processors';
import { NotificationsService } from '../notifications';
import { CacheService } from '../cache';
import { JsonHelper } from '@waivio-core-services/common';
import { validateMap } from './helpers/specified-fields-validator';
import type {
  ObjectField,
  ObjectDocument,
} from '@waivio-core-services/clients';
import type { App, Wobject } from '@waivio-core-services/processors';
import { randomUUID } from 'node:crypto';

interface FieldUpdateParams {
  objectPermlink: string;
  fieldTransactionId: string;
  voter?: string;
  percent?: number;
}

@Injectable()
export class UpdateSpecificFieldsService {
  private readonly logger = new Logger(UpdateSpecificFieldsService.name);
  private readonly jsonHelper = new JsonHelper();

  constructor(
    private readonly objectRepository: ObjectRepository,
    private readonly appRepository: AppRepository,
    private readonly departmentRepository: DepartmentRepository,
    private readonly userShopDeselectRepository: UserShopDeselectRepository,
    private readonly objectProcessorService: ObjectProcessorService,
    private readonly notificationsService: NotificationsService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Main entry point: Update specific fields after a field is created/updated
   * Called after field append in UpdateObjectHandler
   */
  async update(params: FieldUpdateParams): Promise<void> {
    const { objectPermlink, fieldTransactionId, voter, percent } = params;

    // Get field by transactionId
    const field = await this.objectRepository.getFieldByTransactionId(
      objectPermlink,
      fieldTransactionId,
    );

    if (!field) {
      this.logger.warn(
        `Field not found: ${fieldTransactionId} on ${objectPermlink}`,
      );
      return;
    }

    // Get app
    const appHost = this.configService.get<string>('appHost') || 'waivio.com';
    const app = await this.appRepository.findOne({
      filter: { host: appHost },
    });

    if (!app) {
      this.logger.warn(`App not found: ${appHost}`);
      return;
    }

    // Convert app to lean App type
    const leanApp: App = {
      ...app,
      beneficiary: app.beneficiary ?? { account: 'waivio', percent: 500 },
      configuration: app.configuration ?? {},
      host: app.host,
      status: app.status ?? 'active',
      createdAt: app.createdAt ?? new Date(),
      updatedAt: app.updatedAt ?? new Date(),
    };

    // Get field-specific updater
    const updateHandler =
      this.updaterByFieldName[field.name] || this.updaterByFieldName.default;

    await updateHandler({
      field,
      objectPermlink,
      app: leanApp,
      voter,
      percent,
    });

    // Handle reject update notification if field weight is negative
    // Note: field.creator is available in ObjectField schema
    if (voter && field.creator !== voter && field.weight < 0) {
      const fieldWithVotes = await this.objectRepository.getFieldWithVotes(
        objectPermlink,
        fieldTransactionId,
      );

      if (!fieldWithVotes?.active_votes) return;

      const creatorVote = fieldWithVotes.active_votes.find(
        (v) => v.voter === field.creator,
      );
      if (!creatorVote) return;

      const voterVote = fieldWithVotes.active_votes.find(
        (v) => v.voter === voter,
      );
      if (!voterVote || voterVote.weight > 0) return;

      const newWeight = field.weight - voterVote.weight;
      if (newWeight >= 0) return;

      await this.notificationsService.rejectUpdate({
        creator: field.creator,
        voter: voter,
        author_permlink: objectPermlink,
        fieldName: field.name,
      });
    }
  }

  // Field-specific updaters
  private readonly updaterByFieldName: Record<
    string,
    (params: {
      field: ObjectField;
      objectPermlink: string;
      app: App;
      voter?: string;
      percent?: number;
    }) => Promise<void>
  > = {
    // Updater 1: Search fields only
    [FIELDS_NAMES.EMAIL]: async ({ field, objectPermlink }) => {
      await this.addSearchField({ objectPermlink, field });
    },
    [FIELDS_NAMES.PHONE]: async ({ field, objectPermlink }) => {
      await this.addSearchField({ objectPermlink, field });
    },
    [FIELDS_NAMES.ADDRESS]: async ({ field, objectPermlink }) => {
      await this.addSearchField({ objectPermlink, field });
    },
    [FIELDS_NAMES.COMPANY_ID]: async ({ field, objectPermlink }) => {
      await this.addSearchField({ objectPermlink, field });
    },
    [FIELDS_NAMES.PRODUCT_ID]: async ({ field, objectPermlink }) => {
      await this.addSearchField({ objectPermlink, field });
    },
    [FIELDS_NAMES.BRAND]: async ({ field, objectPermlink }) => {
      await this.addSearchField({ objectPermlink, field });
    },
    [FIELDS_NAMES.MANUFACTURER]: async ({ field, objectPermlink }) => {
      await this.addSearchField({ objectPermlink, field });
    },
    [FIELDS_NAMES.MERCHANT]: async ({ field, objectPermlink }) => {
      await this.addSearchField({ objectPermlink, field });
    },
    [FIELDS_NAMES.RECIPE_INGREDIENTS]: async ({ field, objectPermlink }) => {
      await this.addSearchField({ objectPermlink, field });
    },

    // Updater 2: Search fields + tags
    [FIELDS_NAMES.NAME]: async ({ field, objectPermlink, app }) => {
      await this.addSearchField({ objectPermlink, field });
      await this.createTags({ objectPermlink, field, app });
    },
    [FIELDS_NAMES.DESCRIPTION]: async ({ field, objectPermlink, app }) => {
      await this.addSearchField({ objectPermlink, field });
      await this.createTags({ objectPermlink, field, app });
    },
    [FIELDS_NAMES.TITLE]: async ({ field, objectPermlink, app }) => {
      await this.addSearchField({ objectPermlink, field });
      await this.createTags({ objectPermlink, field, app });
    },

    // Updater 3: Parent processing
    [FIELDS_NAMES.PARENT]: async ({ objectPermlink, app }) => {
      await this.processingParent(objectPermlink, app);
    },

    // Updater 4: Tag cloud
    [FIELDS_NAMES.TAG_CLOUD]: async ({ objectPermlink }) => {
      await this.updateTagCloud(objectPermlink);
    },

    // Updater 5: Rating
    [FIELDS_NAMES.RATING]: async ({ objectPermlink }) => {
      await this.updateRatings(objectPermlink);
    },

    // Updater 6: Map
    [FIELDS_NAMES.MAP]: async ({ objectPermlink, app }) => {
      await this.updateMap(objectPermlink, app);
    },

    // Updater 7: Status
    [FIELDS_NAMES.STATUS]: async ({ field, objectPermlink, voter }) => {
      await this.updateStatus({ field, objectPermlink, voter });
    },

    // Updater 8: Category item (search + tag categories)
    [FIELDS_NAMES.CATEGORY_ITEM]: async ({ field, objectPermlink }) => {
      await this.addSearchField({ objectPermlink, field });
      await this.updateTagCategories({ objectPermlink, field });
    },

    // Updater 9: Authority
    [FIELDS_NAMES.AUTHORITY]: async ({
      field,
      objectPermlink,
      voter,
      percent,
    }) => {
      await this.manageAuthorities({ field, objectPermlink, voter, percent });
    },

    // Updater 10: Authors/Publisher (search + children)
    [FIELDS_NAMES.AUTHORS]: async ({ field, objectPermlink }) => {
      await this.addSearchField({ objectPermlink, field });
      await this.updateChildrenSingle({ field, objectPermlink });
    },
    [FIELDS_NAMES.PUBLISHER]: async ({ field, objectPermlink }) => {
      await this.addSearchField({ objectPermlink, field });
      await this.updateChildrenSingle({ field, objectPermlink });
    },

    // Updater 11: Departments
    [FIELDS_NAMES.DEPARTMENTS]: async ({
      field,
      objectPermlink,
      app,
      percent,
    }) => {
      await this.manageDepartments({ field, objectPermlink, app, percent });
    },

    // Updater 12: Group ID (search + meta group)
    [FIELDS_NAMES.GROUP_ID]: async ({ field, objectPermlink }) => {
      await this.addSearchField({ objectPermlink, field });
      await this.updateMetaGroupId({ objectPermlink });
    },

    // Updater 13: List item
    [FIELDS_NAMES.LIST_ITEM]: async ({ field, objectPermlink }) => {
      await this.processListItem({ field, objectPermlink });
    },

    // Default: no-op
    default: async () => {
      // No specific update needed for this field type
    },
  };

  // Helper methods
  private async addSearchField(params: {
    objectPermlink: string;
    field: ObjectField;
  }): Promise<void> {
    const newWords = this.parseSearchData(params.field);
    if (!newWords || newWords.length === 0) return;

    await this.objectRepository.addSearchFields(
      params.objectPermlink,
      newWords,
    );
  }

  private parseSearchData(field: ObjectField): string[] | undefined {
    const fieldName = field?.name ?? '';
    const fieldBody = field?.body ?? '';

    if (!SEARCH_FIELDS.includes(fieldName as (typeof SEARCH_FIELDS)[number])) {
      return undefined;
    }

    const handler = this.searchDataByField[fieldName] || this.searchFromBody;
    return handler({ field, fieldBody });
  }

  private readonly searchDataByField: Record<
    string,
    (params: { field: ObjectField; fieldBody: string }) => string[]
  > = {
    [FIELDS_NAMES.NAME]: ({ fieldBody }) => [this.parseName(fieldBody)],
    [FIELDS_NAMES.EMAIL]: ({ fieldBody }) => [this.parseName(fieldBody)],
    [FIELDS_NAMES.CATEGORY_ITEM]: ({ fieldBody }) => [
      this.parseName(fieldBody),
    ],
    [FIELDS_NAMES.GROUP_ID]: ({ fieldBody }) => [this.parseName(fieldBody)],
    [FIELDS_NAMES.TITLE]: ({ fieldBody }) => [this.parseName(fieldBody)],
    [FIELDS_NAMES.DESCRIPTION]: ({ fieldBody }) => [this.parseName(fieldBody)],
    [FIELDS_NAMES.PHONE]: ({ field, fieldBody }) => {
      const phoneNumber =
        (field as ObjectField & { number?: string }).number ||
        fieldBody
          .replace(/[.%?+*|{}[\]()<>""^'"\\\-_=!&$:]+/g, '')
          .split(' ')
          .join('')
          .trim();
      return [this.createEdgeNGrams(phoneNumber)];
    },
    [FIELDS_NAMES.ADDRESS]: ({ fieldBody }) =>
      this.searchFromAddress(fieldBody),
    [FIELDS_NAMES.COMPANY_ID]: ({ fieldBody }) => this.searchFromId(fieldBody),
    [FIELDS_NAMES.PRODUCT_ID]: ({ fieldBody }) => this.searchFromId(fieldBody),
    [FIELDS_NAMES.AUTHORS]: ({ fieldBody }) =>
      this.searchBodyProperty(fieldBody),
    [FIELDS_NAMES.PUBLISHER]: ({ fieldBody }) =>
      this.searchBodyProperty(fieldBody),
    [FIELDS_NAMES.BRAND]: ({ fieldBody }) => this.searchBodyProperty(fieldBody),
    [FIELDS_NAMES.MANUFACTURER]: ({ fieldBody }) =>
      this.searchBodyProperty(fieldBody),
    [FIELDS_NAMES.MERCHANT]: ({ fieldBody }) =>
      this.searchBodyProperty(fieldBody),
    [FIELDS_NAMES.RECIPE_INGREDIENTS]: ({ fieldBody }) =>
      this.parseBodyArray(fieldBody),
  };

  private searchFromBody({ fieldBody }: { fieldBody: string }): string[] {
    return [this.parseName(fieldBody)];
  }

  private searchFromAddress(fieldBody: string): string[] {
    const parsed = this.parseAddress(fieldBody);
    if (parsed.err) return [];
    return parsed.addresses || [];
  }

  private searchFromId(fieldBody: string): string[] {
    const parsedBody = this.jsonHelper.parseJson(fieldBody, null) as {
      companyId?: string | number;
      productId?: string | number;
    } | null;
    if (!parsedBody) return [];
    const searchData = parsedBody.companyId ?? parsedBody.productId;
    if (!searchData) return [];
    return [this.parseName(String(searchData))];
  }

  private searchBodyProperty(fieldBody: string): string[] {
    const nameProperty = this.parseBodyProperty({
      body: fieldBody,
      propertyName: 'name',
    });
    if (nameProperty) return [nameProperty];
    return [];
  }

  private parseBodyProperty({
    body,
    propertyName,
  }: {
    body: string;
    propertyName: string;
  }): string | undefined {
    const parsedBody = this.jsonHelper.parseJson(body, null);
    if (!parsedBody) return;
    const property = _.get(parsedBody, propertyName);
    if (!property) return;
    return this.parseName(property);
  }

  private parseBodyArray(fieldBody: string): string[] {
    const parsedBody = this.jsonHelper.parseJson(fieldBody, null) as
      | string[]
      | null;
    if (!parsedBody?.length) return [];
    return parsedBody.map((el) => this.parseName(el));
  }

  private createEdgeNGrams(str: string): string {
    const minGram = 3;
    if (str && str.length <= minGram) return str;

    const arrayOfStrings: string[] = [];
    for (let i = minGram; i <= str.length; ++i) {
      arrayOfStrings.push(str.substr(0, i));
    }
    return arrayOfStrings.join(' ');
  }

  private parseName(rawName = ''): string {
    if (!rawName) return '';
    if (typeof rawName !== 'string') return '';

    return this.createEdgeNGrams(
      rawName
        .trim()
        .replace(/[.,%?+*|{}[\]()<>""^'"\\\-_=!&$:]/g, '')
        .replace(/  +/g, ' '),
    );
  }

  private parseAddress(addressFromDB: string): {
    addresses?: string[];
    err?: Error;
  } {
    let rawAddress: Record<string, string>;
    try {
      rawAddress = this.jsonHelper.parseJson(addressFromDB, null) as Record<
        string,
        string
      >;
    } catch (err) {
      return { err: err as Error };
    }

    let address = '';
    for (const key in rawAddress) {
      address += `${rawAddress[key]},`;
    }
    const addressWithoutSpaces = address
      .substr(0, address.length - 1)
      .replace(/^,*/g, '')
      .replace(/[,\s]{2,}/g, ',');
    const addressesInNgrams: string[] = [];
    for (const el of addressWithoutSpaces.split(',')) {
      addressesInNgrams.push(this.parseName(el));
    }

    return { addresses: addressesInNgrams };
  }

  // Field-specific update methods
  private async createTags(params: {
    objectPermlink: string;
    field: ObjectField;
    app: App;
  }): Promise<void> {
    // TODO: Implement tags creation - requires tagsParser service
    // This is used for restaurant/dish/drink object types
    this.logger.debug(
      `createTags not yet implemented for ${params.field.name} on ${params.objectPermlink}`,
    );
  }

  private async processingParent(
    objectPermlink: string,
    app: App,
  ): Promise<void> {
    const wobject =
      await this.objectRepository.findOneByAuthorPermlink(objectPermlink);
    if (!wobject) return;

    const processedWobject = await this.objectProcessorService.processWobjects({
      wobjects: [{ ...wobject }] as unknown as Wobject[],
      app,
      fields: [FIELDS_NAMES.PARENT],
      returnArray: false,
      locale: 'en-US',
    });

    const hasMap = wobject.fields.some(
      (field) => field.name === FIELDS_NAMES.MAP,
    );

    // Update data when there is no parent
    const updateData = hasMap ? { parent: '' } : { parent: '', map: null };
    if (!processedWobject || !(processedWobject as any).parent) {
      await this.objectRepository.updateObjectFields(
        objectPermlink,
        updateData,
      );
      return;
    }

    await this.objectRepository.updateObjectFields(objectPermlink, {
      parent: (processedWobject as any).parent,
    });

    if (hasMap) return;

    const parent = await this.objectRepository.findOneByAuthorPermlink(
      (processedWobject as any).parent,
    );
    if (!parent) return;

    const parentProcessed = await this.objectProcessorService.processWobjects({
      wobjects: [parent] as unknown as Wobject[],
      app,
      fields: [FIELDS_NAMES.MAP],
      returnArray: false,
      locale: 'en-US',
    });

    const map = (parentProcessed as any)?.map;
    if (map) {
      const parsedMap = this.parseMap(map);
      if (validateMap(parsedMap)) {
        await this.objectRepository.updateObjectFields(objectPermlink, {
          map: {
            type: 'Point',
            coordinates: [parsedMap.longitude, parsedMap.latitude],
          },
        });
      }
    }
  }

  private async updateTagCloud(objectPermlink: string): Promise<void> {
    const tagCloudFields = await this.objectRepository.getFieldsByName(
      objectPermlink,
      FIELDS_NAMES.TAG_CLOUD,
    );

    if (Array.isArray(tagCloudFields) && tagCloudFields.length > 0) {
      // Store tagClouds as a cached field (schema has strict: false, so this is allowed)
      await this.objectRepository.updateObjectFields(objectPermlink, {
        tagClouds: tagCloudFields.slice(0, TAG_CLOUDS_UPDATE_COUNT),
      } as any);
    }
  }

  private async updateRatings(objectPermlink: string): Promise<void> {
    const ratingFields = await this.objectRepository.getFieldsByName(
      objectPermlink,
      FIELDS_NAMES.RATING,
    );

    if (Array.isArray(ratingFields) && ratingFields.length > 0) {
      // Store ratings as a cached field (schema has strict: false, so this is allowed)
      await this.objectRepository.updateObjectFields(objectPermlink, {
        ratings: ratingFields.slice(0, RATINGS_UPDATE_COUNT),
      } as any);
    }
  }

  private parseMap(
    map: string,
  ): { latitude: number; longitude: number } | null {
    let parsedMap: { latitude?: number; longitude?: number };
    try {
      parsedMap = this.jsonHelper.parseJson(map, null) as {
        latitude?: number;
        longitude?: number;
      };
    } catch (mapParseError) {
      this.logger.error(
        `Error on parse "${FIELDS_NAMES.MAP}" field: ${mapParseError}`,
      );
      return null;
    }

    if (parsedMap?.latitude && parsedMap?.longitude) {
      parsedMap.latitude = Number(parsedMap.latitude);
      parsedMap.longitude = Number(parsedMap.longitude);
    }

    return parsedMap as { latitude: number; longitude: number } | null;
  }

  private async updateMap(objectPermlink: string, app: App): Promise<void> {
    const wobject =
      await this.objectRepository.findOneByAuthorPermlink(objectPermlink);
    if (!wobject) return;

    const processedWobject = await this.objectProcessorService.processWobjects({
      wobjects: [wobject] as unknown as Wobject[],
      app,
      fields: [FIELDS_NAMES.MAP],
      returnArray: false,
      locale: 'en-US',
    });

    const map = (processedWobject as any)?.map;
    if (map) {
      const parsedMap = this.parseMap(map);
      if (validateMap(parsedMap)) {
        await this.objectRepository.updateObjectFields(objectPermlink, {
          map: {
            type: 'Point',
            coordinates: [parsedMap.longitude, parsedMap.latitude],
          },
        });
        await this.setMapToChildren(objectPermlink, parsedMap);
      }
    }
  }

  private async setMapToChildren(
    authorPermlink: string,
    map: { latitude: number; longitude: number },
  ): Promise<void> {
    const children =
      await this.objectRepository.findChildrenWithoutMap(authorPermlink);

    if (children.length > 0) {
      const childrenPermlinks = children.map((c) => c.author_permlink);
      await this.objectRepository.updateManyObjects(
        { author_permlink: { $in: childrenPermlinks } },
        {
          map: {
            type: 'Point',
            coordinates: [map.longitude, map.latitude],
          },
        } as any,
      );
    }
  }

  private async updateStatus(params: {
    field: ObjectField;
    objectPermlink: string;
    voter?: string;
  }): Promise<void> {
    const statusFields = await this.objectRepository.getFieldsByName(
      params.objectPermlink,
      FIELDS_NAMES.STATUS,
    );

    const statusField = statusFields.find((f) => {
      try {
        const parsed = this.jsonHelper.parseJson(f.body, null) as {
          title?: string;
        } | null;
        return !!parsed?.title;
      } catch {
        return false;
      }
    });

    if (statusField) {
      const statusData = this.jsonHelper.parseJson(statusField.body, null) as {
        title: string;
      } | null;
      if (statusData) {
        await this.notificationsService.restaurantStatus(
          {
            voter: params.voter || params.field.creator,
          } as any,
          params.objectPermlink,
          statusData.title,
        );
        await this.objectRepository.updateObjectFields(params.objectPermlink, {
          status: statusData,
        });
      }
    } else {
      await this.notificationsService.restaurantStatus(
        {
          voter: params.voter,
        } as any,
        params.objectPermlink,
        '',
      );
      await this.objectRepository.updateObjectFields(params.objectPermlink, {
        $unset: { status: '' },
      } as any);
    }

    await this.checkForListItemsCounters(params.objectPermlink);
  }

  private async checkForListItemsCounters(
    authorPermlink: string,
  ): Promise<void> {
    const wobject = await this.objectRepository.findOne({
      filter: {
        'fields.name': FIELDS_NAMES.LIST_ITEM,
        'fields.body': authorPermlink,
      },
      projection: { _id: 1 },
    });

    if (wobject) {
      // TODO: Implement listItemProcess.send - requires external service
      this.logger.debug(
        `listItemProcess.send not yet implemented for ${authorPermlink}`,
      );
    }
  }

  private async updateTagCategories(params: {
    objectPermlink: string;
    field: ObjectField;
  }): Promise<void> {
    const wobject = await this.objectRepository.findOneByAuthorPermlink(
      params.objectPermlink,
    );
    if (!wobject) return;

    const supposedUpdates = this.getTagCategoryToUpdate(wobject.object_type);
    if (!supposedUpdates.includes(params.field.tagCategory || '')) return;

    // TODO: Implement incrementTag - requires Redis sorted sets support
    this.logger.debug(
      `incrementTag not yet implemented for ${params.field.tagCategory}`,
    );

    const departments = (wobject as any).departments as string[] | undefined;
    if (!departments || departments.length === 0) return;

    for (const department of departments) {
      // TODO: Implement incrementDepartmentTag - requires Redis sorted sets support
      this.logger.debug(
        `incrementDepartmentTag not yet implemented for ${department}`,
      );
    }
  }

  private getTagCategoryToUpdate(objectType: string): string[] {
    const supposedUpdate =
      SUPPOSED_UPDATES_BY_TYPE[
        objectType as keyof typeof SUPPOSED_UPDATES_BY_TYPE
      ];
    if (!supposedUpdate) return [];

    const tagCategoryUpdate = supposedUpdate.find(
      (u) => u.name === 'tagCategory',
    );
    return tagCategoryUpdate?.values || [];
  }

  private async manageAuthorities(params: {
    field: ObjectField;
    objectPermlink: string;
    voter?: string;
    percent?: number;
  }): Promise<void> {
    if (!params.voter || params.field.creator === params.voter) {
      if (params.percent && params.percent <= 0) {
        await this.objectRepository.updateObjectFields(params.objectPermlink, {
          $pull: {
            [`authority.${params.field.body}`]: params.field.creator,
          },
        } as any);

        await this.userShopDeselectRepository.create({
          authorPermlink: params.objectPermlink,
          userName: params.field.creator,
        });
      } else if (
        !params.percent ||
        (typeof params.percent === 'number' && params.percent > 0)
      ) {
        await this.objectRepository.updateObjectFields(params.objectPermlink, {
          $addToSet: {
            [`authority.${params.field.body}`]: params.field.creator,
          },
        } as any);

        await this.userShopDeselectRepository.deleteOne({
          filter: {
            authorPermlink: params.objectPermlink,
            userName: params.field.creator,
          },
        });
      }
    }
  }

  private async updateChildrenSingle(params: {
    field: ObjectField;
    objectPermlink: string;
  }): Promise<void> {
    const body = this.jsonHelper.parseJson(params.field.body, null) as {
      authorPermlink?: string;
    } | null;
    if (!body || !body.authorPermlink) return;

    await this.addChildrenToObjects({
      permlinks: [body.authorPermlink],
      childrenPermlink: params.objectPermlink,
    });
  }

  private async addChildrenToObjects(params: {
    permlinks: string[];
    childrenPermlink: string;
  }): Promise<void> {
    await this.objectRepository.updateManyObjects(
      { author_permlink: { $in: params.permlinks } },
      {
        $addToSet: { children: params.childrenPermlink },
      } as any,
    );
  }

  private async manageDepartments(params: {
    field: ObjectField;
    objectPermlink: string;
    app: App;
    percent?: number;
  }): Promise<void> {
    const wobject = await this.objectRepository.findOneByAuthorPermlink(
      params.objectPermlink,
    );
    if (!wobject) return;

    const sameDepartmentFields = wobject.fields.filter(
      (f) =>
        f.name === FIELDS_NAMES.DEPARTMENTS && f.body === params.field.body,
    );

    const related = wobject.fields.filter(
      (f) =>
        f.name === FIELDS_NAMES.DEPARTMENTS && f.body !== params.field.body,
    );
    const relatedNames = related.map((f) => f.body);

    if (params.percent && params.percent <= 0) {
      await this.removeFromDepartments({
        objectPermlink: params.objectPermlink,
        department: params.field.body,
        relatedNames,
        wobject,
        app: params.app,
      });
      return;
    }

    const department = await this.departmentRepository.findOneOrCreateByName({
      name: params.field.body,
      search: this.parseName(params.field.body),
    });

    const needUpdateCount = sameDepartmentFields.length === 1;
    const objectsCount = await this.objectRepository.departmentUniqCount(
      params.field.body,
    );

    await this.objectRepository.updateObjectFields(params.objectPermlink, {
      $addToSet: { departments: department.name },
    } as any);

    await this.departmentRepository.updateDepartmentOne({
      filter: { name: params.field.body },
      update: {
        ...(needUpdateCount && objectsCount && { $set: { objectsCount } }),
        $addToSet: { related: { $each: relatedNames } },
      },
    });

    if (relatedNames.length > 0) {
      await this.departmentRepository.updateDepartmentMany({
        filter: { name: { $in: relatedNames } },
        update: {
          $addToSet: { related: params.field.body },
        },
      });
    }

    const supposedUpdates = this.getTagCategoryToUpdate(wobject.object_type);
    if (supposedUpdates.length === 0) return;

    const tagFields = wobject.fields.filter((f) =>
      supposedUpdates.includes(f.tagCategory || ''),
    );

    for (const tagField of tagFields) {
      // TODO: Implement incrementDepartmentTag - requires Redis sorted sets support
      this.logger.debug(
        `incrementDepartmentTag not yet implemented for ${tagField.tagCategory}`,
      );
    }
  }

  private async removeFromDepartments(params: {
    objectPermlink: string;
    department: string;
    relatedNames: string[];
    wobject: ObjectDocument;
    app: App;
  }): Promise<void> {
    const processed = await this.objectProcessorService.processWobjects({
      wobjects: [params.wobject] as unknown as Wobject[],
      app: params.app,
      fields: [FIELDS_NAMES.DEPARTMENTS],
      returnArray: false,
      locale: 'en-US',
    });

    const notRejected = (processed as any)?.departments?.find(
      (d: any) => d.body === params.department,
    );
    if (notRejected) return;

    await this.objectRepository.updateObjectFields(params.objectPermlink, {
      $pull: { departments: params.department },
    } as any);

    for (const relatedEl of params.relatedNames) {
      const result = await this.objectRepository.findOne({
        filter: { departments: { $all: [params.department, relatedEl] } },
        projection: { _id: 1 },
      });

      if (!result) {
        await this.departmentRepository.updateDepartmentOne({
          filter: { name: relatedEl },
          update: {
            $pull: { related: params.department },
          },
        });

        await this.departmentRepository.updateDepartmentOne({
          filter: { name: params.department },
          update: {
            $pull: { related: relatedEl },
          },
        });
      }
    }
  }

  private async updateMetaGroupId(params: {
    objectPermlink: string;
  }): Promise<void> {
    const wobject = await this.objectRepository.findOneByAuthorPermlink(
      params.objectPermlink,
    );
    if (!wobject) return;

    const metaGroupId = wobject.metaGroupId || randomUUID();
    const groupIds = this.getObjectGroupIds(wobject);

    await this.addToAllMetaGroup({ groupIds, metaGroupId });
  }

  private getObjectGroupIds(wobject: any): string[] {
    return wobject.fields
      .filter((f: ObjectField) => f.name === FIELDS_NAMES.GROUP_ID)
      .map((f: ObjectField) => f.body);
  }

  private async addToAllMetaGroup(params: {
    groupIds: string[];
    metaGroupId: string;
  }): Promise<void> {
    let currentGroupIds = [...params.groupIds];

    while (true) {
      const result =
        await this.objectRepository.findByGroupIdsExcludingMetaGroup(
          currentGroupIds,
          params.metaGroupId,
        );

      if (!result || result.length === 0) break;

      for (const resultElement of result) {
        const newGroupIds = this.getObjectGroupIds(resultElement);
        currentGroupIds = _.uniq([...currentGroupIds, ...newGroupIds]);
      }

      const permlinks = result.map((r) => r.author_permlink);
      await this.objectRepository.updateManyObjects(
        { author_permlink: { $in: permlinks } },
        { metaGroupId: params.metaGroupId } as any,
      );
    }
  }

  private async processListItem(params: {
    field: ObjectField;
    objectPermlink: string;
  }): Promise<void> {
    // TODO: Implement listItemProcess.send - requires external service
    this.logger.debug(
      `listItemProcess.send not yet implemented for ${params.objectPermlink}`,
    );
  }
}
