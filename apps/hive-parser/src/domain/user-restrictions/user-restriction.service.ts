import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SpamUserRepository,
  MutedUserRepository,
  BlacklistRepository,
} from '../../repositories';

@Injectable()
export class UserRestrictionService {
  private readonly logger = new Logger(UserRestrictionService.name);
  private readonly globalMuteAccounts: string[];

  constructor(
    private readonly spamUserRepository: SpamUserRepository,
    private readonly mutedUserRepository: MutedUserRepository,
    private readonly blacklistRepository: BlacklistRepository,
    private readonly configService: ConfigService,
  ) {
    this.globalMuteAccounts = this.configService.get<string[]>(
      'userRestrictions.globalMuteAccounts',
      ['waivio'],
    ) || ['waivio'];
  }

  async isRestricted(username: string): Promise<boolean> {
    // Check spam user first
    const isSpam = await this.spamUserRepository.isSpamUser(username);
    if (isSpam) {
      this.logger.debug(`User ${username} is marked as spam`);
      return true;
    }

    // Check if muted by global accounts
    const isMuted = await this.mutedUserRepository.isMutedByGlobalAccounts(
      username,
      this.globalMuteAccounts,
    );

    return !!isMuted;
  }

  /**
   * Domain rule: user is blacklisted if they are in the viewer's blackList,
   * or in any followList's blackList, unless they are in the viewer's whiteList.
   */
  async isUserBlacklisted(user: string, targetUser: string): Promise<boolean> {
    const blacklist = await this.blacklistRepository.findByUser(user);
    if (!blacklist) {
      return false;
    }

    if (blacklist.blackList.includes(targetUser)) {
      return true;
    }

    if (blacklist.whiteList.includes(targetUser)) {
      return false;
    }

    if (blacklist.followLists && blacklist.followLists.length > 0) {
      const followListDocs = await this.blacklistRepository.find({
        filter: { user: { $in: blacklist.followLists } },
      });

      for (const followDoc of followListDocs) {
        if (followDoc.blackList.includes(targetUser)) {
          return true;
        }
      }
    }

    return false;
  }
}
