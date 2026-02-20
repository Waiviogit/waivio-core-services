// Connection pool configuration
const mongoOptions = {
  maxPoolSize: 20,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,
  maxConnecting: 2,
};

export default () => ({
  mongo: {
    waivioDbUri:
      process.env.MONGO_URI_WAIVIO || 'mongodb://localhost:27017/waivio',
    options: mongoOptions,
  },
  redis: {
    uri: process.env.REDIS_URI,
    tagCategories: parseInt(process.env.REDIS_TAG_CATEGORIES_DB || '9', 10),
  },
  hive: {
    startBlockNumber: parseInt(
      process.env.START_BLOCK_NUMBER || '102138605',
      10,
    ),
    blockNumberKey: process.env.BLOCK_NUMBER_KEY || 'hiveParser:blockNumber',
    handlers: {
      customJson: {
        enabled: process.env.HANDLER_CUSTOM_JSON_ENABLED !== 'false',
      },
    },
    customJsonHandlers: {
      waivioOperations: {
        enabled: process.env.HANDLER_WAIVIO_OPERATIONS_ENABLED !== 'false',
      },
    },
  },
  userRestrictions: {
    globalMuteAccounts: process.env.GLOBAL_MUTE_ACCOUNTS
      ? process.env.GLOBAL_MUTE_ACCOUNTS.split(',').map((s) => s.trim())
      : ['waivio'],
  },
  masterAccount: process.env.MASTER_ACCOUNT || 'waivio',
  appHost: process.env.APP_HOST || 'waivio.com',
  notificationsApi: {
    ws: process.env.NOTIFICATIONS_API_WS || 'ws://localhost:3001',
    baseUrl: process.env.NOTIFICATIONS_API_BASE_URL || '/notifications-api',
    wsSetNotification: process.env.WS_SET_NOTIFICATION || 'setNotification',
    apiKey: process.env.NOTIFICATIONS_API_KEY || '',
  },
  importUpdates: {
    enabled: process.env.IMPORT_UPDATES_ENABLED === 'true',
    host: process.env.IMPORT_OBJECTS_SERVICE_HOST_URL || '',
    route: process.env.IMPORT_UPDATES_ROUTE || '',
    apiKey: process.env.API_KEY || '',
  },
  waivioApi: {
    host: process.env.WAIVIO_API_HOST || '',
    baseUrl: process.env.WAIVIO_API_BASE_URL || '',
    recountListItems:
      process.env.WAIVIO_API_RECOUNT_LIST_ITEMS ||
      '/wobjects/list-item-process',
    serviceApiKey: process.env.SERVICE_API_KEY || '',
  },
});
