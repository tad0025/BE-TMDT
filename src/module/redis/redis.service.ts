import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {
    const redisUri = this.configService.get<string>('REDIS_URI');
    if (!redisUri) {
      throw new Error('REDIS_URI is not defined in environment variables');
    }
    this.redis = new Redis(redisUri);
    
    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis/Valkey successfully.');
    });

    this.redis.on('error', (err) => {
      this.logger.error('Redis connection error:', err);
    });
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  /**
   * Set stock to Redis only if key does not exist (SETNX)
   */
  async setStockNx(productId: string, stock: number) {
    await this.redis.setnx(`product_stock:${productId}`, stock);
  }

  /**
   * Deduct stock atomically using Lua script.
   * Returns: 
   * 1  - Success
   * 0  - Insufficient stock
   * -1 - Key not found
   */
  async deductStock(productId: string, quantity: number): Promise<number> {
    const script = `
      local stockKey = KEYS[1]
      local quantity = tonumber(ARGV[1])
      
      local stock = redis.call('get', stockKey)
      
      if not stock then
        return -1
      end
      
      stock = tonumber(stock)
      if stock >= quantity then
        redis.call('decrby', stockKey, quantity)
        return 1
      else
        return 0
      end
    `;
    
    const result = await this.redis.eval(script, 1, `product_stock:${productId}`, quantity);
    return result as number;
  }

  /**
   * Restore stock if transaction fails
   */
  async restoreStock(items: { productId: string; quantity: number }[]) {
    if (!items || items.length === 0) return;
    
    const pipeline = this.redis.pipeline();
    for (const item of items) {
      pipeline.incrby(`product_stock:${item.productId}`, item.quantity);
    }
    await pipeline.exec();
    this.logger.log(`Restored stock for ${items.length} items in Redis.`);
  }
}
