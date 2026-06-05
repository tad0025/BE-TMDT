import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MediaService } from './media.service';

@Injectable()
export class MediaScheduler {
  private readonly logger = new Logger(MediaScheduler.name);

  constructor(private readonly mediaService: MediaService) {}

  /**
   * Chạy vào lúc 00:00 mỗi ngày (nửa đêm).
   * Quét toàn bộ file có tag 'tmp' trên Cloudinary và xóa sạch.
   * Hỗ trợ pagination — xử lý được trường hợp >500 files.
   *
   * Cron expression: '0 0 * * *'
   *   ┌── phút (0)
   *   │  ┌── giờ (0 = nửa đêm)
   *   │  │  ┌── ngày trong tháng (*)
   *   │  │  │  ┌── tháng (*)
   *   │  │  │  │  ┌── ngày trong tuần (*)
   *   0  0  *  *  *
   */
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
