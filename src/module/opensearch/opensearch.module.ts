import { Module } from '@nestjs/common';
import { OpensearchService } from './opensearch.service';

@Module({
  providers: [OpensearchService],
  exports: [OpensearchService],
})
export class OpensearchModule {}
