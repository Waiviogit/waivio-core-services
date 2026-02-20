import { Injectable, Logger } from '@nestjs/common';
import {
  ObjectRepository,
  WobjectPendingUpdateRepository,
} from '../../repositories';
import { FIELDS_NAMES, JsonHelper } from '@waivio-core-services/common';
import type { ObjectMethodHandler, ObjectMethodContext } from './interface';
import type { WaivioOperation } from '../hive-parser/schemas';
import { UpdateObjectValidatorService } from './update-object-validator.service';
import { UpdateSpecificFieldsService } from './update-specific-fields.service';
import type { ObjectField } from '@waivio-core-services/clients';

@Injectable()
export class UpdateObjectHandler implements ObjectMethodHandler {
  private readonly logger = new Logger(UpdateObjectHandler.name);

  private readonly jsonHelper = new JsonHelper();

  constructor(
    private readonly objectRepository: ObjectRepository,
    private readonly validatorService: UpdateObjectValidatorService,
    private readonly updateSpecificFieldsService: UpdateSpecificFieldsService,
    private readonly wobjectPendingUpdateRepository: WobjectPendingUpdateRepository,
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

    // Handle HTML_CONTENT volumes logic
    let fieldToAppend: Partial<ObjectField> = {
      author: ctx.account,
      name,
      body,
      locale,
      creator,
      transactionId: ctx.transactionId,
    };

    if (name === FIELDS_NAMES.HTML_CONTENT) {
      const volumesResult = await this.getVolumes({
        field: fieldToAppend as ObjectField,
        objectPermlink,
      });

      if (volumesResult === null) {
        // Field was stored in pending updates, skip appending
        return;
      }

      if (volumesResult.field) {
        // Field was merged from volumes, use merged field
        fieldToAppend = {
          ...fieldToAppend,
          ...volumesResult.field,
        };
      }
    }

    // Append field using repository method
    await this.objectRepository.appendField(objectPermlink, {
      author: fieldToAppend.author!,
      name: fieldToAppend.name!,
      body: fieldToAppend.body!,
      locale: fieldToAppend.locale!,
      creator: fieldToAppend.creator!,
      transactionId: fieldToAppend.transactionId!,
    });

    // Update specific fields after field append
    await this.updateSpecificFieldsService.update({
      objectPermlink,
      fieldTransactionId: fieldToAppend.transactionId || ctx.transactionId,
    });
  }

  /**
   * Handle volumes logic for HTML_CONTENT fields
   * Returns null if field was stored in pending updates
   * Returns field data if field should be appended (single part or merged)
   */
  private async getVolumes(params: {
    field: ObjectField;
    objectPermlink: string;
  }): Promise<{ field?: Partial<ObjectField> } | null> {
    const { field, objectPermlink } = params;

    // Parse field body to extract volume metadata
    const fieldData = this.jsonHelper.parseJson(field.body, null) as {
      partNumber?: number;
      totalParts?: number;
      id?: string;
      body?: string;
      [key: string]: unknown;
    } | null;

    if (!fieldData) {
      // Not a JSON field, return as-is
      return { field };
    }

    const volumeFields = ['partNumber', 'totalParts', 'id'];
    if (!volumeFields.every((key) => fieldData[key] !== undefined)) {
      // Not a volume field, return as-is
      return { field };
    }

    const { partNumber, totalParts, id } = fieldData;

    // Validate volume parameters
    if (
      !totalParts ||
      !partNumber ||
      !id ||
      totalParts > 10 ||
      totalParts < 1 ||
      partNumber > 10 ||
      partNumber < 1 ||
      (totalParts === 1 && partNumber !== 1) ||
      partNumber > totalParts
    ) {
      this.logger.warn(
        `Invalid volume parameters: partNumber=${partNumber}, totalParts=${totalParts}, id=${id}`,
      );
      return null;
    }

    // Single part - return field without volume metadata
    if (totalParts === 1) {
      const {
        partNumber: _partNumber,
        totalParts: _totalParts,
        id: _id,
        ...rest
      } = fieldData;
      return {
        field: {
          ...field,
          body: JSON.stringify(rest),
        },
      };
    }

    // Multiple parts - check if we have all parts
    const pendingDocsCount =
      await this.wobjectPendingUpdateRepository.getDocumentsCountByAuthorPermlinkId(
        {
          authorPermlink: objectPermlink,
          id: id as string,
        },
      );

    if (pendingDocsCount + 1 === totalParts) {
      // We have all parts, merge them
      const storedParts =
        await this.wobjectPendingUpdateRepository.getDocumentsByAuthorPermlinkId(
          {
            authorPermlink: objectPermlink,
            id: id as string,
          },
        );

      // Check if this part number already exists
      if (storedParts.some((p) => p.partNumber === partNumber)) {
        this.logger.warn(
          `Part ${partNumber} already exists for id ${id} on ${objectPermlink}`,
        );
        return null;
      }

      // Combine all parts
      const allParts = [
        ...storedParts.map((p) => ({
          ...p,
          body: p.body,
        })),
        {
          ...fieldData,
          partNumber,
          totalParts,
          id,
          body: fieldData.body || '',
        },
      ].sort((a, b) => a.partNumber - b.partNumber);

      // Accumulate body from all parts
      const accumulatedBody = allParts.reduce(
        (acc, part) => `${acc}${part.body || ''}`,
        '',
      );

      // Delete pending documents
      await this.wobjectPendingUpdateRepository.deleteDocumentsByAuthorPermlinkId(
        {
          authorPermlink: objectPermlink,
          id: id as string,
        },
      );

      // Return merged field - use first part's metadata but replace body with accumulated
      const firstPart = allParts[0];
      const {
        partNumber: _partNumber,
        totalParts: _totalParts,
        id: _id,
        body: _body,
        ...rest
      } = firstPart;

      return {
        field: {
          ...field,
          body: accumulatedBody,
          id: id as string,
        },
      };
    }

    // Not all parts yet - store in pending updates
    // Store the body from the parsed JSON, not the original field body
    await this.wobjectPendingUpdateRepository.create({
      name: field.name,
      body: fieldData.body || '',
      locale: field.locale,
      creator: field.creator,
      author: field.author,
      transactionId: field.transactionId,
      id: id as string,
      authorPermlink: objectPermlink,
      partNumber: partNumber as number,
      totalParts: totalParts as number,
    });

    // Return null to skip appending
    return null;
  }
}
