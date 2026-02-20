import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { FIELDS_NAMES } from '@waivio-core-services/common';
import type {
  FieldUpdateContext,
  IFieldUpdateStrategy,
} from './field-update-strategy.interface';
import { UpdateSpecificFieldsService } from '../update-specific-fields.service';

@Injectable()
export class DepartmentFieldUpdateStrategy implements IFieldUpdateStrategy {
  constructor(
    @Inject(forwardRef(() => UpdateSpecificFieldsService))
    private readonly updateSpecificFieldsService: UpdateSpecificFieldsService,
  ) {}

  supports(context: FieldUpdateContext): boolean {
    return context.field.name === FIELDS_NAMES.DEPARTMENTS;
  }

  async execute(context: FieldUpdateContext): Promise<void> {
    await this.updateSpecificFieldsService.runManageDepartments({
      field: context.field,
      objectPermlink: context.objectPermlink,
      app: context.app,
      percent: context.percent,
    });
  }
}
