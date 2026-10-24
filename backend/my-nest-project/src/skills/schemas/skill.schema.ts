import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';
import { SLUG_PATTERN } from '../../common/utils/slug.js';

export const PROFICIENCY_LEVELS = ['Expert', 'Advanced', 'Proficient', 'Familiar'] as const;
export type Proficiency = (typeof PROFICIENCY_LEVELS)[number];

@Schema({ timestamps: true, collection: 'skill_categories' })
export class SkillCategory {
  @Prop({ required: true, trim: true, maxlength: 80 })
  name: string;

  @Prop({ required: true, unique: true, match: SLUG_PATTERN })
  slug: string;

  @Prop({ default: '', maxlength: 300 })
  description: string;

  @Prop({ default: 0, index: true })
  order: number;
}
export const SkillCategorySchema = SchemaFactory.createForClass(SkillCategory);

@Schema({ timestamps: true, collection: 'skills' })
export class Skill {
  @Prop({ required: true, trim: true, maxlength: 60 })
  name: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SkillCategory', required: true, index: true })
  category: Types.ObjectId;

  /** Icon key understood by the frontend icon map (e.g. "react", "database"). */
  @Prop({ default: '', maxlength: 60 })
  icon: string;

  @Prop({ type: String, enum: [...PROFICIENCY_LEVELS, null], default: null })
  proficiency: Proficiency | null;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ default: 0 })
  order: number;
}
export const SkillSchema = SchemaFactory.createForClass(Skill);
SkillSchema.index({ category: 1, order: 1 });
// The same skill name can't appear twice in one category.
SkillSchema.index(
  { category: 1, name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);
