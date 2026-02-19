import { DynamicModule, Module } from '@nestjs/common';
import { ObjectProcessorService } from './object-processor.service';
import {
  OBJECT_PROCESSOR_OPTIONS,
  ObjectProcessorModuleOptions,
} from './object-processor.options';

@Module({})
export class ObjectProcessorModule {
  static forRoot(options: {
    config: ObjectProcessorModuleOptions;
    imports?: any[];
  }): DynamicModule {
    return {
      module: ObjectProcessorModule,
      imports: options.imports || [],
      providers: [
        { provide: OBJECT_PROCESSOR_OPTIONS, useValue: options.config },
        ObjectProcessorService,
      ],
      exports: [ObjectProcessorService],
    };
  }

  static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) => ObjectProcessorModuleOptions | Promise<ObjectProcessorModuleOptions>;
    inject?: any[];
    imports?: any[];
  }): DynamicModule {
    return {
      module: ObjectProcessorModule,
      imports: options.imports || [],
      providers: [
        {
          provide: OBJECT_PROCESSOR_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        ObjectProcessorService,
      ],
      exports: [ObjectProcessorService],
    };
  }
}
