import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
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
import { Trim } from '../../common/dto/validators.js';
import { PROFICIENCY_LEVELS, type Proficiency } from '../schemas/skill.schema.js';

export class CreateSkillDto {
  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @ApiProperty({ description: 'Skill category id' })
  @IsMongoId()
  category: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(60)
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ enum: PROFICIENCY_LEVELS, nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @IsIn(PROFICIENCY_LEVELS)
  @IsOptional()
  proficiency?: Proficiency | null;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}

export class CreateSkillCategoryDto {
  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(300)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdateSkillCategoryDto extends PartialType(CreateSkillCategoryDto) {}
