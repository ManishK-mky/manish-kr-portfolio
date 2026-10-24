import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ImageRef, ImageRefSchema } from '../../common/schemas/image-ref.schema.js';

@Schema({ timestamps: true, collection: 'education' })
export class Education {
  @Prop({ required: true, trim: true, maxlength: 160 })
  institution: string;

  @Prop({ type: ImageRefSchema, default: null })
  logo: ImageRef | null;

  @Prop({ default: '' })
  website: string;

  @Prop({ required: true, trim: true, maxlength: 160 })
  degree: string;

  @Prop({ default: '', maxlength: 160 })
  fieldOfStudy: string;

  @Prop()
  startDate?: Date;

  /** Graduation (or expected graduation) date. */
  @Prop()
  endDate?: Date;

  @Prop({ default: '', maxlength: 60 })
  grade: string;

  @Prop({ type: [String], default: [] })
  coursework: string[];

  @Prop({ type: [String], default: [] })
  achievements: string[];

  @Prop({ type: [String], default: [] })
  activities: string[];

  @Prop({ default: '', maxlength: 2000 })
  description: string;

  @Prop({ default: 0 })
  order: number;
}

export const EducationSchema = SchemaFactory.createForClass(Education);
EducationSchema.index({ order: 1, endDate: -1 });
EducationSchema.index({ 'logo.mediaId': 1 });
