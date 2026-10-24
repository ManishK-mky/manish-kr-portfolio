import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsBoolean,
  IsEmail,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ImageRefDto } from '../../common/dto/image-ref.dto.js';
import { Trim } from '../../common/dto/validators.js';
import {
  AVAILABILITY_STATUSES,
  type AvailabilityStatus,
} from '../schemas/profile.schema.js';

export class AvailabilityDto {
  @ApiPropertyOptional({ enum: AVAILABILITY_STATUSES })
  @IsIn(AVAILABILITY_STATUSES)
  @IsOptional()
  status?: AvailabilityStatus;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(80)
  @IsOptional()
  label?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  visible?: boolean;
}

export class StatDto {
  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  value: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  label: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  @IsOptional()
  role?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  @IsOptional()
  greeting?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @IsOptional()
  headline?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(600)
  @IsOptional()
  intro?: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(8000)
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ type: ImageRefDto, nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @ValidateNested()
  @Type(() => ImageRefDto)
  @IsOptional()
  avatar?: ImageRefDto | null;

  @ApiPropertyOptional({ type: ImageRefDto, nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @ValidateNested()
  @Type(() => ImageRefDto)
  @IsOptional()
  aboutImage?: ImageRefDto | null;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  @IsOptional()
  location?: string;

  @ApiPropertyOptional()
  @Trim()
  @ValidateIf((_o, v) => v !== '')
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ type: AvailabilityDto })
  @ValidateNested()
  @Type(() => AvailabilityDto)
  @IsOptional()
  availability?: AvailabilityDto;

  @ApiPropertyOptional({ description: 'Media id of the CV (PDF); null removes it', nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @IsMongoId()
  @IsOptional()
  cvMediaId?: string | null;

  @ApiPropertyOptional({ type: [StatDto] })
  @ValidateNested({ each: true })
  @Type(() => StatDto)
  @ArrayMaxSize(6)
  @IsOptional()
  stats?: StatDto[];
}
