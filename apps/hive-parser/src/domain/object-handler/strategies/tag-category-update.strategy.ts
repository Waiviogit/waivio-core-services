import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { FIELDS_NAMES } from '@waivio-core-services/common';
import type {
  FieldUpdateContext,
  IFieldUpdateStrategy,
} from './field-update-strategy.interface';
import { UpdateSpecificFieldsService } from '../update-specific-fields.service';

@Injectable()
export class TagCategoryUpdateStrategy implements IFieldUpdateStrategy {
  constructor(
    @Inject(forwardRef(() => UpdateSpecificFieldsService))
    private readonly updateSpecificFieldsService: UpdateSpecificFieldsService,
  ) {}

  supports(context: FieldUpdateContext): boolean {
    return (
      context.field.name === FIELDS_NAMES.TAG_CLOUD ||
      context.field.name === FIELDS_NAMES.CATEGORY_ITEM
    );
  }

  async execute(context: FieldUpdateContext): Promise<void> {
    if (context.field.name === FIELDS_NAMES.TAG_CLOUD) {
      await this.updateSpecificFieldsService.runUpdateTagCloud(
        context.objectPermlink,
      );
    } else {
      await this.updateSpecificFieldsService.runUpdateTagCategories({
        objectPermlink: context.objectPermlink,
        field: context.field,
      });
    }
  }
}
