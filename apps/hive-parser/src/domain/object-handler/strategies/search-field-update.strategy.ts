import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { SEARCH_FIELDS } from '@waivio-core-services/common';
import type {
  FieldUpdateContext,
  IFieldUpdateStrategy,
} from './field-update-strategy.interface';
import { UpdateSpecificFieldsService } from '../update-specific-fields.service';

const SEARCH_FIELD_NAMES = new Set<string>(
  SEARCH_FIELDS as unknown as string[],
);

@Injectable()
export class SearchFieldUpdateStrategy implements IFieldUpdateStrategy {
  constructor(
    @Inject(forwardRef(() => UpdateSpecificFieldsService))
    private readonly updateSpecificFieldsService: UpdateSpecificFieldsService,
  ) {}

  supports(context: FieldUpdateContext): boolean {
    return SEARCH_FIELD_NAMES.has(context.field.name);
  }

  async execute(context: FieldUpdateContext): Promise<void> {
    await this.updateSpecificFieldsService.runAddSearchField({
      objectPermlink: context.objectPermlink,
      field: context.field,
    });
  }
}
