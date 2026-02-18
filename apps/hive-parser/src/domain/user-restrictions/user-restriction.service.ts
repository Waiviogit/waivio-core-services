import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpamUserRepository, MutedUserRepository } from '../../repositories';

@Injectable()
export class UserRestrictionService {
  private readonly logger = new Logger(UserRestrictionService.name);
  private readonly globalMuteAccounts: string[];

  constructor(
    private readonly spamUserRepository: SpamUserRepository,
    private readonly mutedUserRepository: MutedUserRepository,
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
}
