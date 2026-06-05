import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(private readonly configService: ConfigService) {}

  // ─── Legacy Upload (FE → BE → Cloudinary) ────────────────────────────────────
  // File được tự động gắn tag 'tmp'. Chỉ mất tag khi gọi confirmUpload().

  uploadFile(
    file: Express.Multer.File,
    folder: string = 'tm-dt',
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    if (!file) {
      throw new BadRequestException('File is not provided');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          tags: ['tmp'],
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Upload failed'));
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'tm-dt',
  ): Promise<(UploadApiResponse | UploadApiErrorResponse)[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are not provided');
    }

    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  // ─── Signed Upload (FE → Cloudinary trực tiếp) ───────────────────────────────
  // BE ký signature kèm tag 'tmp'. FE dùng params này POST thẳng lên Cloudinary.
  // FE gửi: file + signature + timestamp + api_key + folder + tags='tmp'
  // URL: https://api.cloudinary.com/v1_1/{cloudName}/image/upload

  generateSignedUploadParams(folder: string = 'tm-dt') {
    const timestamp = Math.round(Date.now() / 1000);
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET')!;
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');

    // 'tags' phải nằm trong paramsToSign để signature bắt buộc FE truyền đúng tag
    const paramsToSign: Record<string, string | number> = {
      folder,
      tags: 'tmp',
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    this.logger.log(`Generated signed upload params for folder: ${folder}`);

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      apiKey,
      cloudName,
      signature,
      timestamp,
      folder,
      tags: 'tmp', // FE phải truyền đúng giá trị này vào form-data
    };
  }

  // ─── Confirm Upload ───────────────────────────────────────────────────────────
  // Gọi khi file được lưu chính thức (gắn vào sản phẩm, user profile, v.v.)
  // Xóa tag 'tmp' → Cloudinary sẽ không xóa file này trong chu kỳ cleanup.

  async confirmUpload(publicIds: string[]): Promise<void> {
    if (!publicIds || publicIds.length === 0) {
      throw new BadRequestException('publicIds are required');
    }

    await cloudinary.uploader.remove_tag('tmp', publicIds);
    this.logger.log(`Confirmed and removed tmp tag from: [${publicIds.join(', ')}]`);
  }

  // ─── Cleanup Orphan Tmp Files ─────────────────────────────────────────────────
  // Gọi bởi MediaScheduler định kỳ mỗi nửa đêm.
  // Hỗ trợ pagination để xử lý >500 files tmp.

  async cleanupOrphanTmpFiles(): Promise<{ deleted: number }> {
    let nextCursor: string | undefined;
    let deletedCount = 0;
    let batchCount = 0;

    this.logger.log('[Cleanup] Starting orphan tmp file cleanup...');

    do {
      const result = await cloudinary.api.resources_by_tag('tmp', {
        max_results: 500,
        ...(nextCursor ? { next_cursor: nextCursor } : {}),
      });

      const publicIds: string[] = result.resources.map((r: { public_id: string }) => r.public_id);

      if (publicIds.length > 0) {
        batchCount++;
        await cloudinary.api.delete_resources(publicIds);
        deletedCount += publicIds.length;
        this.logger.log(
          `[Cleanup] Batch #${batchCount}: deleted ${publicIds.length} files (running total: ${deletedCount})`,
        );
      }

      nextCursor = result.next_cursor as string | undefined;
    } while (nextCursor);

    this.logger.log(`[Cleanup] Finished. Total orphan files deleted: ${deletedCount}`);
    return { deleted: deletedCount };
  }
}
