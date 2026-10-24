import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  GalleryImage,
  GalleryImageSchema,
  ImageRef,
  ImageRefSchema,
} from '../../common/schemas/image-ref.schema.js';
import { SLUG_PATTERN } from '../../common/utils/slug.js';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ _id: false })
export class ChallengeSolution {
  @Prop({ required: true, maxlength: 1000 })
  challenge: string;

  @Prop({ required: true, maxlength: 2000 })
  solution: string;
}

@Schema({ timestamps: true, collection: 'projects' })
export class Project {
  @Prop({ required: true, trim: true, maxlength: 140 })
  title: string;

  @Prop({ required: true, unique: true, match: SLUG_PATTERN, maxlength: 100 })
  slug: string;

  @Prop({ required: true, trim: true, maxlength: 300 })
  summary: string;

  /** Long-form description; paragraphs separated by blank lines. */
  @Prop({ default: '', maxlength: 20000 })
  description: string;

  @Prop({ type: ImageRefSchema, default: null })
  cover: ImageRef | null;

  @Prop({ type: [GalleryImageSchema], default: [] })
  gallery: GalleryImage[];

  @Prop({ type: [String], default: [], index: true })
  technologies: string[];

  @Prop({ default: '', trim: true, maxlength: 60, index: true })
  category: string;

  @Prop({ default: '' })
  githubUrl: string;

  @Prop({ default: '' })
  liveUrl: string;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ default: '', maxlength: 120 })
  role: string;

  @Prop({ type: [String], default: [] })
  responsibilities: string[];

  @Prop({ type: [ChallengeSolution], default: [] })
  challenges: ChallengeSolution[];

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ type: [String], default: [] })
  achievements: string[];

  @Prop({ default: false })
  featured: boolean;

  @Prop({ default: false })
  published: boolean;

  @Prop({ default: 0 })
  order: number;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
ProjectSchema.index({ published: 1, featured: -1, order: 1 });
ProjectSchema.index({ published: 1, order: 1, createdAt: -1 });
ProjectSchema.index({ 'cover.mediaId': 1 });
ProjectSchema.index({ 'gallery.mediaId': 1 });
ProjectSchema.index(
  { title: 'text', summary: 'text', technologies: 'text' },
  { weights: { title: 5, technologies: 3, summary: 1 }, name: 'project_text' },
);
