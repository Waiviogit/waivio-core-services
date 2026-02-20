import type { ObjectField } from '@waivio-core-services/clients';
import type { App } from '@waivio-core-services/processors';

export interface FieldUpdateContext {
  field: ObjectField;
  objectPermlink: string;
  app: App;
  voter?: string;
  percent?: number;
}

export interface IFieldUpdateStrategy {
  supports(context: FieldUpdateContext): boolean;
  execute(context: FieldUpdateContext): Promise<void>;
}
