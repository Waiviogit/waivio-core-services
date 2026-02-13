import { Injectable } from '@nestjs/common';

@Injectable()
export class JsonHelper {
  /**
   * Safely parse a JSON string, returning a fallback value on failure
   */
  parseJson<T = unknown, F = null>(json: string, returnOnError: F): T | F {
    try {
      return JSON.parse(json) as T;
    } catch {
      return returnOnError;
    }
  }
}
