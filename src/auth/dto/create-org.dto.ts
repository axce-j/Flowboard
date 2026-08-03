import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOrgDto {
  @ApiProperty({ example: 'Axce LTD' })
  @IsNotEmpty()
  @IsString()
  organizationName: string;
}