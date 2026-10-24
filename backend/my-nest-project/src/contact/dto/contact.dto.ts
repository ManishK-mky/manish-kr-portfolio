import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { Trim } from '../../common/dto/validators.js';

export class CreateContactDto {
  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty()
  @Trim()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @MaxLength(160)
  @IsOptional()
  subject?: string;

  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message: string;

  @ApiPropertyOptional({ description: 'Honeypot — must be left empty' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'Epoch ms when the form was rendered' })
  @IsInt()
  @IsOptional()
  startedAt?: number;
}

export class ContactQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['all', 'unread', 'read'], default: 'all' })
  @IsIn(['all', 'unread', 'read'])
  @IsOptional()
  status: 'all' | 'unread' | 'read' = 'all';
}

export class UpdateContactDto {
  @ApiProperty()
  @IsBoolean()
  read: boolean;
}
