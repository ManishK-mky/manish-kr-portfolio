import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsMongoId } from 'class-validator';

export class ReorderDto {
  @ApiProperty({
    type: [String],
    description: 'Ids in their new display order; index becomes the order value',
  })
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsMongoId({ each: true })
  ids: string[];
}
