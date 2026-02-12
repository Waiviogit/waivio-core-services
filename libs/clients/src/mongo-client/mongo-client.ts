import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import mongoose, { Connection } from 'mongoose';
import { MONGO_MODULE_OPTIONS } from './mongo-client.options';
import type { MongoModuleOptions } from './mongo-client.options';

@Injectable()
export class MongoClientFactory implements OnModuleDestroy {
  private readonly logger = new Logger(MongoClientFactory.name);
  private readonly connections = new Map<string, Connection>();

  constructor(@Inject(MONGO_MODULE_OPTIONS) options: MongoModuleOptions) {
    for (const conn of options.connections) {
      const name = conn.connectionName ?? 'default';
      const connection = mongoose.createConnection(conn.uri, conn.options);

      connection.on('connected', () => {
        this.logger.log(`Mongo "${name}" connected`);
      });

      connection.on('error', (err: unknown) => {
        this.logger.error(
          `Mongo "${name}" error: ${err instanceof Error ? err.message : String(err)}`,
        );
      });

      this.connections.set(name, connection);
    }
  }

  getConnection(name = 'default'): Connection {
    const conn = this.connections.get(name);
    if (!conn) {
      throw new Error(`Mongo connection "${name}" not registered`);
    }
    return conn;
  }

  async onModuleDestroy(): Promise<void> {
    for (const [name, conn] of this.connections) {
      this.logger.log(`Disconnecting Mongo "${name}"`);
      await conn.close();
    }
    this.connections.clear();
  }
}
