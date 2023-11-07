import { createClient } from 'redis';
import Logger from 'bunyan';
import { config } from '../../../config';

export type RedisClient = ReturnType<typeof createClient>;

export abstract class BaseCache {
  client: RedisClient;
  log: Logger;

  constructor(cacheName: string) {
    this.client = createClient({ url: config.REDIS_HOST });
    this.log = config.createLogger(cacheName);
    this.cacheError();
  }

  private cacheError(): void {
    this.client.on('error', (error: unknown) => {
      this.log.error(error);
    });
  }
}

// OR //////////////////////////////////////

// export async function baseCache(cacheName: string) {
//   const client: RedisClient = await createClient({ url: config.REDIS_HOST });
//   const log: Logger = config.createLogger(cacheName);
//   cacheError(client, log);
// }

// function cacheError(client: RedisClient, log: Logger): void {
//   client.on('error', (error: unknown) => {
//     log.error(error);
//   });
// }
