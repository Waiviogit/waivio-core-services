import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ImportWobject {
  object_type: string;
  author_permlink: string;
  fields: Array<{
    name: string;
    body: string;
    id?: string;
    permlink?: string;
    locale?: string;
    creator?: string;
    tagCategory?: string;
  }>;
}

@Injectable()
export class ImportUpdatesService {
  private readonly logger = new Logger(ImportUpdatesService.name);
  private readonly enabled: boolean;
  private readonly url: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get('importUpdates');
    this.enabled = config?.enabled ?? false;
    const host = config?.host || '';
    const route = config?.route || '';
    this.url = `${host}${route}`;
    this.apiKey = config?.apiKey || '';

    if (this.enabled) {
      this.logger.log(
        `ImportUpdatesService enabled. URL: ${this.url ? 'configured' : 'not configured'}`,
      );
    } else {
      this.logger.debug('ImportUpdatesService disabled');
    }
  }

  async send(
    wobjects: ImportWobject[],
  ): Promise<{ response?: unknown; error?: Error }> {
    if (!this.enabled) {
      this.logger.debug('ImportUpdatesService is disabled, skipping send');
      return { error: new Error('ImportUpdatesService is disabled') };
    }

    if (!wobjects || !Array.isArray(wobjects) || wobjects.length === 0) {
      return { error: new Error('Invalid wobjects array') };
    }

    if (!this.url) {
      this.logger.warn('ImportUpdatesService URL not configured');
      return { error: new Error('ImportUpdatesService URL not configured') };
    }

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({ wobjects, immediately: true }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `HTTP ${response.status}: ${errorText || response.statusText}`,
        );
      }

      const data = await response.json();

      if (data) {
        return { response: data };
      }
      return { error: new Error('Not enough response data!') };
    } catch (error) {
      this.logger.error(
        `Failed to send import updates: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}
