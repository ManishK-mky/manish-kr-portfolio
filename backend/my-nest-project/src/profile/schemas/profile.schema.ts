import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';
import { ImageRef, ImageRefSchema } from '../../common/schemas/image-ref.schema.js';

export const AVAILABILITY_STATUSES = ['available', 'open', 'unavailable'] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

@Schema({ _id: false })
export class Availability {
  @Prop({ type: String, enum: AVAILABILITY_STATUSES, default: 'available' })
  status: AvailabilityStatus;

  @Prop({ default: 'Available for new projects', maxlength: 80 })
  label: string;

  @Prop({ default: true })
  visible: boolean;
}

@Schema({ _id: false })
export class DocumentRef {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'MediaAsset', required: true })
  mediaId: Types.ObjectId;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  publicId: string;

  @Prop({ default: '' })
  filename: string;
}

@Schema({ _id: false })
export class Stat {
  @Prop({ required: true, maxlength: 40 })
  value: string;

  @Prop({ required: true, maxlength: 60 })
  label: string;
}

/** Singleton document (key = "main") holding hero and about content. */
@Schema({ timestamps: true, collection: 'profile' })
export class Profile {
  @Prop({ required: true, unique: true, default: 'main', immutable: true })
  key: string;

  @Prop({ required: true, maxlength: 120 })
  name: string;

  @Prop({ default: '', maxlength: 120 })
  role: string;

  @Prop({ default: '', maxlength: 120 })
  greeting: string;

  @Prop({ required: true, maxlength: 200 })
  headline: string;

  @Prop({ default: '', maxlength: 600 })
  intro: string;

  /** Long-form about text; paragraphs separated by blank lines. */
  @Prop({ default: '', maxlength: 8000 })
  bio: string;

  @Prop({ type: ImageRefSchema, default: null })
  avatar: ImageRef | null;

  @Prop({ type: ImageRefSchema, default: null })
  aboutImage: ImageRef | null;

  @Prop({ default: '', maxlength: 120 })
  location: string;

  @Prop({ default: '', maxlength: 254 })
  email: string;

  @Prop({ type: Availability, default: () => ({}) })
  availability: Availability;

  @Prop({ type: DocumentRef, default: null })
  cv: DocumentRef | null;

  @Prop({ type: [Stat], default: [] })
  stats: Stat[];
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
