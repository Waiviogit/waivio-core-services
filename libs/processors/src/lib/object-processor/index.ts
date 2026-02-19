// Re-export everything from the main service file
export * from './object-processor.service';
export * from './object-processor.module';
export * from './object-processor.options';
export * from './interfaces';
export * from './makeAffiliateLinks';

// Export constants from common library
export {
  FIELDS_NAMES,
  OBJECT_TYPES,
  ARRAY_FIELDS,
  REQUIREDFIELDS_PARENT,
  LIST_TYPES,
  EXPOSED_FIELDS_FOR_OBJECT_TYPE,
  SUPPOSED_UPDATES_BY_TYPE,
} from '@waivio-core-services/common';
