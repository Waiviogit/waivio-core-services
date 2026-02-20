import { Injectable, Logger } from '@nestjs/common';
import type {
  FieldUpdateContext,
  IFieldUpdateStrategy,
} from './field-update-strategy.interface';

@Injectable()
export class FieldUpdateOrchestrator {
  private readonly logger = new Logger(FieldUpdateOrchestrator.name);

  constructor(private readonly strategies: IFieldUpdateStrategy[]) {}

  async handle(context: FieldUpdateContext): Promise<void> {
    const supported = this.strategies.filter((s) => s.supports(context));
    for (const strategy of supported) {
      try {
        await strategy.execute(context);
      } catch (err) {
        this.logger.error(
          `Strategy failed: ${err instanceof Error ? err.message : String(err)}`,
        );
        throw err;
      }
    }
  }
}
