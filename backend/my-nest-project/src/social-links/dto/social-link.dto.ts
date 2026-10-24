import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Trim } from '../../common/dto/validators.js';
import { SOCIAL_PLATFORMS, type SocialPlatform } from '../schemas/social-link.schema.js';

export class CreateSocialLinkDto {
  @ApiProperty({ enum: SOCIAL_PLATFORMS })
  @IsIn(SOCIAL_PLATFORMS)
  platform: SocialPlatform;

  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  label: string;

  @ApiProperty({ example: 'https://github.com/username or mailto:me@example.com' })
  @Trim()
  @IsString()
  @MaxLength(500)
  @Matches(/^(https?:\/\/[^\s]+|mailto:[^\s@]+@[^\s@]+)$/, {
    message: 'url must be an http(s) or mailto: link',
  })
  url: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  visible?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  showInHero?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdateSocialLinkDto extends PartialType(CreateSocialLinkDto) {}
