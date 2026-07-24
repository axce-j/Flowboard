import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'f3a1...raw-token-from-email...' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'brandnewpass1', minLength: 10 })
  @IsString()
  @MinLength(10)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'password must contain at least one letter and one number',
  })
  newPassword: string;
}