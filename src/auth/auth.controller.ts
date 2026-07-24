import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { SelectOrgDto } from './dto/select-org.dto';
import { InviteDto } from './dto/invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// No OrgScopeGuard on this controller — auth endpoints run before an org is
// selected, or (invite) use a route-specific combination instead of the
// standard JwtAuthGuard + OrgScopeGuard pair used everywhere else.
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @ApiOperation({ summary: 'Create a new account + organization (caller becomes owner)' })
  @ApiResponse({ status: 201, description: 'Account created, returns an org-scoped access token' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @ApiOperation({ summary: 'Log in with email + password' })
  @ApiResponse({ status: 200, description: '1 active org -> accessToken; 2+ -> preOrgToken + org list' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  @ApiResponse({ status: 403, description: 'No active organization membership' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exchange a pre-org token + orgId for a full org-scoped token' })
  @ApiResponse({ status: 200, description: 'Returns a full org-scoped accessToken' })
  @ApiResponse({ status: 403, description: 'No active membership in that org' })
  @UseGuards(JwtAuthGuard)
  @Post('select-org')
  selectOrg(@CurrentUser() user: AuthenticatedUser, @Body() dto: SelectOrgDto) {
    return this.auth.selectOrg(user.userId, dto);
  }

  // Inviting requires an org-scoped session (need to know which org + role
  // is inviting) — org/role membership is re-verified against the token
  // inside AuthService rather than via a full OrgScopeGuard here, since
  // /auth is otherwise guard-light by convention.
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a teammate by email (owner only)' })
  @ApiResponse({ status: 201, description: 'Invite sent — existing-user or new-user branch' })
  @ApiResponse({ status: 403, description: 'Caller is not an owner, or has no org selected' })
  @ApiResponse({ status: 409, description: 'That email already has a membership in this org' })
  @UseGuards(JwtAuthGuard)
  @Post('invite')
  invite(@CurrentUser() user: AuthenticatedUser, @Body() dto: InviteDto) {
    return this.auth.invite(user, dto);
  }

  // Two branches share this endpoint: existing users are authenticated
  // (some valid JWT, any org), new users are not (they're proving identity
  // via the signup token instead). OptionalJwtAuthGuard never rejects —
  // AuthService.acceptInvite decides what's required per branch.
  @ApiOperation({
    summary: 'Accept an invite',
    description:
      'Existing user: send Bearer token + membershipId. New user: send signupToken + password (no auth header).',
  })
  @ApiBody({
    schema: { $ref: getSchemaPath(AcceptInviteDto) },
    examples: {
      existingUser: {
        summary: 'Existing user (send Authorization: Bearer <token>)',
        value: { membershipId: '626c28b9-f99e-441b-b027-cba0102c2e7b' },
      },
      newUser: {
        summary: 'New user (no auth header needed)',
        value: { signupToken: 'a1b2c3d4e5f6...', password: 'newpass123' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Returns a full org-scoped accessToken' })
  @ApiResponse({ status: 400, description: 'Invalid/expired token, org cap reached, or bad payload shape' })
  @UseGuards(OptionalJwtAuthGuard)
  @Post('invite/accept')
  acceptInvite(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body() dto: AcceptInviteDto,
  ) {
    return this.auth.acceptInvite(user, dto);
  }
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({ status: 200, description: 'Always the same response, whether or not the email exists' })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Reset password using a token from the forgot-password email' })
  @ApiResponse({ status: 200, description: 'Password updated' })
  @ApiResponse({ status: 400, description: 'Token invalid, expired, or already used' })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }
}