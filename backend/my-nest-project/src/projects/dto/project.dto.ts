import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { GalleryImageDto, ImageRefDto } from '../../common/dto/image-ref.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { OptionalUrl, StringList, Trim } from '../../common/dto/validators.js';
import { SLUG_PATTERN } from '../../common/utils/slug.js';

export class ChallengeSolutionDto {
  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  challenge: string;

  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  solution: string;
}

export class CreateProjectDto {
  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(140)
  title: string;

  @ApiPropertyOptional({ description: 'Generated from the title when omitted' })
  @Trim()
  @Matches(SLUG_PATTERN, { message: 'slug may only contain lowercase letters, digits and dashes' })
  @MaxLength(100)
  @IsOptional()
  slug?: string;

  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  summary: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(20000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: ImageRefDto, nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @ValidateNested()
  @Type(() => ImageRefDto)
  @IsOptional()
  cover?: ImageRefDto | null;

  @ApiPropertyOptional({ type: [GalleryImageDto] })
  @ValidateNested({ each: true })
  @Type(() => GalleryImageDto)
  @ArrayMaxSize(30)
  @IsOptional()
  gallery?: GalleryImageDto[];

  @ApiPropertyOptional({ type: [String] })
  @StringList(40, 60)
  technologies?: string[];

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(60)
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @OptionalUrl()
  githubUrl?: string;

  @ApiPropertyOptional()
  @OptionalUrl()
  liveUrl?: string;

  @ApiPropertyOptional({ format: 'date' })
  @ValidateIf((_o, v) => v !== null)
  @IsDateString()
  @IsOptional()
  startDate?: string | null;

  @ApiPropertyOptional({ format: 'date' })
  @ValidateIf((_o, v) => v !== null)
  @IsDateString()
  @IsOptional()
  endDate?: string | null;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ type: [String] })
  @StringList(30, 500)
  responsibilities?: string[];

  @ApiPropertyOptional({ type: [ChallengeSolutionDto] })
  @ValidateNested({ each: true })
  @Type(() => ChallengeSolutionDto)
  @ArrayMaxSize(20)
  @IsOptional()
  challenges?: ChallengeSolutionDto[];

  @ApiPropertyOptional({ type: [String] })
  @StringList(30, 500)
  features?: string[];

  @ApiPropertyOptional({ type: [String] })
  @StringList(30, 500)
  achievements?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class ProjectStatusDto {
  @ApiProperty()
  @IsBoolean()
  published: boolean;
}

const toBool = ({ value }: { value: unknown }) =>
  value === 'true' ? true : value === 'false' ? false : value;

export class ProjectQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(60)
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by technology (exact match)' })
  @Trim()
  @IsString()
  @MaxLength(60)
  @IsOptional()
  technology?: string;

  @ApiPropertyOptional()
  @Transform(toBool)
  @IsBoolean()
  @IsOptional()
  featured?: boolean;
}

export class AdminProjectQueryDto extends ProjectQueryDto {
  @ApiPropertyOptional({ enum: ['all', 'published', 'draft'], default: 'all' })
  @IsEnum(['all', 'published', 'draft'])
  @IsOptional()
  status: 'all' | 'published' | 'draft' = 'all';
}
