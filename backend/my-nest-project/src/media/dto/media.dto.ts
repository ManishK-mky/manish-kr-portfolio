import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { MEDIA_FOLDERS, type MediaFolder } from '../schemas/media-asset.schema.js';

export class SignatureRequestDto {
  @ApiProperty({ enum: MEDIA_FOLDERS })
  @IsIn(MEDIA_FOLDERS)
  folder: MediaFolder;

  @ApiPropertyOptional({ enum: ['image', 'document'], default: 'image' })
  @IsEnum(['image', 'document'])
  @IsOptional()
  kind: 'image' | 'document' = 'image';
}

export class RegisterMediaDto {
  @ApiProperty({ description: 'public_id returned by Cloudinary after upload' })
  @IsString()
  @MaxLength(255)
  @Matches(/^portfolio\/[\w\-/.]+$/, {
    message: 'publicId must be inside the portfolio/ folder',
  })
  publicId: string;

  @ApiProperty({ enum: ['image', 'raw'] })
  @IsEnum(['image', 'raw'])
  resourceType: 'image' | 'raw';

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(300)
  @IsOptional()
  alt?: string;
}

export class UpdateMediaDto {
  @ApiProperty()
  @IsString()
  @MaxLength(300)
  alt: string;
}

export class MediaQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MEDIA_FOLDERS })
  @IsIn(MEDIA_FOLDERS)
  @IsOptional()
  folder?: MediaFolder;

  @ApiPropertyOptional({ enum: ['image', 'raw'] })
  @IsEnum(['image', 'raw'])
  @IsOptional()
  resourceType?: 'image' | 'raw';
}
