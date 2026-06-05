import {
  Controller,
  Post,
  Patch,
  Get,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from 'src/core/security/jwt/jwt-auth.guard';

class ConfirmUploadDto {
  publicIds: string[];
}

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // ─── Legacy Upload (FE → BE → Cloudinary) ──────────────────────────────────

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    try {
      const result = await this.mediaService.uploadFile(file, folder);

      return {
        success: true,
        message: 'File uploaded successfully (tagged as tmp, call /media/confirm to finalize)',
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
        },
      };
    } catch {
      throw new BadRequestException('Error uploading file to Cloudinary');
    }
  }

  @Post('uploads')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are required');
    }

    try {
      const results = await this.mediaService.uploadMultipleFiles(files, folder);

      return {
        success: true,
        message: 'Files uploaded successfully (tagged as tmp, call /media/confirm to finalize)',
        data: results.map((result) => ({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
        })),
      };
    } catch {
      throw new BadRequestException('Error uploading files to Cloudinary');
    }
  }

  // ─── Signed Upload (FE → Cloudinary trực tiếp) ─────────────────────────────

  /**
   * GET /media/sign?folder=xxx
   *
   * Trả về signed params để FE upload thẳng lên Cloudinary mà không qua BE.
   * FE thực hiện POST multipart/form-data tới `uploadUrl` với các trường:
   *   - file        : File thực tế
   *   - api_key     : từ response
   *   - signature   : từ response
   *   - timestamp   : từ response
   *   - folder      : từ response
   *   - tags        : 'tmp' (bắt buộc, đã được ký trong signature)
   */
  @Get('sign')
  @UseGuards(JwtAuthGuard)
  getSignedUploadParams(@Query('folder') folder?: string) {
    const data = this.mediaService.generateSignedUploadParams(folder);
    return {
      success: true,
      message: 'Signed upload params generated. Use these to upload directly to Cloudinary.',
      data,
    };
  }

  /**
   * PATCH /media/confirm
   * Body: { "publicIds": ["folder/abc123", "folder/def456"] }
   *
   * Gọi khi file được lưu chính thức (gắn vào sản phẩm, avatar, v.v.).
   * Xóa tag 'tmp' → file không bị scheduler cleanup hàng đêm.
   */
  @Patch('confirm')
  @UseGuards(JwtAuthGuard)
  async confirmUpload(@Body() body: ConfirmUploadDto) {
    if (!body?.publicIds || body.publicIds.length === 0) {
      throw new BadRequestException('publicIds array is required');
    }

    await this.mediaService.confirmUpload(body.publicIds);

    return {
      success: true,
      message: `Upload confirmed. Removed tmp tag from ${body.publicIds.length} file(s).`,
    };
  }
}
