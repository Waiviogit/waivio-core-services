import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ObjectProcessorModule } from '@waivio-core-services/processors';
import { RepositoriesModule } from '../../repositories';
import { CacheModule } from '../cache';
import { ObjectProcessorProvider } from './object-processor.provider';

/**
 * Internal module that provides ObjectProcessorProvider and its dependencies.
 * This module is imported by the dynamic ObjectProcessorModule so it can inject ObjectProcessorProvider.
 */
@Module({
  imports: [RepositoriesModule, CacheModule, ConfigModule],
  providers: [ObjectProcessorProvider],
  exports: [ObjectProcessorProvider],
})
class ObjectProcessorProviderModule {}

/**
 * Shared module that integrates ObjectProcessorModule with hive-parser app dependencies.
 * Import this module in any module that needs ObjectProcessorService.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [ObjectProcessorIntegrationModule],
 *   providers: [SomeService],
 * })
 * export class SomeModule {
 *   // ObjectProcessorService is now available for injection
 * }
 * ```
 */
const ObjectProcessorModuleDynamic = ObjectProcessorModule.forRootAsync({
  useFactory: (provider: ObjectProcessorProvider, config: ConfigService) => ({
    findParentsByPermlink: provider.findParentsByPermlink,
    getWaivioAdminsAndOwner: provider.getWaivioAdminsAndOwner,
    getBlacklist: provider.getBlacklist,
    getObjectsByGroupId: provider.getObjectsByGroupId,
    masterAccount: config.get<string>('masterAccount') || 'waivio',
  }),
  inject: [ObjectProcessorProvider, ConfigService],
  imports: [ObjectProcessorProviderModule], // Import module that provides ObjectProcessorProvider
});

@Module({
  imports: [
    RepositoriesModule,
    CacheModule,
    ConfigModule,
    ObjectProcessorModuleDynamic,
  ],
  providers: [ObjectProcessorProvider],
  exports: [ObjectProcessorModuleDynamic], // Re-export the dynamic module to expose ObjectProcessorService
})
export class ObjectProcessorIntegrationModule {}
