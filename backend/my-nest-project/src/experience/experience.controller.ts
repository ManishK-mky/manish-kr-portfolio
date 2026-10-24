import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOnly } from '../common/decorators/admin.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { ReorderDto } from '../common/dto/reorder.dto.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto.js';
import { ExperienceService } from './experience.service.js';

@ApiTags('Experience')
@Controller('experience')
export class ExperienceController {
  constructor(private readonly experience: ExperienceService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Experience timeline with companies populated' })
  list() {
    return this.experience.list();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.experience.findById(id);
  }

  @Post()
  @AdminOnly()
  create(@Body() dto: CreateExperienceDto) {
    return this.experience.create(dto);
  }

  @Patch('reorder')
  @AdminOnly()
  reorder(@Body() dto: ReorderDto) {
    return this.experience.reorder(dto.ids);
  }

  @Patch(':id')
  @AdminOnly()
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateExperienceDto) {
    return this.experience.update(id, dto);
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.experience.remove(id);
  }
}
