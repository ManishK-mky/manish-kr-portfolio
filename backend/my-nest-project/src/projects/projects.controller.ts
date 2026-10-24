import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminOnly } from '../common/decorators/admin.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { ReorderDto } from '../common/dto/reorder.dto.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import {
  AdminProjectQueryDto,
  CreateProjectDto,
  ProjectQueryDto,
  ProjectStatusDto,
  UpdateProjectDto,
} from './dto/project.dto.js';
import { ProjectsService } from './projects.service.js';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  // Static routes are declared before `:slug` so they take precedence.

  @Public()
  @Get()
  @ApiOperation({ summary: 'Published projects (paginated, filterable)' })
  list(@Query() query: ProjectQueryDto) {
    return this.projects.listPublic(query);
  }

  @Public()
  @Get('featured')
  @ApiQuery({ name: 'limit', required: false })
  @ApiOperation({ summary: 'Featured published projects' })
  featured(@Query('limit', new DefaultValuePipe(6), ParseIntPipe) limit: number) {
    return this.projects.featured(Math.min(Math.max(limit, 1), 24));
  }

  @Public()
  @Get('facets')
  @ApiOperation({ summary: 'Categories and technologies used by published projects' })
  facets() {
    return this.projects.facets();
  }

  @Get('admin')
  @AdminOnly()
  @ApiOperation({ summary: 'All projects including drafts' })
  listAdmin(@Query() query: AdminProjectQueryDto) {
    return this.projects.listAdmin(query);
  }

  @Get('admin/:id')
  @AdminOnly()
  @ApiOperation({ summary: 'Any project by id' })
  findById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.projects.findById(id);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Published project by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.projects.findPublicBySlug(slug);
  }

  @Post()
  @AdminOnly()
  create(@Body() dto: CreateProjectDto) {
    return this.projects.create(dto);
  }

  @Patch('reorder')
  @AdminOnly()
  @ApiOperation({ summary: 'Persist display order' })
  reorder(@Body() dto: ReorderDto) {
    return this.projects.reorder(dto.ids);
  }

  @Patch(':id/status')
  @AdminOnly()
  @ApiOperation({ summary: 'Publish or unpublish' })
  setStatus(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: ProjectStatusDto) {
    return this.projects.setStatus(id, dto.published);
  }

  @Patch(':id')
  @AdminOnly()
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update(id, dto);
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.projects.remove(id);
  }
}
