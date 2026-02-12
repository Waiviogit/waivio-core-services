import { DynamicModule, Module } from '@nestjs/common';
import { MongoClientFactory } from './mongo-client';
import { MONGO_MODULE_OPTIONS } from './mongo-client.options';
import type { MongoModuleOptions } from './mongo-client.options';

@Module({})
export class MongoClientModule {
  static forRoot(options: MongoModuleOptions): DynamicModule {
    return {
      module: MongoClientModule,
      global: true,
      providers: [
        { provide: MONGO_MODULE_OPTIONS, useValue: options },
        MongoClientFactory,
      ],
      exports: [MongoClientFactory],
    };
  }

  static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) => MongoModuleOptions | Promise<MongoModuleOptions>;
    inject?: any[];
    imports?: any[];
  }): DynamicModule {
    return {
      module: MongoClientModule,
      global: true,
      imports: options.imports || [],
      providers: [
        {
          provide: MONGO_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        MongoClientFactory,
      ],
      exports: [MongoClientFactory],
    };
  }
}
