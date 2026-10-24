import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MediaAssetDocument = HydratedDocument<MediaAsset>;

export const MEDIA_FOLDERS = [
  'profile',
  'projects',
  'companies',
  'education',
  'blog',
  'site',
  'documents',
] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];
export const CLOUDINARY_ROOT = 'portfolio';

@Schema({ timestamps: true, collection: 'media_assets' })
export class MediaAsset {
  @Prop({ required: true, unique: true })
  publicId: string;

  @Prop({ required: true })
  url: string;

  @Prop({ type: String, enum: ['image', 'raw'], required: true })
  resourceType: 'image' | 'raw';

  @Prop({ type: String, enum: MEDIA_FOLDERS, required: true, index: true })
  folder: MediaFolder;

  @Prop()
  format?: string;

  @Prop({ required: true, min: 0 })
  bytes: number;

  @Prop()
  width?: number;

  @Prop()
  height?: number;

  @Prop({ default: '' })
  originalFilename: string;

  @Prop({ default: '', maxlength: 300 })
  alt: string;
}

export const MediaAssetSchema = SchemaFactory.createForClass(MediaAsset);
MediaAssetSchema.index({ createdAt: -1 });
MediaAssetSchema.index({ originalFilename: 'text', alt: 'text' });
