import { ApiProperty } from '@nestjs/swagger';

export class DeleteResultDto {
  @ApiProperty()
  deletedId: number;

  @ApiProperty()
  success: boolean;
}
