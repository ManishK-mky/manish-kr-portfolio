import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SLUG_PATTERN } from '../../common/utils/slug.js';

@Schema({ timestamps: true, collection: 'blog_categories' })
export class BlogCategory {
  @Prop({ required: true, trim: true, maxlength: 60 })
  name: string;

  @Prop({ required: true, unique: true, match: SLUG_PATTERN })
  slug: string;

  @Prop({ default: '', maxlength: 300 })
  description: string;
}
export const BlogCategorySchema = SchemaFactory.createForClass(BlogCategory);

@Schema({ timestamps: true, collection: 'blog_tags' })
export class BlogTag {
  @Prop({ required: true, trim: true, maxlength: 60 })
  name: string;

  @Prop({ required: true, unique: true, match: SLUG_PATTERN })
  slug: string;
}
export const BlogTagSchema = SchemaFactory.createForClass(BlogTag);
