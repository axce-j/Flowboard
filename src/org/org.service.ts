import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { OrganizationMembership } from '../entities/organization-membership.entity';
  import { PERMISSIONS_SERVICE } from '../permissions/permissions.service.interface';
  import type { PermissionsService } from '../permissions/permissions.service.interface';
  import { UpdateRoleDto } from './dto/update-role.dto';
  import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
  
  @Injectable()
  export class OrgService {
	constructor(
	  @InjectRepository(OrganizationMembership)
	  private readonly memberships: Repository<OrganizationMembership>,
	  @Inject(PERMISSIONS_SERVICE) private readonly permissions: PermissionsService,
	) {}
  
	// GET /api/org/members — PRD 2.1, lists active + pending, scoped to
	// req.user.orgId.
	async listMembers(orgId: string) {
	  const rows = await this.memberships.find({
		where: { organizationId: orgId },
		relations: ['user'],
		order: { invitedAt: 'ASC' },
	  });
  
	  return rows.map((m) => ({
		id: m.id,
		role: m.role,
		status: m.status,
		invitedAt: m.invitedAt,
		joinedAt: m.joinedAt,
		user: { id: m.user.id, email: m.user.email },
	  }));
	}
  
	// PATCH /api/org/members/:id/role — owner-only (RolesGuard); never
	// demote the last remaining owner (PRD 2.2).
	async changeRole(actor: AuthenticatedUser, membershipId: string, dto: UpdateRoleDto) {
	  if (!this.permissions.canChangeMemberRole({ role: actor.role, userId: actor.userId })) {
		throw new ForbiddenException('Only an owner can change member roles.');
	  }
  
	  const membership = await this.findInOrgOrThrow(actor.orgId, membershipId);
  
	  if (membership.role === 'owner' && dto.role !== 'owner') {
		const activeOwnerCount = await this.memberships.count({
		  where: { organizationId: actor.orgId, role: 'owner', status: 'active' },
		});
		if (activeOwnerCount <= 1) {
		  throw new BadRequestException(
			'Cannot demote the last remaining owner. Promote someone else first.',
		  );
		}
	  }
  
	  membership.role = dto.role;
	  await this.memberships.save(membership);
  
	  return { id: membership.id, role: membership.role };
	}
  
	// DELETE /api/org/members/:id — admin cannot remove an owner; deletes
	// only the OrganizationMembership, never the User (PRD 2.3). Also
	// protects the last remaining owner from being removed entirely, for the
	// same reason changeRole does — an org must always have >=1 owner.
	async removeMember(actor: AuthenticatedUser, membershipId: string) {
	  const membership = await this.findInOrgOrThrow(actor.orgId, membershipId);
  
	  if (
		!this.permissions.canRemoveMember(
		  { role: actor.role, userId: actor.userId },
		  membership.role,
		)
	  ) {
		throw new ForbiddenException('You are not allowed to remove this member.');
	  }
  
	  if (membership.role === 'owner') {
		const activeOwnerCount = await this.memberships.count({
		  where: { organizationId: actor.orgId, role: 'owner', status: 'active' },
		});
		if (activeOwnerCount <= 1) {
		  throw new BadRequestException(
			'Cannot remove the last remaining owner. Promote someone else first.',
		  );
		}
	  }
  
	  await this.memberships.remove(membership);
	  return { message: 'Member removed.' };
	}
  
	private async findInOrgOrThrow(orgId: string, membershipId: string) {
	  const membership = await this.memberships.findOne({
		where: { id: membershipId, organizationId: orgId },
	  });
	  if (!membership) {
		throw new NotFoundException('Membership not found in this organization.');
	  }
	  return membership;
	}
  }