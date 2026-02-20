import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ListItemProcessParams {
  authorPermlink: string;
  listItemLink: string;
}

interface ListItemProcessResponse {
  ok?: boolean;
  [key: string]: unknown;
}

@Injectable()
export class ListItemProcessService {
  private readonly logger = new Logger(ListItemProcessService.name);
  private readonly url: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get('waivioApi');
    const host = config?.host || '';
    const baseUrl = config?.baseUrl || '';
    const route = config?.recountListItems || '';
    this.url = `${host}${baseUrl}${route}`;
    this.apiKey =
      this.configService.get<string>('waivioApi.serviceApiKey') || '';

    this.logger.log(
      `ListItemProcessService initialized. URL: ${this.url ? 'configured' : 'not configured'}`,
    );
  }

  /**
   * Send request to Waivio API to start process of recount list item members
   * @param params - Object containing authorPermlink and listItemLink
   * @returns Promise with response or error
   */
  async send(
    params: ListItemProcessParams,
  ): Promise<{ response?: ListItemProcessResponse; error?: Error }> {
    if (!this.url) {
      this.logger.warn('ListItemProcessService URL not configured');
      return { error: new Error('ListItemProcessService URL not configured') };
    }

    if (!params.authorPermlink) {
      return { error: new Error('authorPermlink is required') };
    }

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          authorPermlink: params.authorPermlink,
          listItemLink: params.listItemLink || '',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `HTTP ${response.status}: ${errorText || response.statusText}`,
        );
      }

      const data = (await response.json()) as ListItemProcessResponse;

      if (data && data.ok) {
        return { response: data };
      }
      return { error: new Error('Request failed') };
    } catch (error) {
      this.logger.error(
        `Failed to send list item process request: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}
