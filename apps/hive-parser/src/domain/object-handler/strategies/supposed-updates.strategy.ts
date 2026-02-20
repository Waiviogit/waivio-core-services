import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { FIELDS_NAMES } from '@waivio-core-services/common';
import type {
  FieldUpdateContext,
  IFieldUpdateStrategy,
} from './field-update-strategy.interface';
import { UpdateSpecificFieldsService } from '../update-specific-fields.service';

@Injectable()
export class SupposedUpdatesStrategy implements IFieldUpdateStrategy {
  constructor(
    @Inject(forwardRef(() => UpdateSpecificFieldsService))
    private readonly updateSpecificFieldsService: UpdateSpecificFieldsService,
  ) {}

  supports(context: FieldUpdateContext): boolean {
    return (
      context.field.name === FIELDS_NAMES.NAME ||
      context.field.name === FIELDS_NAMES.DESCRIPTION ||
      context.field.name === FIELDS_NAMES.TITLE
    );
  }

  async execute(context: FieldUpdateContext): Promise<void> {
    await this.updateSpecificFieldsService.runCreateTags({
      objectPermlink: context.objectPermlink,
      field: context.field,
      app: context.app,
    });
  }
}
