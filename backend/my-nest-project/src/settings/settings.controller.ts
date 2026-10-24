import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOnly } from '../common/decorators/admin.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { SettingsService } from './settings.service.js';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Public site settings (SEO, footer, feature flags)' })
  getPublic() {
    return this.settings.get();
  }

  @Patch()
  @AdminOnly()
  @ApiOperation({ summary: 'Update site settings' })
  update(@Body() dto: UpdateSettingsDto) {
    return this.settings.update(dto);
  }
}
