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
});
