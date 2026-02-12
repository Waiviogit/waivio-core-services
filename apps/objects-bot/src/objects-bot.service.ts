import { Injectable } from '@nestjs/common';

@Injectable()
export class ObjectsBotService {
  getHello(): string {
    return 'Hello World!';
  }
}
