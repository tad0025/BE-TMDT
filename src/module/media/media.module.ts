import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { CloudinaryProvider } from './cloudinary.provider';
import { MediaScheduler } from './media.scheduler';

@Module({
  imports: [ConfigModule],
  controllers: [MediaController],
  providers: [MediaService, CloudinaryProvider, MediaScheduler],
  exports: [MediaService],
})
export class MediaModule {}
