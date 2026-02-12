import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RedisClientFactory,
  RedisClientInterface,
} from '@waivio-core/clients';

@Injectable()
export class HiveParserCacheService {
  private readonly logger = new Logger(HiveParserCacheService.name);
  private readonly client: RedisClientInterface;
  private readonly blockNumberKey: string;
  private readonly defaultStartBlockNumber: number;

  constructor(
    private readonly redisFactory: RedisClientFactory,
    private readonly configService: ConfigService,
  ) {
    this.client = this.redisFactory.getClient(2);
    this.blockNumberKey = this.configService.get<string>(
      'hive.blockNumberKey',
      'hiveParser:blockNumber',
    );
    this.defaultStartBlockNumber = this.configService.get<number>(
      'hive.startBlockNumber',
      102138605,
    );
  }

  async getBlockNumber(): Promise<number> {
    try {
      const cached = await this.client.get(this.blockNumberKey);
      return cached ? parseInt(cached) : this.defaultStartBlockNumber;
    } catch (error) {
      this.logger.error(`Error getting block number from cache: ${error}`);
      return this.defaultStartBlockNumber;
    }
  }

  async setBlockNumber(blockNumber: number): Promise<void> {
    try {
      await this.client.set(this.blockNumberKey, blockNumber.toString());
    } catch (error) {
      this.logger.error(`Error setting block number to cache: ${error}`);
    }
  }
}
