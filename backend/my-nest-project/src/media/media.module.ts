import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryService } from './cloudinary.service.js';
import { MediaReferenceRegistry } from './media-reference.registry.js';
import { MediaController } from './media.controller.js';
import { MediaService } from './media.service.js';
import { MediaAsset, MediaAssetSchema } from './schemas/media-asset.schema.js';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: MediaAsset.name, schema: MediaAssetSchema }]),
  ],
  controllers: [MediaController],
  providers: [MediaService, CloudinaryService, MediaReferenceRegistry],
  exports: [MediaService, MediaReferenceRegistry],
})
export class MediaModule {}
