import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ImageRef, ImageRefSchema } from '../../common/schemas/image-ref.schema.js';
import { SLUG_PATTERN } from '../../common/utils/slug.js';

/** Reusable company entity shared by every position held there. */
@Schema({ timestamps: true, collection: 'companies' })
export class Company {
  @Prop({ required: true, trim: true, maxlength: 120 })
  name: string;

  @Prop({ required: true, unique: true, match: SLUG_PATTERN })
  slug: string;

  @Prop({ type: ImageRefSchema, default: null })
  logo: ImageRef | null;

  @Prop({ default: '' })
  website: string;

  @Prop({ default: '', maxlength: 120 })
  location: string;

  @Prop({ default: '', maxlength: 80 })
  industry: string;

  @Prop({ default: '', maxlength: 600 })
  description: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
CompanySchema.index({ name: 1 });
CompanySchema.index({ 'logo.mediaId': 1 });
