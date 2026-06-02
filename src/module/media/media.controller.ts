import { Controller, Post, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException, Query, UseGuards } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from 'src/core/security/jwt/jwt-auth.guard';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) { }

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
        message: 'File uploaded successfully',
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
        }
      };
    } catch (error) {
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
        message: 'Files uploaded successfully',
        data: results.map(result => ({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
        }))
      };
    } catch (error) {
      throw new BadRequestException('Error uploading files to Cloudinary');
    }
  }
}
