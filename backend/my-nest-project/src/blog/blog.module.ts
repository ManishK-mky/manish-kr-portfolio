import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileModule } from '../profile/profile.module.js';
import { BlogTaxonomyController } from './blog-taxonomy.controller.js';
import { BlogController } from './blog.controller.js';
import { BlogService } from './blog.service.js';
import { BlogPost, BlogPostSchema } from './schemas/blog-post.schema.js';
import {
  BlogCategory,
  BlogCategorySchema,
  BlogTag,
  BlogTagSchema,
} from './schemas/blog-taxonomy.schema.js';

@Module({
  imports: [
    ProfileModule,
    MongooseModule.forFeature([
      { name: BlogPost.name, schema: BlogPostSchema },
      { name: BlogCategory.name, schema: BlogCategorySchema },
      { name: BlogTag.name, schema: BlogTagSchema },
    ]),
  ],
  // Order matters: taxonomy routes must be matched before `:slug`.
  controllers: [BlogTaxonomyController, BlogController],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule {}
