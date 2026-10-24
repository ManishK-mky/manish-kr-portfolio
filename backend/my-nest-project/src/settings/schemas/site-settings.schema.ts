import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ImageRef, ImageRefSchema } from '../../common/schemas/image-ref.schema.js';

/** Singleton (key = "main"). Everything here is safe to expose publicly. */
@Schema({ timestamps: true, collection: 'site_settings' })
export class SiteSettings {
  @Prop({ required: true, unique: true, default: 'main', immutable: true })
  key: string;

  @Prop({ default: 'Portfolio', maxlength: 80 })
  siteName: string;

  @Prop({ default: 'Portfolio — Full-stack engineer', maxlength: 120 })
  siteTitle: string;

  @Prop({ default: '', maxlength: 300 })
  siteDescription: string;

  @Prop({ default: '', maxlength: 200 })
  siteUrl: string;

  @Prop({ type: [String], default: [] })
  keywords: string[];

  @Prop({ type: ImageRefSchema, default: null })
  ogImage: ImageRef | null;

  @Prop({ default: '', maxlength: 200 })
  footerTagline: string;

  @Prop({ default: 'Let’s build something thoughtful together.', maxlength: 200 })
  contactHeadline: string;

  @Prop({ default: '', maxlength: 600 })
  contactText: string;

  @Prop({ default: true })
  contactFormEnabled: boolean;

  @Prop({ default: true })
  blogEnabled: boolean;
}

export const SiteSettingsSchema = SchemaFactory.createForClass(SiteSettings);
