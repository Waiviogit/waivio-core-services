import { DynamicModule, Module } from '@nestjs/common';
import { SocketClient } from './socket-client';
import {
  SOCKET_MODULE_OPTIONS,
  SocketModuleOptions,
} from './socket-client.options';

@Module({})
export class SocketClientModule {
  static forRoot(options: SocketModuleOptions): DynamicModule {
    return {
      module: SocketClientModule,
      global: true,
      providers: [
        { provide: SOCKET_MODULE_OPTIONS, useValue: options },
        SocketClient,
      ],
      exports: [SocketClient],
    };
  }

  static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) => SocketModuleOptions | Promise<SocketModuleOptions>;
    inject?: any[];
    imports?: any[];
  }): DynamicModule {
    return {
      module: SocketClientModule,
      global: true,
      imports: options.imports || [],
      providers: [
        {
          provide: SOCKET_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        SocketClient,
      ],
      exports: [SocketClient],
    };
  }
}
