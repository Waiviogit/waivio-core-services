import { Module } from '@nestjs/common';
import { ApiServiceController } from './api-service.controller';
import { ApiServiceService } from './api-service.service';

@Module({
  imports: [],
  controllers: [ApiServiceController],
  providers: [ApiServiceService],
})
export class ApiServiceModule {}
