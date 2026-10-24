import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';

/**
 * Denormalized snapshot of a MediaAsset embedded in the record that uses it.
 * `mediaId` keeps the link for reference checks; the rest avoids a lookup when
 * rendering public pages.
 */
@Schema({ _id: false })
export class ImageRef {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'MediaAsset', required: true })
  mediaId: Types.ObjectId;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  publicId: string;

  @Prop()
  width?: number;

  @Prop()
  height?: number;

  @Prop({ default: '' })
  alt: string;
}
export const ImageRefSchema = SchemaFactory.createForClass(ImageRef);

@Schema({ _id: false })
export class GalleryImage extends ImageRef {
  @Prop({ default: '' })
  caption: string;
}
export const GalleryImageSchema = SchemaFactory.createForClass(GalleryImage);
