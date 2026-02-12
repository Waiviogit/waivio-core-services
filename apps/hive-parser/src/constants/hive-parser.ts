export const HIVE_RPC_NODES = [
  'https://api.deathwing.me',
  'https://api.hive.blog',
  'https://api.openhive.network',
  'https://rpc.mahdiyari.info',
];

const HIVE_API = Object.freeze({
  CONDENSER_API: 'condenser_api',
  BRIDGE: 'bridge',
} as const);

export const CONDENSER_API = Object.freeze({
  GET_BLOCK: `${HIVE_API.CONDENSER_API}.get_block`,
  GET_CONTENT: `${HIVE_API.CONDENSER_API}.get_content`,
  GET_ACTIVE_VOTES: `${HIVE_API.CONDENSER_API}.get_active_votes`,
} as const);

export const BRIDGE = Object.freeze({
  GET_DISCUSSION: `${HIVE_API.BRIDGE}.get_discussion`,
} as const);

export const HIVE_OPERATION = Object.freeze({
  TRANSFER: 'transfer',
  COMMENT: 'comment',
  CUSTOM_JSON: 'custom_json',
  ACCOUNT_UPDATE: 'account_update',
} as const);

export const CUSTOM_JSON_ID = Object.freeze({
  WAIVIO_OPERATIONS: 'waivio_operations',
} as const);
