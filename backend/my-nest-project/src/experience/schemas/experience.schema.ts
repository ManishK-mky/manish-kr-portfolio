import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';

export const EMPLOYMENT_TYPES = [
  'full-time',
  'part-time',
  'contract',
  'freelance',
  'internship',
  'self-employed',
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const WORK_MODES = ['remote', 'onsite', 'hybrid'] as const;
export type WorkMode = (typeof WORK_MODES)[number];

/** One position. Several positions may reference the same company. */
@Schema({ timestamps: true, collection: 'experience' })
export class Experience {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true, index: true })
  company: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 120 })
  title: string;

  @Prop({ type: String, enum: EMPLOYMENT_TYPES, default: 'full-time' })
  employmentType: EmploymentType;

  @Prop({ default: '', maxlength: 120 })
  location: string;

  @Prop({ type: String, enum: WORK_MODES, default: 'onsite' })
  workMode: WorkMode;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ type: Date, default: null })
  endDate: Date | null;

  @Prop({ default: false })
  current: boolean;

  @Prop({ default: '', maxlength: 1000 })
  summary: string;

  @Prop({ type: [String], default: [] })
  responsibilities: string[];

  @Prop({ type: [String], default: [] })
  achievements: string[];

  @Prop({ type: [String], default: [] })
  technologies: string[];

  @Prop({ default: 0 })
  order: number;
}

export const ExperienceSchema = SchemaFactory.createForClass(Experience);
ExperienceSchema.index({ order: 1, startDate: -1 });
