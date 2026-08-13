import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ enum: ['ok'], example: 'ok' })
  status: 'ok';

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-08-14T08:00:00.000Z',
  })
  timestamp: string;
}
