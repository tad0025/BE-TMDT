import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MediaService } from './media.service';

@Injectable()
export class MediaScheduler {
  private readonly logger = new Logger(MediaScheduler.name);

  constructor(private readonly mediaService: MediaService) {}

  

  @Cron('0 0 * * *')
  async handleDailyTmpCleanup(): Promise<void> {
    this.logger.log('[Scheduler] Daily tmp file cleanup triggered at midnight');

    try {
      const { deleted } = await this.mediaService.cleanupOrphanTmpFiles();
      this.logger.log(`[Scheduler] Cleanup complete — ${deleted} orphan tmp file(s) removed`);
    } catch (error) {
      this.logger.error('[Scheduler] Cleanup failed with error', error);
    }
  }
}
