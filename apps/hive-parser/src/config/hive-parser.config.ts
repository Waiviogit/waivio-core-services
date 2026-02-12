export default () => ({
  mongo: {
    waivioDbUri: process.env.MONGO_URI_WAIVIO || 'mongodb://localhost:27017/waivio',
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
