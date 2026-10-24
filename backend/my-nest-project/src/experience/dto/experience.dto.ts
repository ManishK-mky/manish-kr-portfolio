import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { StringList, Trim } from '../../common/dto/validators.js';
import {
  EMPLOYMENT_TYPES,
  WORK_MODES,
  type EmploymentType,
  type WorkMode,
} from '../schemas/experience.schema.js';

export class CreateExperienceDto {
  @ApiProperty({ description: 'Company id' })
  @IsMongoId()
  company: string;

  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({ enum: EMPLOYMENT_TYPES })
  @IsIn(EMPLOYMENT_TYPES)
  @IsOptional()
  employmentType?: EmploymentType;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ enum: WORK_MODES })
  @IsIn(WORK_MODES)
  @IsOptional()
  workMode?: WorkMode;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @IsDateString()
  @IsOptional()
  endDate?: string | null;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  current?: boolean;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({ type: [String] })
  @StringList(30, 500)
  responsibilities?: string[];

  @ApiPropertyOptional({ type: [String] })
  @StringList(30, 500)
  achievements?: string[];

  @ApiPropertyOptional({ type: [String] })
  @StringList(40, 60)
  technologies?: string[];

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdateExperienceDto extends PartialType(CreateExperienceDto) {}
