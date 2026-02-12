export interface MongoConnectionOptions {
  uri: string;
  connectionName?: string;
}

export interface MongoModuleOptions {
  connections: MongoConnectionOptions[];
}

export const MONGO_MODULE_OPTIONS = 'MONGO_MODULE_OPTIONS';
