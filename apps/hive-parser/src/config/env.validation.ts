import { z } from 'zod';

export const hiveParserConfigSchema = z.object({
  MONGO_URI_WAIVIO: z
    .string()
    .optional()
    .default('mongodb://localhost:27017/waivio'),
  REDIS_URI: z.string().optional().default('redis://localhost:6379'),
  REDIS_TAG_CATEGORIES_DB: z.coerce.number().optional().default(9),
  START_BLOCK_NUMBER: z.coerce.number().optional().default(102138605),
  BLOCK_NUMBER_KEY: z.string().optional().default('hiveParser:blockNumber'),
  APP_HOST: z.string().optional().default('waivio.com'),
  NOTIFICATIONS_API_WS: z.string().optional().default('ws://localhost:3001'),
  NOTIFICATIONS_API_BASE_URL: z
    .string()
    .optional()
    .default('/notifications-api'),
  WS_SET_NOTIFICATION: z.string().optional().default('setNotification'),
  NOTIFICATIONS_API_KEY: z.string().optional().default(''),
  IMPORT_UPDATES_ENABLED: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  IMPORT_OBJECTS_SERVICE_HOST_URL: z.string().optional().default(''),
  IMPORT_UPDATES_ROUTE: z.string().optional().default(''),
  API_KEY: z.string().optional().default(''),
  WAIVIO_API_HOST: z.string().optional().default(''),
  WAIVIO_API_BASE_URL: z.string().optional().default(''),
  WAIVIO_API_RECOUNT_LIST_ITEMS: z
    .string()
    .optional()
    .default('/wobjects/list-item-process'),
  SERVICE_API_KEY: z.string().optional().default(''),
});

export type HiveParserConfig = z.infer<typeof hiveParserConfigSchema>;

export function validateHiveParser(
  config: Record<string, unknown>,
): HiveParserConfig {
  const result = hiveParserConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Config validation error: ${result.error.message}`);
  }
  return result.data;
}
