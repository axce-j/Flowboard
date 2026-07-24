import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
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

  // GET /api/org/members — PRD 2.1, scoped to req.user.orgId.
  async listMembers(orgId: string) {
    throw new NotImplementedException('OrgService.listMembers — Phase 1');
  }

  // PATCH /api/org/members/:id/role — owner-only; must never demote the
  // last remaining owner (PRD 2.2).
  async changeRole(actor: AuthenticatedUser, membershipId: string, dto: UpdateRoleDto) {
    throw new NotImplementedException('OrgService.changeRole — Phase 1');
  }

  // DELETE /api/org/members/:id — admin cannot remove an owner; removing a
  // member deletes the OrganizationMembership only, never the User (PRD 2.3).
  async removeMember(actor: AuthenticatedUser, membershipId: string) {
    throw new NotImplementedException('OrgService.removeMember — Phase 1');
  }
}
