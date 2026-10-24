import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RateLimit } from '../common/rate-limit/rate-limit.guard.js';
import { AdminOnly } from '../common/decorators/admin.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { ContactService } from './contact.service.js';
import { ContactQueryDto, CreateContactDto, UpdateContactDto } from './dto/contact.dto.js';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @RateLimit(5, 10 * 60_000)
  @ApiOperation({ summary: 'Send a message (rate limited, spam filtered)' })
  submit(@Body() dto: CreateContactDto, @Headers('user-agent') userAgent?: string) {
    return this.contact.submit(dto, userAgent);
  }

  @Get()
  @AdminOnly()
  @ApiOperation({ summary: 'Inbox' })
  list(@Query() query: ContactQueryDto) {
    return this.contact.list(query);
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Mark read or unread' })
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateContactDto) {
    return this.contact.setRead(id, dto.read);
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.contact.remove(id);
  }
}
