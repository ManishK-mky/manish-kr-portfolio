import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ImageRefDto } from '../../common/dto/image-ref.dto.js';
import { OptionalUrl, Trim } from '../../common/dto/validators.js';

export class CreateCompanyDto {
  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ type: ImageRefDto, nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @ValidateNested()
  @Type(() => ImageRefDto)
  @IsOptional()
  logo?: ImageRefDto | null;

  @ApiPropertyOptional()
  @OptionalUrl()
  website?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  @IsOptional()
  location?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(80)
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(600)
  @IsOptional()
  description?: string;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}
