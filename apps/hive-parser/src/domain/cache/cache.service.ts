import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientFactory } from '@waivio-core-services/clients';
import type { RedisClientInterface } from '@waivio-core-services/clients';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly client: RedisClientInterface;
  private readonly tagCategoriesClient: RedisClientInterface;

  constructor(
    private readonly redisClientFactory: RedisClientFactory,
    private readonly configService: ConfigService,
  ) {
    // Use default database (0) for cache
    this.client = this.redisClientFactory.getClient(0);
    // Use separate database for tag categories
    const tagCategoriesDb =
      this.configService.get<number>('redis.tagCategories') ?? 9;
    this.tagCategoriesClient =
      this.redisClientFactory.getClient(tagCategoriesDb);
  }

  /**
   * Get a value from cache by key
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(
        `Failed to get cache key "${key}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL (time to live in seconds)
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      await this.client.set(key, value, ttlSeconds);
    } catch (error) {
      this.logger.error(
        `Failed to set cache key "${key}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(
        `Failed to delete cache key "${key}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      return await this.client.exists(key);
    } catch (error) {
      this.logger.error(
        `Failed to check existence of cache key "${key}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Get a hash field value
   */
  async hGet(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hGet(key, field);
    } catch (error) {
      this.logger.error(
        `Failed to get hash field "${field}" from key "${key}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Set a hash field value
   */
  async hSet(
    key: string,
    field: string,
    value: string | number,
  ): Promise<void> {
    try {
      await this.client.hSet(key, field, value);
    } catch (error) {
      this.logger.error(
        `Failed to set hash field "${field}" for key "${key}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get all hash fields and values
   */
  async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hGetAll(key);
    } catch (error) {
      this.logger.error(
        `Failed to get all hash fields from key "${key}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return {};
    }
  }

  /**
   * Increment a hash field by a value
   */
  async hIncrBy(key: string, field: string, increment: number): Promise<void> {
    try {
      await this.client.hIncrBy(key, field, increment);
    } catch (error) {
      this.logger.error(
        `Failed to increment hash field "${field}" for key "${key}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Set expiration time for a key (in seconds)
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      await this.client.expire(key, ttlSeconds);
    } catch (error) {
      this.logger.error(
        `Failed to set expiration for key "${key}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Increment the score of a member in a sorted set
   * @param key The sorted set key
   * @param increment The increment value
   * @param member The member to increment
   * @returns The new score of the member
   */
  async zIncrBy(
    key: string,
    increment: number,
    member: string,
  ): Promise<number> {
    try {
      return await this.client.zIncrBy(key, increment, member);
    } catch (error) {
      this.logger.error(
        `Failed to increment sorted set member "${member}" in key "${key}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Increment the score of a member in a sorted set using tag categories client
   * @param key The sorted set key
   * @param increment The increment value
   * @param member The member to increment
   * @returns The new score of the member
   */
  async zIncrByTagCategory(
    key: string,
    increment: number,
    member: string,
  ): Promise<number> {
    try {
      return await this.tagCategoriesClient.zIncrBy(key, increment, member);
    } catch (error) {
      this.logger.error(
        `Failed to increment tag category sorted set member "${member}" in key "${key}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get a client for a specific database
   * Useful when you need to use a different Redis database
   */
  getClient(db?: number): RedisClientInterface {
    return this.redisClientFactory.getClient(db);
  }
}
