import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOnly } from '../common/decorators/admin.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { BlogService } from './blog.service.js';
import {
  AdminPostQueryDto,
  CreatePostDto,
  PostQueryDto,
  PostStatusDto,
  PreviewPostDto,
  UpdatePostDto,
} from './dto/blog-post.dto.js';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Published posts (search, category, tag, pagination)' })
  list(@Query() query: PostQueryDto) {
    return this.blog.listPublic(query);
  }

  @Public()
  @Get('sitemap')
  @ApiOperation({ summary: 'Slugs and dates of published posts' })
  sitemap() {
    return this.blog.sitemap();
  }

  @Get('admin')
  @AdminOnly()
  @ApiOperation({ summary: 'All posts including drafts and scheduled' })
  listAdmin(@Query() query: AdminPostQueryDto) {
    return this.blog.listAdmin(query);
  }

  @Get('admin/:id')
  @AdminOnly()
  @ApiOperation({ summary: 'Any post by id, including its Tiptap JSON' })
  findById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.blog.findById(id);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'A published post by slug (drafts return 404)' })
  findBySlug(@Param('slug') slug: string) {
    return this.blog.findPublicBySlug(slug);
  }

  @Post()
  @AdminOnly()
  create(@Body() dto: CreatePostDto) {
    return this.blog.create(dto);
  }

  @Post(':id/preview')
  @AdminOnly()
  @ApiOperation({ summary: 'Render a post (optionally with unsaved content) for preview' })
  preview(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: PreviewPostDto) {
    return this.blog.preview(id, dto.content);
  }

  @Patch(':id/status')
  @AdminOnly()
  @ApiOperation({ summary: 'Publish, schedule or unpublish' })
  setStatus(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: PostStatusDto) {
    return this.blog.setStatus(id, dto.status, dto.publishedAt);
  }

  @Patch(':id')
  @AdminOnly()
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdatePostDto) {
    return this.blog.update(id, dto);
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.blog.remove(id);
  }
}
