import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { OrganizationMembership } from '../entities/organization-membership.entity';
import { Organization } from '../entities/organization.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { EMAIL_SERVICE } from '../email/email.service.interface';
import type { EmailService } from '../email/email.service.interface';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { SelectOrgDto } from './dto/select-org.dto';
import { InviteDto } from './dto/invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export const MAX_ORGS_PER_USER = 4;

const BCRYPT_ROUNDS = 12;
const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password.';

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function generateRawToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(OrganizationMembership)
    private readonly memberships: Repository<OrganizationMembership>,
    @InjectRepository(Organization)
    private readonly organizations: Repository<Organization>,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokens: Repository<PasswordResetToken>,
    private readonly jwt: JwtService,
    private readonly dataSource: DataSource,
    @Inject(EMAIL_SERVICE) private readonly email: EmailService,
  ) {}

  private signFullToken(userId: string, orgId: string, role: string): string {
    return this.jwt.sign({ userId, orgId, role });
  }

  private signPreOrgToken(userId: string): string {
    return this.jwt.sign({ userId });
  }

  async signup(dto: SignupDto) {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const result = await this.dataSource.transaction(async (manager) => {
      const user = await manager.save(User, { email: dto.email, passwordHash });
      const organization = await manager.save(Organization, { name: dto.organizationName });
      const membership = await manager.save(OrganizationMembership, {
        userId: user.id,
        organizationId: organization.id,
        role: 'owner',
        status: 'active',
        joinedAt: new Date(),
      });
      return { user, organization, membership };
    });

    const accessToken = this.signFullToken(
      result.user.id,
      result.organization.id,
      result.membership.role,
    );

    return {
      accessToken,
      user: { id: result.user.id, email: result.user.email },
      organization: { id: result.organization.id, name: result.organization.name },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const activeMemberships = await this.memberships.find({
      where: { userId: user.id, status: 'active' },
      relations: ['organization'],
    });

    if (activeMemberships.length === 0) {
      throw new ForbiddenException(
        'Your account has no active organization membership yet. Wait for an invite to be accepted or contact an administrator.',
      );
    }

    if (activeMemberships.length === 1) {
      const membership = activeMemberships[0];
      const accessToken = this.signFullToken(user.id, membership.organizationId, membership.role);
      return { accessToken };
    }

    const preOrgToken = this.signPreOrgToken(user.id);
    return {
      preOrgToken,
      organizations: activeMemberships.map((m) => ({
        id: m.organizationId,
        name: m.organization.name,
        role: m.role,
      })),
    };
  }

  async selectOrg(userId: string, dto: SelectOrgDto) {
    const membership = await this.memberships.findOne({
      where: { userId, organizationId: dto.organizationId, status: 'active' },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have an active membership in that organization.');
    }

    const accessToken = this.signFullToken(userId, membership.organizationId, membership.role);
    return { accessToken };
  }

  async invite(actor: AuthenticatedUser, dto: InviteDto) {
    if (!actor.orgId) {
      throw new ForbiddenException('Select an organization before inviting members.');
    }
    if (actor.role !== 'owner') {
      throw new ForbiddenException('Only an owner can invite members.');
    }

    const organization = await this.organizations.findOneOrFail({ where: { id: actor.orgId } });
    const existingUser = await this.users.findOne({ where: { email: dto.email } });

    if (existingUser) {
      const alreadyMember = await this.memberships.findOne({
        where: { userId: existingUser.id, organizationId: actor.orgId },
      });
      if (alreadyMember) {
        throw new ConflictException(
          `This user already has a ${alreadyMember.status} membership in this organization.`,
        );
      }

      await this.memberships.save({
        userId: existingUser.id,
        organizationId: actor.orgId,
        role: 'member',
        status: 'pending',
      });

      await this.email.sendInvite(
        dto.email,
        organization.name,
        `Log in to Flowboard and accept your invite to "${organization.name}".`,
      );

      return { message: 'Invite sent.', branch: 'existing-user' };
    }

    const rawToken = generateRawToken();
    const placeholderPasswordHash = await bcrypt.hash(crypto.randomUUID(), BCRYPT_ROUNDS);

    await this.dataSource.transaction(async (manager) => {
      const newUser = await manager.save(User, {
        email: dto.email,
        passwordHash: placeholderPasswordHash,
      });

      await manager.save(OrganizationMembership, {
        userId: newUser.id,
        organizationId: actor.orgId,
        role: 'member',
        status: 'pending',
        inviteTokenHash: hashToken(rawToken),
        inviteTokenExpiresAt: new Date(Date.now() + INVITE_TOKEN_TTL_MS),
      });
    });

    await this.email.sendInvite(
      dto.email,
      organization.name,
      `Set your password and join "${organization.name}": token=${rawToken}`,
    );

    return { message: 'Invite sent.', branch: 'new-user' };
  }

  async acceptInvite(actor: AuthenticatedUser | undefined, dto: AcceptInviteDto) {
    if (dto.membershipId) {
      return this.acceptInviteExistingUser(actor, dto.membershipId);
    }
    if (dto.signupToken && dto.password) {
      return this.acceptInviteNewUser(dto.signupToken, dto.password);
    }
    throw new BadRequestException(
      'Provide either membershipId (existing user) or signupToken + password (new user).',
    );
  }

  private async acceptInviteExistingUser(
    actor: AuthenticatedUser | undefined,
    membershipId: string,
  ) {
    if (!actor) {
      throw new UnauthorizedException('Log in before accepting an invite.');
    }

    const membership = await this.memberships.findOne({ where: { id: membershipId } });
    if (!membership || membership.status !== 'pending') {
      throw new BadRequestException('Invite not found or already handled.');
    }
    if (membership.userId !== actor.userId) {
      throw new ForbiddenException('This invite is not addressed to you.');
    }

    await this.enforceOrgCapOrThrow(actor.userId);

    membership.status = 'active';
    membership.joinedAt = new Date();
    await this.memberships.save(membership);

    const accessToken = this.signFullToken(actor.userId, membership.organizationId, membership.role);
    return { accessToken };
  }

  private async acceptInviteNewUser(signupToken: string, password: string) {
    const membership = await this.memberships.findOne({
      where: { inviteTokenHash: hashToken(signupToken) },
    });

    if (
      !membership ||
      membership.status !== 'pending' ||
      !membership.inviteTokenExpiresAt ||
      membership.inviteTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invite token is invalid or has expired.');
    }

    await this.enforceOrgCapOrThrow(membership.userId);

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await this.dataSource.transaction(async (manager) => {
      await manager.update(User, membership.userId, { passwordHash });
      await manager.update(OrganizationMembership, membership.id, {
        status: 'active',
        joinedAt: new Date(),
        inviteTokenHash: null,
        inviteTokenExpiresAt: null,
      });
    });

    const accessToken = this.signFullToken(
      membership.userId,
      membership.organizationId,
      membership.role,
    );
    return { accessToken };
  }

  private async enforceOrgCapOrThrow(userId: string) {
    const activeCount = await this.memberships.count({ where: { userId, status: 'active' } });
    if (activeCount >= MAX_ORGS_PER_USER) {
      throw new BadRequestException(
        `You've reached the limit of ${MAX_ORGS_PER_USER} active organizations. Leave one before accepting a new invite.`,
      );
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const genericResponse = {
      message: 'If an account with that email exists, a reset link has been sent.',
    };

    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user) {
      return genericResponse;
    }

    const rawToken = generateRawToken();
    await this.resetTokens.save({
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    await this.email.sendPasswordReset(user.email, `token=${rawToken}`);

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashToken(dto.token);
    const resetToken = await this.resetTokens.findOne({ where: { tokenHash } });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Reset token is invalid, used, or has expired.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.dataSource.transaction(async (manager) => {
      await manager.update(User, resetToken.userId, { passwordHash });
      await manager.update(PasswordResetToken, resetToken.id, { usedAt: new Date() });
    });

    return { message: 'Password has been reset. You can now log in.' };
  }
}
