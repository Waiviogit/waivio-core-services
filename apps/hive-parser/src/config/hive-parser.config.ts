export default () => ({
  mongo: {
    waivioDbUri: process.env.MONGO_URI_WAIVIO,
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
  },
});
