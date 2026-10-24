import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RateLimit } from '../common/rate-limit/rate-limit.guard.js';
import { AdminOnly } from '../common/decorators/admin.decorator.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import {
  MediaQueryDto,
  RegisterMediaDto,
  SignatureRequestDto,
  UpdateMediaDto,
} from './dto/media.dto.js';
import { MediaService } from './media.service.js';

@ApiTags('Media')
@AdminOnly()
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('signature')
  @RateLimit(60, 60_000)
  @ApiOperation({ summary: 'Get signed parameters for a direct Cloudinary upload' })
  signature(@Body() dto: SignatureRequestDto) {
    return this.media.createSignature(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Register an uploaded asset after verifying it with Cloudinary' })
  register(@Body() dto: RegisterMediaDto) {
    return this.media.register(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List media assets' })
  list(@Query() query: MediaQueryDto) {
    return this.media.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a media asset and where it is used' })
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.media.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update default alt text' })
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateMediaDto) {
    return this.media.updateAlt(id, dto.alt);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an asset (refused while it is still referenced)' })
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.media.remove(id);
  }
}
