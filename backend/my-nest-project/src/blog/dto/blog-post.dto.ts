import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsBoolean,
  IsDateString,
  IsIn,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ImageRefDto } from '../../common/dto/image-ref.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { OptionalUrl, Trim } from '../../common/dto/validators.js';
import { SLUG_PATTERN } from '../../common/utils/slug.js';
import type { TiptapNode } from '../rendering/tiptap-renderer.js';
import { POST_STATUSES, type PostStatus } from '../schemas/blog-post.schema.js';

export class PostSeoDto {
  @ApiPropertyOptional({ maxLength: 70 })
  @Trim()
  @IsString()
  @MaxLength(70)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ maxLength: 170 })
  @Trim()
  @IsString()
  @MaxLength(170)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @OptionalUrl()
  canonicalUrl?: string;
}

export class CreatePostDto {
  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title: string;

  @ApiPropertyOptional({ description: 'Generated from the title when omitted' })
  @Trim()
  @Matches(SLUG_PATTERN, { message: 'slug may only contain lowercase letters, digits and dashes' })
  @MaxLength(100)
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(400)
  @IsOptional()
  excerpt?: string;

  @ApiPropertyOptional({ type: ImageRefDto, nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @ValidateNested()
  @Type(() => ImageRefDto)
  @IsOptional()
  coverImage?: ImageRefDto | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Tiptap JSON document',
  })
  @IsObject()
  @IsOptional()
  content?: TiptapNode;

  @ApiPropertyOptional({ nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @IsMongoId()
  @IsOptional()
  category?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsMongoId({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(12)
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ enum: POST_STATUSES })
  @IsIn(POST_STATUSES)
  @IsOptional()
  status?: PostStatus;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @IsDateString()
  @IsOptional()
  publishedAt?: string | null;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Defaults to the profile name' })
  @Trim()
  @IsString()
  @MaxLength(120)
  @IsOptional()
  authorName?: string;

  @ApiPropertyOptional({ type: PostSeoDto })
  @ValidateNested()
  @Type(() => PostSeoDto)
  @IsOptional()
  seo?: PostSeoDto;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}

export class PostStatusDto {
  @ApiProperty({ enum: POST_STATUSES })
  @IsIn(POST_STATUSES)
  status: PostStatus;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Required for "scheduled"; optional backdate for "published"',
  })
  @IsDateString()
  @IsOptional()
  publishedAt?: string;
}

export class PreviewPostDto {
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Unsaved Tiptap JSON to preview; the stored draft is used when omitted',
  })
  @IsObject()
  @IsOptional()
  content?: TiptapNode;
}

export class PostQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Category slug' })
  @Trim()
  @Matches(SLUG_PATTERN)
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Tag slug' })
  @Trim()
  @Matches(SLUG_PATTERN)
  @IsOptional()
  tag?: string;

  @ApiPropertyOptional()
  @IsIn(['true', 'false'])
  @IsOptional()
  featured?: 'true' | 'false';
}

export class AdminPostQueryDto extends PostQueryDto {
  @ApiPropertyOptional({ enum: [...POST_STATUSES, 'all'], default: 'all' })
  @IsIn([...POST_STATUSES, 'all'])
  @IsOptional()
  status: PostStatus | 'all' = 'all';
}

export class CreateTaxonomyDto {
  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(300)
  @IsOptional()
  description?: string;
}

export class UpdateTaxonomyDto extends PartialType(CreateTaxonomyDto) {}
