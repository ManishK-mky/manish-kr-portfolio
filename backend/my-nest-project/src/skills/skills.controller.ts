import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminOnly } from '../common/decorators/admin.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { ReorderDto } from '../common/dto/reorder.dto.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import {
  CreateSkillCategoryDto,
  CreateSkillDto,
  UpdateSkillCategoryDto,
  UpdateSkillDto,
} from './dto/skill.dto.js';
import { SkillsService } from './skills.service.js';

@ApiTags('Skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Public()
  @Get()
  @ApiQuery({ name: 'grouped', required: false, type: Boolean })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiOperation({ summary: 'Skills, flat or grouped by category' })
  list(@Query('grouped') grouped?: string, @Query('featured') featured?: string) {
    if (grouped === 'true') return this.skills.grouped();
    return this.skills.list(featured === 'true');
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Skill categories in display order' })
  categories() {
    return this.skills.listCategories();
  }

  @Post('categories')
  @AdminOnly()
  createCategory(@Body() dto: CreateSkillCategoryDto) {
    return this.skills.createCategory(dto);
  }

  @Patch('categories/reorder')
  @AdminOnly()
  reorderCategories(@Body() dto: ReorderDto) {
    return this.skills.reorderCategories(dto.ids);
  }

  @Patch('categories/:id')
  @AdminOnly()
  updateCategory(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateSkillCategoryDto,
  ) {
    return this.skills.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @AdminOnly()
  removeCategory(@Param('id', ParseObjectIdPipe) id: string) {
    return this.skills.removeCategory(id);
  }

  @Post()
  @AdminOnly()
  create(@Body() dto: CreateSkillDto) {
    return this.skills.create(dto);
  }

  @Patch('reorder')
  @AdminOnly()
  reorder(@Body() dto: ReorderDto) {
    return this.skills.reorder(dto.ids);
  }

  @Patch(':id')
  @AdminOnly()
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateSkillDto) {
    return this.skills.update(id, dto);
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.skills.remove(id);
  }
}
