import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@opensearch-project/opensearch';
import { ENV_VARS } from '../../constants/env.constants';

@Injectable()
export class OpensearchService implements OnModuleInit {
  private readonly logger = new Logger(OpensearchService.name);
  private client: Client;
  private readonly INDEX_NAME = 'products';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const node = this.configService.get<string>(ENV_VARS.OPENSEARCH_NODE);
    const username = this.configService.get<string>(ENV_VARS.OPENSEARCH_USERNAME);
    const password = this.configService.get<string>(ENV_VARS.OPENSEARCH_PASSWORD);

    if (!node || !username || !password) {
      this.logger.warn('OpenSearch configuration is missing in .env. Skipping connection.');
      return;
    }

    this.client = new Client({
      node,
      auth: {
        username,
        password,
      },
      ssl: {
        rejectUnauthorized: false,
      },
    });

    try {
      const ping = await this.client.ping();
      if (ping.body) {
        this.logger.log('Successfully connected to OpenSearch cluster');
        await this.initIndex();
      } else {
        this.logger.error('Failed to connect to OpenSearch cluster');
      }
    } catch (error) {
      this.logger.error('Error connecting to OpenSearch:', error.message);
    }
  }

  private async initIndex() {
    try {
      const { body: indexExists } = await this.client.indices.exists({ index: this.INDEX_NAME });
      
      if (!indexExists) {
        await this.client.indices.create({
          index: this.INDEX_NAME,
          body: {
            settings: {
              analysis: {
                analyzer: {
                  vn_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'asciifolding'],
                  },
                },
              },
            },
            mappings: {
              properties: {
                id: { type: 'keyword' },
                name: { type: 'text', analyzer: 'vn_analyzer' },
                description: { type: 'text', analyzer: 'vn_analyzer' },
                price: { type: 'double' },
                categoryId: { type: 'keyword' },
                rating: { type: 'double' },
                createdAt: { type: 'date' },
              },
            },
          },
        });
        this.logger.log(`Created index: ${this.INDEX_NAME}`);
      }
    } catch (error) {
      this.logger.error(`Error checking/creating index ${this.INDEX_NAME}:`, error.message);
    }
  }

  async indexProduct(product: any) {
    if (!this.client) return;
    try {
      await this.client.index({
        index: this.INDEX_NAME,
        id: product.id,
        body: {
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: Number(product.price),
          categoryId: product.category?.id || null,
          rating: Number(product.rating || 0),
          createdAt: product.createdAt,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to index product ${product.id}`, error.message);
    }
  }

  async updateProduct(id: string, productData: any) {
    if (!this.client) return;
    try {
      const doc: any = { ...productData };
      if (productData.price) doc.price = Number(productData.price);
      if (productData.rating) doc.rating = Number(productData.rating);
      if (productData.category?.id) doc.categoryId = productData.category.id;

      await this.client.update({
        index: this.INDEX_NAME,
        id,
        body: {
          doc,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update product ${id} in OpenSearch`, error.message);
    }
  }

  async removeProduct(id: string) {
    if (!this.client) return;
    try {
      await this.client.delete({
        index: this.INDEX_NAME,
        id,
      });
    } catch (error) {
      this.logger.error(`Failed to delete product ${id} from OpenSearch`, error.message);
    }
  }

  async searchProductIds(keyword: string): Promise<string[]> {
    if (!this.client) return [];
    try {
      const { body } = await this.client.search({
        index: this.INDEX_NAME,
        body: {
          query: {
            multi_match: {
              query: keyword,
              fields: ['name'],
              operator: 'and',
            },
          },
          _source: false, // We only need IDs
          size: 1000,
        },
      });

      const hits = body.hits.hits;
      return hits.map((hit: any) => hit._id);
    } catch (error) {
      this.logger.error('Failed to search products in OpenSearch:', error.message);
      return [];
    }
  }
}
