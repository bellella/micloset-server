import { ApiProperty } from '@nestjs/swagger';

export class CursorResponseDto<T> {
  /**
   * List of items for the current page.
   */
  @ApiProperty({ isArray: true })
  items: T[];

  /**
   * Cursor ID for the next page request.
   * Returns null if there is no next page.
   * @example 15
   */
  @ApiProperty({ type: Number, nullable: true })
  nextCursor: number | null;

  constructor(items: T[], nextCursor: number | null) {
    this.items = items;
    this.nextCursor = nextCursor;
  }
}
