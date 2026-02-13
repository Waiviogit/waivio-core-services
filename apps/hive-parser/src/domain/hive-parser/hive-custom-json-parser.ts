import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CUSTOM_JSON_ID } from '../../constants/hive-parser';
import { CustomJsonOperation } from '@hiveio/dhive/lib/chain/operation';
import { Transaction } from '@hiveio/dhive/lib/chain/transaction';
import { JsonHelper } from '@waivio-core/common';
import { waivioOperationSchema } from './schemas';

type CustomJsonHandler = (
  payload: CustomJsonOperation[1],
  transaction: Transaction,
  timestamp: string,
) => Promise<void>;

type WaivioOperation = {
  method: string;
  params: Record<string, unknown>;
};

@Injectable()
export class HiveCustomJsonParser {
  private readonly logger = new Logger(HiveCustomJsonParser.name);
  private readonly handlers: Record<
    string,
    { enabled: boolean; handle: CustomJsonHandler }
  >;

  constructor(
    private readonly configService: ConfigService,
    private readonly jsonHelper: JsonHelper,
  ) {
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

  private getTransactionAccount(customJson: CustomJsonOperation[1]): string {
    return customJson.required_posting_auths[1] || customJson.required_auths[1];
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
    const parsedJson = this.jsonHelper.parseJson<WaivioOperation>(
      payload.json,
      null,
    );
    if (!parsedJson) return;
    const validated = waivioOperationSchema.safeParse(parsedJson);
    if (!validated.success) return;
    const account = this.getTransactionAccount(payload);
    const { data } = validated;

  }
}
