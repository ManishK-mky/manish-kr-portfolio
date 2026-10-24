import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminOnly } from '../common/decorators/admin.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { CompaniesService } from './companies.service.js';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto.js';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Public()
  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiOperation({ summary: 'All companies' })
  list(@Query('search') search?: string) {
    return this.companies.list(typeof search === 'string' ? search.slice(0, 100) : undefined);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.companies.findById(id);
  }

  @Post()
  @AdminOnly()
  create(@Body() dto: CreateCompanyDto) {
    return this.companies.create(dto);
  }

  @Patch(':id')
  @AdminOnly()
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateCompanyDto) {
    return this.companies.update(id, dto);
  }

  @Delete(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Delete a company (refused while positions reference it)' })
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.companies.remove(id);
  }
}
