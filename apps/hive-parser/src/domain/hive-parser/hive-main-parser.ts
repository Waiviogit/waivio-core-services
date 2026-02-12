import { Injectable, Logger } from '@nestjs/common';
import { SignedBlock } from '@hiveio/dhive/lib/chain/block';
import { CUSTOM_JSON_ID, HIVE_OPERATION } from '../../constants/hive-parser';
import {
  CustomJsonOperation,
  Operation,
} from '@hiveio/dhive/lib/chain/operation';
import { Transaction } from '@hiveio/dhive/lib/chain/transaction';

type OperationHandler = (
  payload: Operation[1],
  transaction: Transaction,
  timestamp: string,
) => Promise<void>;

@Injectable()
export class HiveMainParser {
  private readonly logger = new Logger(HiveMainParser.name);

  private readonly handlers: Record<
    string,
    { enabled: boolean; handle: OperationHandler }
  > = {
    [HIVE_OPERATION.CUSTOM_JSON]: {
      enabled: true,
      handle: (p, t, ts) =>
        this.handleCustomJson(p as CustomJsonOperation[1], t, ts),
    },
  };

  async parseBlock(block: SignedBlock): Promise<void> {
    const { transactions, timestamp } = block;

    for (const transaction of transactions) {
      if (!transaction?.operations?.length) continue;

      for (const [type, payload] of transaction.operations as [string, any][]) {
        const handler = this.handlers[type];
        if (!handler?.enabled) continue;

        try {
          await handler.handle(payload, transaction, timestamp);
        } catch (error: unknown) {
          this.logger.error(
            `Handler [${type}] failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  }

  private readonly customJsonHandlers: Record<
    string,
    { enabled: boolean; handle: OperationHandler }
  > = {
    [CUSTOM_JSON_ID.WAIVIO_OPERATIONS]: {
      enabled: true,
      handle: (p, t, ts) =>
        this.handleCustomJson(p as CustomJsonOperation[1], t, ts),
    },
  };

  private async handleCustomJson(
    payload: CustomJsonOperation[1],
    transaction: Transaction,
    timestamp: string,
  ): Promise<void> {
    const handler = this.handlers[payload.id];
    // if (!handler?.enabled) return;
    // await handler.handle(payload, transaction, timestamp);
  }
}
