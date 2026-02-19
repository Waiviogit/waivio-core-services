import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  SocketClientModule,
  HiveClientModule,
} from '@waivio-core-services/clients';
import { HiveProcessorModule } from '@waivio-core-services/processors';
import { RepositoriesModule } from '../../repositories';
import { CacheModule } from '../cache';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    ConfigModule,
    SocketClientModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const ws =
          config.get<string>('notificationsApi.ws') || 'ws://localhost:3001';
        const baseUrl =
          config.get<string>('notificationsApi.baseUrl') ||
          '/notifications-api';
        const apiKey = config.get<string>('notificationsApi.apiKey') || '';
        return {
          url: `${ws}${baseUrl}`,
          apiKey,
        };
      },
      inject: [ConfigService],
    }),
    HiveClientModule,
    HiveProcessorModule,
    RepositoriesModule,
    CacheModule,
  ],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
