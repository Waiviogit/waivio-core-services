import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CUSTOM_JSON_ID } from '../../constants/hive-parser';
import { CustomJsonOperation } from '@hiveio/dhive/lib/chain/operation';
import { Transaction } from '@hiveio/dhive/lib/chain/transaction';

type CustomJsonHandler = (
  payload: CustomJsonOperation[1],
  transaction: Transaction,
  timestamp: string,
) => Promise<void>;

@Injectable()
export class HiveCustomJsonParser {
  private readonly logger = new Logger(HiveCustomJsonParser.name);
  private readonly handlers: Record<
    string,
    { enabled: boolean; handle: CustomJsonHandler }
  >;

  constructor(private readonly configService: ConfigService) {
    this.handlers = {
      [CUSTOM_JSON_ID.WAIVIO_OPERATIONS]: {
        enabled: this.configService.get<boolean>(
          'hive.customJsonHandlers.waivioOperations.enabled',
          true,
        ),
        handle: (p, t, ts) => this.handleWaivioOperations(p, t, ts),
      },
    };
  }

  async parse(
    payload: CustomJsonOperation[1],
    transaction: Transaction,
    timestamp: string,
  ): Promise<void> {
    const handler = this.handlers[payload.id];
    if (!handler?.enabled) return;
    await handler.handle(payload, transaction, timestamp);
  }

  private async handleWaivioOperations(
    payload: CustomJsonOperation[1],
    transaction: Transaction,
    timestamp: string,
  ): Promise<void> {
    this.logger.log('handleWaivioOperations', payload);

  }
}
