import { z } from 'zod';

export const hiveParserConfigSchema = z.object({
  MONGO_URI_WAIVIO: z
    .string()
    .optional()
    .default('mongodb://localhost:27017/waivio'),
  REDIS_URI: z.string().optional().default('redis://localhost:6379'),
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
