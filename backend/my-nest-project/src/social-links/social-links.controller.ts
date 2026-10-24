import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOnly } from '../common/decorators/admin.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { ReorderDto } from '../common/dto/reorder.dto.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { CreateSocialLinkDto, UpdateSocialLinkDto } from './dto/social-link.dto.js';
import { SocialLinksService } from './social-links.service.js';

@ApiTags('Social links')
@Controller('social-links')
export class SocialLinksController {
  constructor(private readonly links: SocialLinksService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Visible social links' })
  list() {
    return this.links.list();
  }

  @Get('admin')
  @AdminOnly()
  @ApiOperation({ summary: 'All social links, including hidden ones' })
  listAll() {
    return this.links.list(true);
  }

  @Post()
  @AdminOnly()
  create(@Body() dto: CreateSocialLinkDto) {
    return this.links.create(dto);
  }

  @Patch('reorder')
  @AdminOnly()
  reorder(@Body() dto: ReorderDto) {
    return this.links.reorder(dto.ids);
  }

  @Patch(':id')
  @AdminOnly()
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateSocialLinkDto) {
    return this.links.update(id, dto);
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.links.remove(id);
  }
}
