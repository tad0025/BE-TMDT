import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class MediaService {
  uploadFile(file: Express.Multer.File, folder: string = 'tm-dt'): Promise<UploadApiResponse | UploadApiErrorResponse> {
    if (!file) {
      throw new BadRequestException('File is not provided');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
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

  async uploadMultipleFiles(files: Express.Multer.File[], folder: string = 'tm-dt'): Promise<(UploadApiResponse | UploadApiErrorResponse)[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are not provided');
    }

    const uploadPromises = files.map(file => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }
}
