import { DynamicModule, Module, Type } from '@nestjs/common';
import { BlockCacheService } from './block-cache.service';
import { HiveProcessorService } from './hive-processor.service';
import { HIVE_PROCESSOR_OPTIONS, BLOCK_PARSER } from './hive-processor.options';
import type {
  HiveProcessorModuleOptions,
  BlockParserInterface,
} from './hive-processor.options';

@Module({})
export class HiveProcessorModule {
  static forRoot(options: {
    config: HiveProcessorModuleOptions;
    blockParser: Type<BlockParserInterface>;
  }): DynamicModule {
    return {
      module: HiveProcessorModule,
      providers: [
        { provide: HIVE_PROCESSOR_OPTIONS, useValue: options.config },
        options.blockParser,
        { provide: BLOCK_PARSER, useExisting: options.blockParser },
        BlockCacheService,
        HiveProcessorService,
      ],
      exports: [HiveProcessorService],
    };
  }

  static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) => HiveProcessorModuleOptions | Promise<HiveProcessorModuleOptions>;
    inject?: any[];
    imports?: any[];
    blockParser: Type<BlockParserInterface>;
  }): DynamicModule {
    return {
      module: HiveProcessorModule,
      imports: options.imports || [],
      providers: [
        {
          provide: HIVE_PROCESSOR_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        options.blockParser,
        { provide: BLOCK_PARSER, useExisting: options.blockParser },
        BlockCacheService,
        HiveProcessorService,
      ],
      exports: [HiveProcessorService],
    };
  }
}
