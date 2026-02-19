export const REDIS_KEYS = {
  PROCESSED_LIKES: 'processed_likes:hive',
  CURRENT_PRICE_INFO: 'current_price_info',
  DYNAMIC_GLOBAL_PROPERTIES: 'dynamic_global_properties',
  TX_ID_MAIN: 'main_parser_tx_id',
  PUB_SUPPOSED_FIELD_UPDATE: 'supposed_field_update',
  AD_SENSE: 'ad_sense_cache',
  HOSTS_TO_PARSE_OBJECTS: 'hosts_to_parse_objects',
  START_OBJECT_PROMOTION: 'start_object_promotion',
  END_OBJECT_PROMOTION: 'end_object_promotion',
} as const;
