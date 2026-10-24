import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Clients only reference images by media-library id. The server resolves the
 * URL and dimensions from the stored asset, so arbitrary URLs can't be injected.
 */
export class ImageRefDto {
  @ApiProperty({ description: 'MediaAsset id from the media library' })
  @IsMongoId()
  mediaId: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  @IsOptional()
  alt?: string;
}

export class GalleryImageDto extends ImageRefDto {
  @ApiPropertyOptional({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  @IsOptional()
  caption?: string;
}
