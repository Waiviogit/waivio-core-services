import { Injectable } from '@nestjs/common';

@Injectable()
export class JsonHelper {
  /**
   * Safely parse a JSON string, returning a fallback value on failure
   */
  parseJson<T = unknown>(json: string, returnOnError: T): T {
    try {
      return JSON.parse(json) as T;
    } catch {
      return returnOnError;
    }
  }
}
