import {
  Controller,
  Patch,
  Get,
  BadRequestException,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { JwtAuthGuard } from 'src/core/security/jwt/jwt-auth.guard';

class ConfirmUploadDto {
  publicIds: string[];
}

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * GET /media/sign?folder=xxx
   *
   * Tạo signed params để FE upload thẳng lên Cloudinary mà không qua BE server.
   * FE thực hiện POST multipart/form-data tới `uploadUrl` với các trường:
   *   - file        : File thực tế người dùng chọn
   *   - api_key     : lấy từ response
   *   - signature   : lấy từ response
   *   - timestamp   : lấy từ response
   *   - folder      : lấy từ response
   *   - tags        : 'tmp' (bắt buộc, đã được ký trong signature)
   *
   * Sau khi upload thành công, Cloudinary trả về { public_id, secure_url }.
   * FE lưu public_id để gọi PATCH /media/confirm khi lưu thực thể chính thức.
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
   * Xóa tag 'tmp' → file không bị scheduler cleanup hàng đêm xóa.
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
