import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export const SOCIAL_PLATFORMS = [
  'github',
  'linkedin',
  'x',
  'email',
  'website',
  'youtube',
  'dribbble',
  'mastodon',
  'bluesky',
  'other',
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

@Schema({ timestamps: true, collection: 'social_links' })
export class SocialLink {
  @Prop({ type: String, enum: SOCIAL_PLATFORMS, required: true })
  platform: SocialPlatform;

  @Prop({ required: true, maxlength: 60, trim: true })
  label: string;

  @Prop({ required: true, maxlength: 500, trim: true })
  url: string;

  @Prop({ default: true })
  visible: boolean;

  /** Shown as an icon next to the hero CTAs. */
  @Prop({ default: false })
  showInHero: boolean;

  @Prop({ default: 0, index: true })
  order: number;
}
export const SocialLinkSchema = SchemaFactory.createForClass(SocialLink);
SocialLinkSchema.index({ platform: 1, url: 1 }, { unique: true });
