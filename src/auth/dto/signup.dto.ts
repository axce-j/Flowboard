import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'owner@acme.com' })
  @IsEmail()
  email: string;

  // Min length 10 + at least one letter and one digit. Deliberately not a
  // full zxcvbn-style strength check — resolved as "good enough for v2"
  // per auth-module-spec §6.1.
  @ApiProperty({ example: 'password123', minLength: 10 })
  @IsString()
  @MinLength(10)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'password must contain at least one letter and one number',
  })
  password: string;

  @ApiProperty({ example: 'Acme Inc' })
  @IsNotEmpty()
  @IsString()
  organizationName: string;
}