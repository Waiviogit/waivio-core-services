import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import hiveParserConfig from './config/hive-parser.config';
import { validateHiveParser } from './config/env.validation';
import {
  RedisClientModule,
  HiveClientModule,
  MongoClientModule,
  MONGO_CONNECTION,
} from '@waivio-core-services/clients';
import { HIVE_RPC_NODES } from './constants/hive-parser';
import { RepositoriesModule } from './repositories';
import { HiveParserModule } from './domain/hive-parser/hive-parser.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [hiveParserConfig],
      validate: validateHiveParser,
    }),
    RedisClientModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('redis.uri') ?? '',
      }),
      inject: [ConfigService],
    }),
    HiveClientModule.forRoot({
      nodes: HIVE_RPC_NODES,
    }),
    MongoClientModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connections: [
          {
            uri: config.get<string>('mongo.waivioDbUri') ?? '',
            connectionName: MONGO_CONNECTION.WAIVIO,
            options: config.get('mongo.options'),
          },
        ],
      }),
      inject: [ConfigService],
    }),
    RepositoriesModule,
    HiveParserModule,
  ],
})
export class AppModule {}
