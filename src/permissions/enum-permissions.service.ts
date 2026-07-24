import { Injectable } from '@nestjs/common';
import {
  PermissionContext,
  PermissionsService,
} from './permissions.service.interface';
import { OrgRole } from '../entities/organization-membership.entity';

// Thin, enum-backed implementation — deliberately simple for v2. Swapping to
// a richer RBAC model later means writing a new class behind
// PermissionsService, not touching every controller's @Roles(...) call site.
@Injectable()
export class EnumPermissionsService implements PermissionsService {
  canManageOrgSettings(ctx: PermissionContext): boolean {
    return ctx.role === 'owner';
  }

  canChangeMemberRole(ctx: PermissionContext): boolean {
    return ctx.role === 'owner';
  }

  canRemoveMember(ctx: PermissionContext, targetRole: OrgRole): boolean {
    if (ctx.role === 'owner') return true;
    // Admins can remove admins/members, never an owner.
    if (ctx.role === 'admin') return targetRole !== 'owner';
    return false;
  }

  canCreateTeam(ctx: PermissionContext): boolean {
    return ctx.role === 'owner';
  }

  canCreateOrgWideTopic(ctx: PermissionContext): boolean {
    return ctx.role === 'owner';
  }

  canCreateTeamTopic(ctx: PermissionContext): boolean {
    // Owner-only for launch — see TECH_SPEC §8 open decision. Change this
    // one line (and nothing else) if admins get this permission later.
    return ctx.role === 'owner';
  }

  canDeleteContent(ctx: PermissionContext): boolean {
    return ctx.role === 'owner' || ctx.role === 'admin';
  }

  canEditAnyContent(ctx: PermissionContext): boolean {
    return ctx.role === 'owner' || ctx.role === 'admin';
  }

  canBulkUpdateStatus(ctx: PermissionContext): boolean {
    return ctx.role === 'owner' || ctx.role === 'admin';
  }

  canViewContentHistory(ctx: PermissionContext): boolean {
    return ctx.role === 'owner' || ctx.role === 'admin';
  }

  canViewAnalytics(ctx: PermissionContext): boolean {
    return ctx.role === 'owner' || ctx.role === 'admin';
  }
}
