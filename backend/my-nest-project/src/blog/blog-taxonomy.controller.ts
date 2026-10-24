import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminOnly } from '../common/decorators/admin.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { BlogService } from './blog.service.js';
import { CreateTaxonomyDto, UpdateTaxonomyDto } from './dto/blog-post.dto.js';

/**
 * Registered before BlogController so `/blog/categories` and `/blog/tags`
 * aren't captured by `/blog/:slug`.
 */
@ApiTags('Blog taxonomy')
@Controller('blog')
export class BlogTaxonomyController {
  constructor(private readonly blog: BlogService) {}

  @Public()
  @Get('categories')
  @ApiQuery({ name: 'all', required: false, description: 'Include unused categories' })
  @ApiOperation({ summary: 'Blog categories with public post counts' })
  categories(@Query('all') all?: string) {
    return this.blog.listTaxonomy('category', all === 'true');
  }

  @Public()
  @Get('tags')
  @ApiQuery({ name: 'all', required: false, description: 'Include unused tags' })
  @ApiOperation({ summary: 'Blog tags with public post counts' })
  tags(@Query('all') all?: string) {
    return this.blog.listTaxonomy('tag', all === 'true');
  }

  @Post('categories')
  @AdminOnly()
  createCategory(@Body() dto: CreateTaxonomyDto) {
    return this.blog.createTaxonomy('category', dto.name, dto.description);
  }

  @Patch('categories/:id')
  @AdminOnly()
  updateCategory(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateTaxonomyDto) {
    return this.blog.updateTaxonomy('category', id, dto);
  }

  @Delete('categories/:id')
  @AdminOnly()
  removeCategory(@Param('id', ParseObjectIdPipe) id: string) {
    return this.blog.removeTaxonomy('category', id);
  }

  @Post('tags')
  @AdminOnly()
  createTag(@Body() dto: CreateTaxonomyDto) {
    return this.blog.createTaxonomy('tag', dto.name);
  }

  @Patch('tags/:id')
  @AdminOnly()
  updateTag(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateTaxonomyDto) {
    return this.blog.updateTaxonomy('tag', id, dto);
  }

  @Delete('tags/:id')
  @AdminOnly()
  removeTag(@Param('id', ParseObjectIdPipe) id: string) {
    return this.blog.removeTaxonomy('tag', id);
  }
}
