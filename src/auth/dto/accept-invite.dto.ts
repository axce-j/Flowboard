import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

// Two branches share this one endpoint (see PRD §9 "Invite flow"):
//  - Existing user: caller is already authenticated (JwtAuthGuard, no org
//    scope required yet) and supplies `membershipId` for the pending
//    membership they're accepting.
//  - New user: caller is unauthenticated and supplies the `signupToken`
//    from their invite email plus a `password` to set — this both creates
//    their password and activates the membership in one call.
// Exactly one branch's fields should be present; the service validates
// which branch applies rather than the DTO itself. See the @ApiBody
// examples on AuthController.acceptInvite for the two valid request shapes.
export class AcceptInviteDto {
  @ApiPropertyOptional({ example: '626c28b9-f99e-441b-b027-cba0102c2e7b' })
  @IsOptional()
  @IsUUID()
  membershipId?: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4e5f6...' })
  @IsOptional()
  @IsString()
  signupToken?: string;

  @ApiPropertyOptional({ example: 'newpass123', minLength: 10 })
  @IsOptional()
  @IsString()
  @MinLength(10)
  password?: string;
}