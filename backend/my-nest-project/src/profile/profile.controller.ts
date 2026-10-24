import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOnly } from '../common/decorators/admin.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ProfileService } from './profile.service.js';

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Hero and about content' })
  get() {
    return this.profile.get();
  }

  @Patch()
  @AdminOnly()
  @ApiOperation({ summary: 'Update hero and about content' })
  update(@Body() dto: UpdateProfileDto) {
    return this.profile.update(dto);
  }
}
