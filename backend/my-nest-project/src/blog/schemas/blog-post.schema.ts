import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ImageRef, ImageRefSchema } from '../../common/schemas/image-ref.schema.js';
import { SLUG_PATTERN } from '../../common/utils/slug.js';
import type { TiptapNode, TocEntry } from '../rendering/tiptap-renderer.js';

export type BlogPostDocument = HydratedDocument<BlogPost>;

export const POST_STATUSES = ['draft', 'scheduled', 'published'] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

@Schema({ _id: false })
export class PostAuthor {
  @Prop({ required: true, maxlength: 120 })
  name: string;

  @Prop({ default: '' })
  avatarUrl: string;
}

@Schema({ _id: false })
export class PostSeo {
  @Prop({ default: '', maxlength: 70 })
  title: string;

  @Prop({ default: '', maxlength: 170 })
  description: string;

  @Prop({ default: '' })
  canonicalUrl: string;
}

@Schema({ _id: false })
export class TocItem {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true, min: 1, max: 6 })
  level: number;
}

@Schema({ timestamps: true, collection: 'blog_posts', minimize: false })
export class BlogPost {
  @Prop({ required: true, trim: true, maxlength: 160 })
  title: string;

  @Prop({ required: true, unique: true, match: SLUG_PATTERN, maxlength: 100 })
  slug: string;

  @Prop({ default: '', maxlength: 400 })
  excerpt: string;

  @Prop({ type: ImageRefSchema, default: null })
  coverImage: ImageRef | null;

  /** Tiptap JSON document — the source of truth for the article body. */
  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  content: TiptapNode;

  /** Sanitized HTML rendered from `content` on every save. */
  @Prop({ default: '' })
  html: string;

  @Prop({ type: [TocItem], default: [] })
  toc: TocEntry[];

  /** Plain text for full-text search; never returned to clients. */
  @Prop({ default: '', select: false })
  contentText: string;

  /** Inline image URLs, used to stop referenced media from being deleted. */
  @Prop({ type: [String], default: [], index: true })
  inlineImages: string[];

  @Prop({ default: 1, min: 1 })
  readingTime: number;

  @Prop({ default: 0, min: 0 })
  wordCount: number;

  @Prop({ type: PostAuthor, required: true })
  author: PostAuthor;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'BlogCategory', default: null, index: true })
  category: Types.ObjectId | null;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'BlogTag' }], default: [], index: true })
  tags: Types.ObjectId[];

  @Prop({ type: String, enum: POST_STATUSES, default: 'draft' })
  status: PostStatus;

  @Prop({ type: Date, default: null })
  publishedAt: Date | null;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ type: PostSeo, default: () => ({}) })
  seo: PostSeo;
}

export const BlogPostSchema = SchemaFactory.createForClass(BlogPost);
BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ status: 1, featured: -1, publishedAt: -1 });
BlogPostSchema.index({ 'coverImage.mediaId': 1 });
BlogPostSchema.index(
  { title: 'text', excerpt: 'text', contentText: 'text' },
  { weights: { title: 10, excerpt: 4, contentText: 1 }, name: 'post_text' },
);
