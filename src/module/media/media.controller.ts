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
