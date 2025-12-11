import { User } from './user';
import { ApiProperty } from '@nestjs/swagger';

export class Cart {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  shopifyCartId: string;

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ type: () => User })
  user: User;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
