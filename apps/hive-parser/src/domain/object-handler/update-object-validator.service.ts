import { Injectable, Logger } from '@nestjs/common';
import { ObjectRepository, PostRepository } from '../../repositories';
import type { ObjectDocument } from '@waivio-core-services/clients';
import {
  FIELDS_NAMES,
  OBJECT_TYPES,
  EXPOSED_FIELDS_FOR_OBJECT_TYPE,
  AUTHORITY_FIELD_ENUM,
  JsonHelper,
} from '@waivio-core-services/common';
import { UserRestrictionService } from '../user-restrictions';
import {
  optionsSchema,
  weightSchema,
  dimensionsSchema,
  featuresSchema,
  namePermlinkSchema,
  widgetSchema,
  newsFeedSchema,
  departmentsSchema,
  shopFilterSchema,
  menuItemSchema,
  validUrlSchema,
  affiliateProductIdTypesSchema,
  affiliateCodeSchema,
  affiliateGeoSchema,
  mapTypesSchema,
  mapViewSchema,
  mapRectanglesSchema,
  walletAddressSchema,
  timeLimitedSchema,
} from './schemas/field-validation.schemas';
import {
  validateMap,
  validateNewsFilter,
} from './helpers/specified-fields-validator';

export interface FieldToValidate {
  name: string;
  body: string;
  locale: string;
  author: string;
  creator: string;
  transactionId?: string;
  id?: string;
  startDate?: number;
  endDate?: number;
}

export interface ValidationContext {
  objectPermlink: string;
  field: FieldToValidate;
}

const CANT_APPEND_MESSAGE =
  "Can't append object, the same field already exists";

// Helper function to get object types that support a specific field
function getTypesForField(fieldName: string): string[] {
  const types: string[] = [];
  for (const [objectType, fields] of Object.entries(
    EXPOSED_FIELDS_FOR_OBJECT_TYPE,
  )) {
    if (fields.includes(fieldName as any)) {
      types.push(objectType);
    }
  }
  return types;
}

// Helper to create reversed JSON string array for productId validation
function createReversedJSONStringArray(
  input: string,
  jsonHelper: JsonHelper,
): string[] {
  const jsonObject = jsonHelper.parseJson<Record<string, unknown>>(input, null);
  if (!jsonObject) return [input];
  const reversedJsonObject: Record<string, unknown> = {};
  const keys = Object.keys(jsonObject).reverse();
  for (const key of keys) {
    reversedJsonObject[key] = jsonObject[key];
  }
  return [input, JSON.stringify(reversedJsonObject)];
}

// Helper to check if objects are equal by specific fields
function areFieldsEqual(
  field1: Partial<FieldToValidate>,
  field2: Partial<FieldToValidate>,
  uniqueFields: string[],
): boolean {
  for (const field of uniqueFields) {
    if (
      field1[field as keyof FieldToValidate] !==
      field2[field as keyof FieldToValidate]
    ) {
      return false;
    }
  }
  return true;
}

@Injectable()
export class UpdateObjectValidatorService {
  private readonly logger = new Logger(UpdateObjectValidatorService.name);

  constructor(
    private readonly objectRepository: ObjectRepository,
    private readonly postRepository: PostRepository,
    private readonly jsonHelper: JsonHelper,
    private readonly userRestrictionService: UserRestrictionService,
  ) {}

  /**
   * Check if a user is restricted (spam or muted by global accounts)
   * Should be called before validateSameFields and validateSpecifiedFields.
   *
   * @param username - The username to check
   * @returns true if user is NOT restricted (allowed), false if restricted (blocked)
   */
  async validateUserOnBlacklist(username: string): Promise<boolean> {
    const isRestricted =
      await this.userRestrictionService.isRestricted(username);
    if (isRestricted) {
      this.logger.warn(
        `User ${username} is restricted (spam or muted by global accounts)`,
      );
      return false;
    }
    return true;
  }

  async validateSameFields(context: ValidationContext): Promise<boolean> {
    const { objectPermlink, field } = context;
    const wobject =
      await this.objectRepository.findOneByAuthorPermlink(objectPermlink);

    if (!wobject) {
      this.logger.warn(
        `Object with author_permlink "${objectPermlink}" not found`,
      );
      return false;
    }

    // Special handling for PRODUCT_ID and COMPANY_ID
    if (
      [FIELDS_NAMES.PRODUCT_ID, FIELDS_NAMES.COMPANY_ID].includes(
        field.name as any,
      )
    ) {
      return this.validateSameFieldsProductId(field, wobject);
    }

    // Special handling for URL field on LINK objects
    if (field.name === FIELDS_NAMES.URL) {
      return this.validateSameFieldsUrl(wobject);
    }

    // Determine unique fields based on field name
    const setUniqFields: string[] = ['name', 'body', 'locale'];

    if (
      [
        FIELDS_NAMES.CATEGORY_ITEM,
        FIELDS_NAMES.GALLERY_ALBUM,
        FIELDS_NAMES.GALLERY_ITEM,
      ].includes(field.name as any)
    ) {
      setUniqFields.push('id');
    }

    if (
      [FIELDS_NAMES.AFFILIATE_CODE, FIELDS_NAMES.AUTHORITY].includes(
        field.name as any,
      )
    ) {
      setUniqFields.push('creator');
    }

    if (
      [FIELDS_NAMES.PROMOTION, FIELDS_NAMES.SALE].includes(field.name as any)
    ) {
      setUniqFields.push('startDate', 'endDate');
    }

    if (field.name === FIELDS_NAMES.PHONE) {
      setUniqFields.splice(1, 1, 'number');
    }

    if (field.name === FIELDS_NAMES.LIST_ITEM) {
      setUniqFields.splice(2, 1);
    }

    // Check for duplicate fields
    const existingFields = wobject.fields || [];
    for (const existingField of existingFields) {
      if (
        areFieldsEqual(field, existingField as FieldToValidate, setUniqFields)
      ) {
        this.logger.warn(
          `${CANT_APPEND_MESSAGE}: field "${field.name}" with same values already exists`,
        );
        return false;
      }
    }

    return true;
  }

  private validateSameFieldsProductId(
    field: FieldToValidate,
    wobject: ObjectDocument,
  ): boolean {
    const existingFields = wobject.fields || [];
    for (const body of createReversedJSONStringArray(
      field.body,
      this.jsonHelper,
    )) {
      const newField = { ...field, body };
      const same = existingFields.find((existingField) =>
        areFieldsEqual(newField, existingField as FieldToValidate, [
          'name',
          'body',
          'locale',
        ]),
      );
      if (same) {
        this.logger.warn(
          `${CANT_APPEND_MESSAGE}: ${field.name} with same productId already exists`,
        );
        return false;
      }
    }
    return true;
  }

  private validateSameFieldsUrl(wobject: ObjectDocument): boolean {
    if (wobject.object_type !== OBJECT_TYPES.LINK) {
      this.logger.warn(
        `${CANT_APPEND_MESSAGE}: URL field can only be added to LINK object type`,
      );
      return false;
    }
    const hasUrlField = wobject.fields?.some(
      (field) => field.name === FIELDS_NAMES.URL,
    );
    if (hasUrlField) {
      this.logger.warn(
        `${CANT_APPEND_MESSAGE}: URL field already exists for this LINK object`,
      );
      return false;
    }
    return true;
  }

  async validateSpecifiedFields(context: ValidationContext): Promise<boolean> {
    const { field } = context;
    const fieldName = field.name;

    if (!Object.values(FIELDS_NAMES).includes(fieldName as any)) {
      this.logger.warn(`Can't append ${fieldName}: invalid field name`);
      return false;
    }

    const validator =
      this.validationStrategies[
        fieldName as keyof typeof this.validationStrategies
      ];
    if (validator) {
      return await validator(context);
    }

    return true;
  }

  private validationStrategies = {
    [FIELDS_NAMES.PARENT]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { objectPermlink, field } = context;
      const parentWobject = await this.objectRepository.findOneByAuthorPermlink(
        field.body,
      );
      if (!parentWobject) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.PARENT} ${field.body}, wobject should exist`,
        );
        return false;
      }
      if (objectPermlink === field.body) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.PARENT} ${field.body}, wobject cannot be a parent to itself`,
        );
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.NEWS_FILTER]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const newsFilter = this.jsonHelper.parseJson<unknown>(field.body, null);
      if (!newsFilter) {
        this.logger.warn(
          `Error on parse "${FIELDS_NAMES.NEWS_FILTER}" field: invalid JSON`,
        );
        return false;
      }
      if (!validateNewsFilter(newsFilter as any)) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.NEWS_FILTER} ${field.body}, not valid data`,
        );
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.MAP]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const map = this.jsonHelper.parseJson<unknown>(field.body, null);
      if (!map) {
        this.logger.warn(
          `Error on parse "${FIELDS_NAMES.MAP}" field: invalid JSON`,
        );
        return false;
      }
      const mapData = map as { latitude?: number; longitude?: number };
      if (mapData.latitude && mapData.longitude) {
        mapData.latitude = Number(mapData.latitude);
        mapData.longitude = Number(mapData.longitude);
      }
      if (!validateMap(mapData)) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.MAP} ${field.body}, not valid data`,
        );
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.TAG_CATEGORY]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { objectPermlink, field } = context;
      if (!field.id) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.TAG_CATEGORY} ${field.body}, "id" is required`,
        );
        return false;
      }
      const tagCategoryWobj =
        await this.objectRepository.findOneByAuthorPermlink(objectPermlink);
      const existCategory = tagCategoryWobj?.fields?.find(
        (f) => f.id === field.id && f.name === FIELDS_NAMES.TAG_CATEGORY,
      );
      if (existCategory) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.TAG_CATEGORY} ${field.body}, category with the same "id" exists`,
        );
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.CATEGORY_ITEM]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { objectPermlink, field } = context;
      if (!field.id) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.CATEGORY_ITEM} ${field.body}, "id" is required`,
        );
        return false;
      }
      const existTag = await this.objectRepository.findOneByAuthorPermlink(
        field.body,
      );
      if (existTag?.object_type !== OBJECT_TYPES.HASHTAG) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.CATEGORY_ITEM} ${field.body}, Hashtag not valid!`,
        );
        return false;
      }

      const categoryItemWobj =
        await this.objectRepository.findOneByAuthorPermlink(objectPermlink);
      const parentCategory = categoryItemWobj?.fields?.find(
        (f) => f.name === FIELDS_NAMES.TAG_CATEGORY && f.id === field.id,
      );
      if (!parentCategory) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.CATEGORY_ITEM} ${field.body}, "${FIELDS_NAMES.TAG_CATEGORY}" with the same "id" doesn't exist`,
        );
        return false;
      }
      const existItem = categoryItemWobj?.fields?.find(
        (f) =>
          f.name === FIELDS_NAMES.CATEGORY_ITEM &&
          f.body === field.body &&
          f.id === field.id,
      );
      if (existItem) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.CATEGORY_ITEM} ${field.body}, item with the same "id" and "body" exist`,
        );
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.AUTHORITY]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { objectPermlink, field } = context;
      if (!Object.values(AUTHORITY_FIELD_ENUM).includes(field.body as any)) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.AUTHORITY} ${field.body}, not valid!`,
        );
        return false;
      }
      // Check if same authority field from same creator exists
      const wobject =
        await this.objectRepository.findOneByAuthorPermlink(objectPermlink);
      const existingField = wobject?.fields?.find(
        (f) =>
          f.name === FIELDS_NAMES.AUTHORITY &&
          f.creator === field.creator &&
          f.body === field.body,
      );
      if (existingField) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.AUTHORITY} the same field from this creator is exists`,
        );
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.COMPANY_ID]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { objectPermlink } = context;
      const companyObject =
        await this.objectRepository.findOneByAuthorPermlink(objectPermlink);
      if (
        !companyObject ||
        !getTypesForField(FIELDS_NAMES.COMPANY_ID).includes(
          companyObject.object_type,
        )
      ) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.COMPANY_ID} as the object type is not corresponding`,
        );
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.PRODUCT_ID]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { objectPermlink, field } = context;
      const companyObject =
        await this.objectRepository.findOneByAuthorPermlink(objectPermlink);
      if (
        !companyObject ||
        !getTypesForField(FIELDS_NAMES.PRODUCT_ID).includes(
          companyObject.object_type,
        )
      ) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.PRODUCT_ID} as the object type is not corresponding`,
        );
        return false;
      }
      return await this.validateProductId(field.body);
    },

    [FIELDS_NAMES.GROUP_ID]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { objectPermlink } = context;
      const companyObject =
        await this.objectRepository.findOneByAuthorPermlink(objectPermlink);
      if (
        !companyObject ||
        !getTypesForField(FIELDS_NAMES.GROUP_ID).includes(
          companyObject.object_type,
        )
      ) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.GROUP_ID} as the object type is not corresponding`,
        );
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.OPTIONS]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const parsed = this.jsonHelper.parseJson(field.body, null);
      const result = optionsSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.OPTIONS}${result.error.message}`,
        );
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.WEIGHT]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const parsed = this.jsonHelper.parseJson(field.body, null);
      const result = weightSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.WEIGHT}${result.error.message}`,
        );
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.DIMENSIONS]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const parsed = this.jsonHelper.parseJson(field.body, null);
      const result = dimensionsSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.DIMENSIONS}${result.error.message}`,
        );
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.AUTHORS]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const notValid = await this.validateAuthorsField(field.body);
      if (notValid) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.AUTHORS}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.PUBLISHER]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const notValid = await this.validatePublisherField(field.body);
      if (notValid) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.PUBLISHER}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.PRINT_LENGTH]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      if (isNaN(Number(field.body))) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.PRINT_LENGTH}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.WIDGET]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const parsed = this.jsonHelper.parseJson(field.body, null);
      const result = widgetSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.WIDGET}${result.error.message}`,
        );
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.NEWS_FEED]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const parsed = this.jsonHelper.parseJson(field.body, null);
      const result = newsFeedSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.NEWS_FEED}${result.error.message}`,
        );
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.DEPARTMENTS]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const parsed = this.jsonHelper.parseJson(field.body, null);
      const result = departmentsSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.DEPARTMENTS}${result.error.message}`,
        );
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.MANUFACTURER]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const notValid = await this.nameOrPermlinkValidation(field.body, [
        OBJECT_TYPES.BUSINESS,
      ]);
      if (notValid) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.MANUFACTURER}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.MERCHANT]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const notValid = await this.nameOrPermlinkValidation(field.body, [
        OBJECT_TYPES.BUSINESS,
      ]);
      if (notValid) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.MERCHANT}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.BRAND]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const notValid = await this.nameOrPermlinkValidation(field.body, [
        OBJECT_TYPES.BUSINESS,
      ]);
      if (notValid) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.BRAND}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.FEATURES]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const parsed = this.jsonHelper.parseJson(field.body, null);
      const result = featuresSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.FEATURES}${result.error.message}`,
        );
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.PIN]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const notPost = await this.postLinkValidation(field.body);
      if (notPost) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.PIN}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.REMOVE]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const notPost = await this.postLinkValidation(field.body);
      if (notPost) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.REMOVE}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.SHOP_FILTER]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const parsed = this.jsonHelper.parseJson(field.body, null);
      const result = shopFilterSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.SHOP_FILTER}${result.error.message}`,
        );
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.MENU_ITEM]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const notValid = await this.menuItemValidation(field.body);
      if (notValid) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.MENU_ITEM}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.RELATED]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const notValid = await this.permlinkValidation(field.body);
      if (notValid) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.RELATED}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.ADD_ON]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const notValid = await this.permlinkValidation(field.body);
      if (notValid) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.ADD_ON}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.SIMILAR]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const notValid = await this.permlinkValidation(field.body);
      if (notValid) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.SIMILAR}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.FEATURED]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const notValid = await this.permlinkValidation(field.body);
      if (notValid) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.FEATURED}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.AFFILIATE_BUTTON]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const result = validUrlSchema.safeParse(field.body);
      if (!result.success) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.AFFILIATE_BUTTON}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.AFFILIATE_PRODUCT_ID_TYPES]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const result = affiliateProductIdTypesSchema.safeParse(field.body);
      if (!result.success) {
        this.logger.warn(
          `Can't append ${FIELDS_NAMES.AFFILIATE_PRODUCT_ID_TYPES}`,
        );
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.AFFILIATE_GEO_AREA]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const result = affiliateGeoSchema.safeParse(field.body);
      if (!result.success) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.AFFILIATE_GEO_AREA}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.AFFILIATE_URL_TEMPLATE]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      if (!this.hasProductIdAndAffiliateCode(field.body)) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.AFFILIATE_URL_TEMPLATE}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.AFFILIATE_CODE]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const parsed = this.jsonHelper.parseJson(field.body, null);
      const result = affiliateCodeSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.AFFILIATE_CODE}`);
        return false;
      }
      const codes = Array.isArray(parsed) ? parsed.slice(1) : [];
      if (codes.length > 1) {
        const validChance = this.affiliateCodesChanceValid(codes);
        if (!validChance) {
          this.logger.warn(`Can't append ${FIELDS_NAMES.AFFILIATE_CODE}`);
          return false;
        }
      }
      return true;
    },

    [FIELDS_NAMES.MAP_OBJECT_TAGS]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const parsed = this.jsonHelper.parseJson(field.body, null);
      const uniqueParsed = Array.isArray(parsed)
        ? Array.from(new Set(parsed))
        : parsed;
      const result = mapTypesSchema.safeParse(uniqueParsed);
      if (!result.success) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.MAP_OBJECT_TAGS}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.MAP_OBJECT_TYPES]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const parsed = this.jsonHelper.parseJson(field.body, null);
      const uniqueParsed = Array.isArray(parsed)
        ? Array.from(new Set(parsed))
        : parsed;
      const result = mapTypesSchema.safeParse(uniqueParsed);
      if (!result.success) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.MAP_OBJECT_TYPES}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.MAP_MOBILE_VIEW]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const parsed = this.jsonHelper.parseJson(field.body, null);
      const result = mapViewSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.MAP_MOBILE_VIEW}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.MAP_DESKTOP_VIEW]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const parsed = this.jsonHelper.parseJson(field.body, null);
      const result = mapViewSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.MAP_DESKTOP_VIEW}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.MAP_RECTANGLES]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const parsed = this.jsonHelper.parseJson(field.body, null);
      const result = mapRectanglesSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.MAP_RECTANGLES}`);
        return false;
      }
      // Filter overlapping rectangles
      const filtered = this.filterMapRectangles(
        result.data as Array<{ topPoint: number[]; bottomPoint: number[] }>,
      );
      context.field.body = JSON.stringify(filtered);
      return true;
    },

    [FIELDS_NAMES.WALLET_ADDRESS]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const parsed = this.jsonHelper.parseJson(field.body, null);
      const result = walletAddressSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.WALLET_ADDRESS}`);
        return false;
      }
      return true;
    },

    [FIELDS_NAMES.SALE]: async (
      context: ValidationContext,
    ): Promise<boolean> => {
      const { field } = context;
      const result = timeLimitedSchema.safeParse(field);
      if (!result.success) {
        this.logger.warn(`Can't append ${FIELDS_NAMES.SALE}`);
        return false;
      }
      return true;
    },
  };

  // Helper methods
  private async validateProductId(body: string): Promise<boolean> {
    const productId = this.jsonHelper.parseJson<{
      productIdType?: string;
      productIdImage?: string;
      productId?: string;
    }>(body, null);

    if (!productId) {
      this.logger.warn(
        `Error on parse "${FIELDS_NAMES.PRODUCT_ID}" field: invalid JSON`,
      );
      return false;
    }

    if (!productId.productIdType) {
      this.logger.warn(
        `Error on "${FIELDS_NAMES.PRODUCT_ID}: product ID type is not provided"`,
      );
      return false;
    }

    if (productId.productIdImage) {
      try {
        new URL(productId.productIdImage);
      } catch {
        this.logger.warn(
          `Error on "${FIELDS_NAMES.PRODUCT_ID}: product ID image is not a link"`,
        );
        return false;
      }
    }
    return true;
  }

  private async validateAuthorsField(body: string): Promise<boolean> {
    const authors = this.jsonHelper.parseJson(body, null);
    if (!authors) return true;
    const result = namePermlinkSchema.safeParse(authors);
    if (!result.success) return true;
    if (!result.data.authorPermlink) return false;

    const wobject = await this.objectRepository.findOneByAuthorPermlink(
      result.data.authorPermlink,
    );
    if (!wobject || wobject.object_type !== OBJECT_TYPES.PERSON) {
      return true;
    }
    return false;
  }

  private async validatePublisherField(body: string): Promise<boolean> {
    const publisher = this.jsonHelper.parseJson(body, null);
    if (!publisher) return true;
    const result = namePermlinkSchema.safeParse(publisher);
    if (!result.success) return true;
    if (!result.data.authorPermlink) return false;

    const wobject = await this.objectRepository.findOneByAuthorPermlink(
      result.data.authorPermlink,
    );
    if (!wobject || wobject.object_type !== OBJECT_TYPES.BUSINESS) {
      return true;
    }
    return false;
  }

  private async menuItemValidation(body: string): Promise<boolean> {
    const parsedBody = this.jsonHelper.parseJson(body, null);
    if (!parsedBody) return true;
    const result = menuItemSchema.safeParse(parsedBody);
    if (!result.success) return true;
    if (!result.data.linkToObject) return false;

    const wobject = await this.objectRepository.findOneByAuthorPermlink(
      result.data.linkToObject,
    );
    if (!wobject) return true;
    return false;
  }

  private async postLinkValidation(body: string): Promise<boolean> {
    if (!body) return true;
    const [author, permlink] = body.split('/');
    if (!author || !permlink) return true;
    const post = await this.postRepository.findOne({
      filter: { author, permlink },
    });
    return !post;
  }

  private async permlinkValidation(authorPermlink: string): Promise<boolean> {
    const wobject =
      await this.objectRepository.findOneByAuthorPermlink(authorPermlink);
    return !wobject;
  }

  private async nameOrPermlinkValidation(
    body: string,
    types: string[],
  ): Promise<boolean> {
    const object = this.jsonHelper.parseJson(body, null);
    if (!object) return true;
    const result = namePermlinkSchema.safeParse(object);
    if (!result.success) return true;
    if (!result.data.authorPermlink) return false;

    const wobject = await this.objectRepository.findOneByAuthorPermlink(
      result.data.authorPermlink,
    );
    if (!wobject || !types.includes(wobject.object_type)) {
      return true;
    }
    return false;
  }

  private affiliateCodesChanceValid(codes: unknown[]): boolean {
    if (!Array.isArray(codes) || codes.length === 0) return false;

    const chances = codes.map((value) => {
      if (typeof value !== 'string') return NaN;
      const parts = value.split('::');
      if (parts.length !== 2) return NaN;
      return Number(parts[1]);
    });

    const sum = chances.reduce((acc, el) => acc + el, 0);

    return sum === 100 && chances.every((el) => el > 0 && !Number.isNaN(el));
  }

  private hasProductIdAndAffiliateCode(str: string): boolean {
    return str.includes('$productId') && str.includes('$affiliateCode');
  }

  private isRectangleIncluded(
    rect1: { topPoint: number[]; bottomPoint: number[] },
    rect2: { topPoint: number[]; bottomPoint: number[] },
  ): boolean {
    const [x1, y1] = rect1.topPoint;
    const [x2, y2] = rect1.bottomPoint;
    const [x3, y3] = rect2.topPoint;
    const [x4, y4] = rect2.bottomPoint;

    return x3 >= x1 && x4 <= x2 && y3 >= y1 && y4 <= y2;
  }

  private filterMapRectangles(
    rectangles: Array<{ topPoint: number[]; bottomPoint: number[] }>,
  ): Array<{ topPoint: number[]; bottomPoint: number[] }> {
    return rectangles.filter(
      (rect1, i) =>
        !rectangles.some(
          (rect2, j) => i !== j && this.isRectangleIncluded(rect2, rect1),
        ),
    );
  }
}
