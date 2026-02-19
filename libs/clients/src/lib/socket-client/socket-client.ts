import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import WebSocket from 'ws';
import {
  SOCKET_MODULE_OPTIONS,
  SocketModuleOptions,
} from './socket-client.options';

@Injectable()
export class SocketClient implements OnModuleDestroy {
  private readonly logger = new Logger(SocketClient.name);
  private ws: WebSocket | null = null;
  private readonly url: string;
  private readonly apiKey: string;

  constructor(@Inject(SOCKET_MODULE_OPTIONS) options: SocketModuleOptions) {
    this.url = options.url;
    this.apiKey = options.apiKey;
    this.connect();
  }

  private connect(): void {
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
    }

    this.ws = new WebSocket(this.url, [], {
      headers: { API_KEY: this.apiKey },
    });

    this.ws.on('open', () => {
      this.logger.log('Socket connection open');
    });

    this.ws.on('error', (error) => {
      this.logger.error(`Socket error: ${error.message}`);
      if (this.ws) {
        this.ws.close();
      }
    });

    this.ws.on('close', () => {
      this.logger.log('Socket connection closed');
      this.ws = null;
    });
  }

  sendMessage(message: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn('Socket not ready, reconnecting before sending message');
      this.connect();
      // Note: In the original implementation, the message is not sent if socket is not ready.
      // The reconnection happens but message sending is deferred until next call when socket is ready.
      return;
    }

    try {
      this.ws.send(message);
    } catch (error) {
      this.logger.error(`Failed to send message: ${error}`);
      this.connect();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.ws) {
      this.logger.log('Closing socket connection');
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
  }
}
