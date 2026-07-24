import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SelectOrgDto {
  @ApiProperty({ example: '2a4ac7bd-2fa3-4ae8-a70a-63bcf53d6ba9' })
  @IsUUID()
  organizationId: string;
}