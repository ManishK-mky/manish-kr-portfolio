import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ImageRefDto } from '../../common/dto/image-ref.dto.js';
import { OptionalUrl, StringList, Trim } from '../../common/dto/validators.js';

export class CreateEducationDto {
  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  institution: string;

  @ApiPropertyOptional({ type: ImageRefDto, nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @ValidateNested()
  @Type(() => ImageRefDto)
  @IsOptional()
  logo?: ImageRefDto | null;

  @ApiPropertyOptional()
  @OptionalUrl()
  website?: string;

  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  degree: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(160)
  @IsOptional()
  fieldOfStudy?: string;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @IsDateString()
  @IsOptional()
  startDate?: string | null;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @IsDateString()
  @IsOptional()
  endDate?: string | null;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(60)
  @IsOptional()
  grade?: string;

  @ApiPropertyOptional({ type: [String] })
  @StringList(40, 120)
  coursework?: string[];

  @ApiPropertyOptional({ type: [String] })
  @StringList(30, 500)
  achievements?: string[];

  @ApiPropertyOptional({ type: [String] })
  @StringList(30, 500)
  activities?: string[];

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdateEducationDto extends PartialType(CreateEducationDto) {}
