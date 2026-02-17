import type { WaivioOperation } from '../../../domain/hive-parser/schemas';

export interface ObjectMethodContext {
  account: string;
  transactionId: string;
  timestamp: string;
}

export interface ObjectMethodHandler {
  handle(operation: WaivioOperation, ctx: ObjectMethodContext): Promise<void>;
}
