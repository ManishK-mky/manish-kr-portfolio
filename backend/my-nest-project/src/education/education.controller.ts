import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOnly } from '../common/decorators/admin.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { ReorderDto } from '../common/dto/reorder.dto.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { CreateEducationDto, UpdateEducationDto } from './dto/education.dto.js';
import { EducationService } from './education.service.js';

@ApiTags('Education')
@Controller('education')
export class EducationController {
  constructor(private readonly education: EducationService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Education records in display order' })
  list() {
    return this.education.list();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.education.findById(id);
  }

  @Post()
  @AdminOnly()
  create(@Body() dto: CreateEducationDto) {
    return this.education.create(dto);
  }

  @Patch('reorder')
  @AdminOnly()
  reorder(@Body() dto: ReorderDto) {
    return this.education.reorder(dto.ids);
  }

  @Patch(':id')
  @AdminOnly()
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateEducationDto) {
    return this.education.update(id, dto);
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.education.remove(id);
  }
}
