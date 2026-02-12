import type { ConnectOptions } from 'mongoose';

export interface MongoConnectionOptions {
  uri: string;
  connectionName?: string;
  options?: ConnectOptions;
}

export interface MongoModuleOptions {
  connections: MongoConnectionOptions[];
}

export const MONGO_MODULE_OPTIONS = 'MONGO_MODULE_OPTIONS';

export const MONGO_CONNECTION = Object.freeze({
  WAIVIO: 'waivio',
} as const);
