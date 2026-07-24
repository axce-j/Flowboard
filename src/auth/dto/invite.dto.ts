import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class InviteDto {
  @ApiProperty({ example: 'newteammate@acme.com' })
  @IsEmail()
  email: string;
}