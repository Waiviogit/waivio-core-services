import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ObjectRepository,
  BlacklistRepository,
  MutedUserRepository,
} from '../../repositories';
import { CacheService } from '../cache';
import { JsonHelper, REMOVE_OBJ_STATUSES } from '@waivio-core-services/common';
import type {
  FindParentsByPermlinkFn,
  GetWaivioAdminsAndOwnerFn,
  GetBlacklistFn,
  GetObjectsByGroupIdFn,
  Wobject,
} from '@waivio-core-services/processors';
import type { ObjectDocument } from '@waivio-core-services/clients';
import * as _ from 'lodash';

@Injectable()
export class ObjectProcessorProvider {
  private readonly jsonHelper = new JsonHelper();
  private readonly cachePrefix = 'apiResCache:getBlacklist:';

  constructor(
    private readonly objectRepository: ObjectRepository,
    private readonly blacklistRepository: BlacklistRepository,
    private readonly mutedUserRepository: MutedUserRepository,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate cache key from object
   */
  private getCacheKey(obj: Record<string, unknown>): string {
    return JSON.stringify(obj);
  }

  /**
   * Find parent objects by permlinks
   */
  findParentsByPermlink: FindParentsByPermlinkFn = async (
    permlinks: string[],
  ): Promise<Wobject[]> => {
    const parents =
      await this.objectRepository.findParentsByPermlinks(permlinks);

    // Convert ObjectDocument[] to Wobject[]
    return parents.map((doc) => this.convertToWobject(doc));
  };

  /**
   * Get blacklist for admins (with caching)
   */
  getBlacklist: GetBlacklistFn = async (
    admins: string[],
  ): Promise<string[]> => {
    const cacheKey = `${this.cachePrefix}${this.getCacheKey({ getBlacklist: admins })}`;

    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      const parsed = this.jsonHelper.parseJson<string[]>(cached, null);
      return parsed || [];
    }

    let followList: string[] = [];
    let resultBlacklist: string[] = [];

    if (_.isEmpty(admins)) {
      return resultBlacklist;
    }

    // Get blacklists for admins
    const blacklists = await this.blacklistRepository.findByUsersWithProjection(
      admins,
      {
        followLists: 1,
        blackList: 1,
      },
    );

    _.forEach(blacklists, (el) => {
      followList = _.union(followList, el.followLists);
      resultBlacklist = _.union(resultBlacklist, el.blackList);
    });

    // Get muted users
    const mutedUsers = await this.mutedUserRepository.findByMutedBy(admins);

    resultBlacklist = _.union(
      resultBlacklist,
      mutedUsers.map((m) => m.userName),
    );

    // Get blacklists from followLists
    if (!_.isEmpty(followList)) {
      const fromFollows =
        await this.blacklistRepository.findBlackListsByUsers(followList);

      _.forEach(fromFollows, (el) => {
        resultBlacklist = _.union(resultBlacklist, el.blackList);
      });
    }

    // Remove admins from blacklist
    const result = _.difference(resultBlacklist, admins);

    // Cache for 30 minutes (1800 seconds)
    await this.cacheService.set(cacheKey, JSON.stringify(result), 1800);

    return result;
  };

  /**
   * Get objects by group ID
   */
  getObjectsByGroupId: GetObjectsByGroupIdFn = async (
    ids: string[],
  ): Promise<Wobject[]> => {
    const wobjects = await this.objectRepository.findByGroupIds(
      ids,
      REMOVE_OBJ_STATUSES,
    );

    return wobjects.map((doc) => this.convertToWobject(doc));
  };

  /**
   * Get Waivio admins and owner
   */
  getWaivioAdminsAndOwner: GetWaivioAdminsAndOwnerFn = async (): Promise<
    string[]
  > => {
    // This should be configurable or fetched from somewhere
    // For now, return a default value
    const masterAccount =
      this.configService.get<string>('masterAccount') || 'waivio';
    return [masterAccount];
  };

  /**
   * Convert ObjectDocument (lean) to Wobject
   */
  private convertToWobject(doc: ObjectDocument): Wobject {
    // ObjectDocument from repository is already lean (plain object)
    const { status, activeCampaigns, ...rest } = doc;

    // Convert status if it has a title property
    const wobjectStatus =
      status && typeof status === 'object' && 'title' in status
        ? { title: String(status.title) }
        : undefined;

    return {
      ...rest,
      // Ensure required Wobject fields are present
      is_posting_open: true,
      is_extending_open: true,
      activeCampaigns: activeCampaigns
        ? activeCampaigns.map((id) => id.toString())
        : [],
      // Ensure fields array exists
      fields: doc.fields || [],
      // Ensure children array exists
      children: doc.children || [],
      // Convert status to WobjectStatus format (explicitly set to avoid type conflict)
      status: wobjectStatus,
    } as unknown as Wobject;
  }
}
