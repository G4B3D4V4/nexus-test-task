import { ApiProperty } from '@nestjs/swagger';

export class DynamoDBItem {
  @ApiProperty({ type: String })
  Id: string;

  @ApiProperty({ type: String })
  createdAt: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number })
  size: number;
}
