import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CUSTOM_JSON_ID } from '../../constants/hive-parser';
import { CustomJsonOperation } from '@hiveio/dhive/lib/chain/operation';
import { HiveTransaction } from '@waivio-core-services/clients';
import {
  JsonHelper,
  HIVE_ENGINE_CONTRACT,
  HIVE_ENGINE_ACTION,
  HIVE_ENGINE_TOKEN,
} from '@waivio-core-services/common';
import { waivioOperationSchema } from './schemas';
import { ObjectHandlerService } from '../object-handler';
import { FieldWeightRecalcService } from '../object-handler/field-weight-recalc.service';
import { WaivStakeRepository } from '../../repositories';

type WaivioOperationPayload = {
  method: string;
  params: Record<string, unknown>;
};

type CustomJsonHandler = (
  payload: CustomJsonOperation[1],
  transaction: HiveTransaction,
  timestamp: string,
  operationIndex: number,
) => Promise<void>;

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
    private readonly objectHandlerService: ObjectHandlerService,
    private readonly fieldWeightRecalcService: FieldWeightRecalcService,
    private readonly waivStakeRepository: WaivStakeRepository,
  ) {
    this.handlers = {
      [CUSTOM_JSON_ID.WAIVIO_OPERATIONS]: {
        enabled: this.configService.get<boolean>(
          'hive.customJsonHandlers.waivioOperations.enabled',
          true,
        ),
        handle: (p, t, ts, idx) => this.handleWaivioOperations(p, t, ts, idx),
      },
      [CUSTOM_JSON_ID.HIVE_ENGINE]: {
        enabled: this.configService.get<boolean>(
          'hive.customJsonHandlers.hiveEngine.enabled',
          true,
        ),
        handle: (p, t, ts, idx) => this.handleHiveEngine(p, t, ts, idx),
      },
    };
  }

  private getTransactionAccount(customJson: CustomJsonOperation[1]): string {
    return customJson.required_posting_auths[0] || customJson.required_auths[0];
  }

  async parse(
    payload: CustomJsonOperation[1],
    transaction: HiveTransaction,
    timestamp: string,
    operationIndex: number,
  ): Promise<void> {
    const handler = this.handlers[payload.id];
    if (!handler?.enabled) return;
    await handler.handle(payload, transaction, timestamp, operationIndex);
  }

  private async handleWaivioOperations(
    payload: CustomJsonOperation[1],
    transaction: HiveTransaction,
    timestamp: string,
    operationIndex: number,
  ): Promise<void> {
    const parsedJson = this.jsonHelper.parseJson<WaivioOperationPayload[]>(
      payload.json,
      null,
    );
    if (!parsedJson) return;

    for (let actionIndex = 0; actionIndex < parsedJson.length; actionIndex++) {
      const waivioOperationPayload = parsedJson[actionIndex];
      const validated = waivioOperationSchema.safeParse(waivioOperationPayload);
      if (!validated.success) continue;

      const account = this.getTransactionAccount(payload);
      const transactionId = `${transaction.transaction_id}-${operationIndex}-${actionIndex}`;

      await this.objectHandlerService.handle(validated.data, {
        account,
        transactionId,
        timestamp,
      });
    }
  }

  private async handleHiveEngine(
    payload: CustomJsonOperation[1],
    transaction: HiveTransaction,
    timestamp: string,
    operationIndex: number,
  ): Promise<void> {
    const parsedJson = this.jsonHelper.parseJson<{
      contractName?: string;
      contractAction?: string;
      contractPayload?: {
        symbol?: string;
        to?: string;
        quantity?: string;
        from?: string;
      };
    }>(payload.json, null);

    if (!parsedJson) return;

    const { contractName, contractAction, contractPayload } = parsedJson;

    if (
      contractName !== HIVE_ENGINE_CONTRACT.TOKENS ||
      (contractAction !== HIVE_ENGINE_ACTION.STAKE &&
        contractAction !== HIVE_ENGINE_ACTION.DELEGATE) ||
      !contractPayload
    ) {
      return;
    }

    const { symbol, to, quantity, from } = contractPayload;

    if (symbol !== HIVE_ENGINE_TOKEN.WAIV || !to || !quantity) return;

    const account = to;
    const stakeDelta = parseFloat(quantity);

    if (isNaN(stakeDelta)) return;

    const currentStake = await this.waivStakeRepository.findOne({
      filter: { account },
    });

    const currentStakeAmount = currentStake?.stake ?? 0;
    const newStakeAmount = currentStakeAmount + stakeDelta;

    await this.waivStakeRepository.upsertStake(account, newStakeAmount);

    if (currentStakeAmount !== newStakeAmount) {
      await this.fieldWeightRecalcService.recalculateFieldWeightsForVoter(
        account,
      );
    }
  }
}
