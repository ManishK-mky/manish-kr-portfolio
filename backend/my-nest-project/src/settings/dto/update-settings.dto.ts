import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ImageRefDto } from '../../common/dto/image-ref.dto.js';
import { OptionalUrl, StringList, Trim } from '../../common/dto/validators.js';

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @IsOptional()
  siteName?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @IsOptional()
  siteTitle?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(300)
  @IsOptional()
  siteDescription?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @OptionalUrl()
  siteUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @StringList(30, 60)
  keywords?: string[];

  @ApiPropertyOptional({ type: ImageRefDto, nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @ValidateNested()
  @Type(() => ImageRefDto)
  @IsOptional()
  ogImage?: ImageRefDto | null;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(200)
  @IsOptional()
  footerTagline?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(200)
  @IsOptional()
  contactHeadline?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(600)
  @IsOptional()
  contactText?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  contactFormEnabled?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  blogEnabled?: boolean;
}
