import { OrgRole } from '../entities/organization-membership.entity';

export interface PermissionContext {
  role: OrgRole;
  userId: string;
}

// Every permission decision in the app routes through this interface (never
// scattered `if (role === 'owner')` checks in controllers/services). A
// future richer model (per-resource ACLs, custom roles) becomes a new
// implementation behind this same interface — see TECH_SPEC §8.
export interface PermissionsService {
  canManageOrgSettings(ctx: PermissionContext): boolean;
  canChangeMemberRole(ctx: PermissionContext): boolean;
  canRemoveMember(ctx: PermissionContext, targetRole: OrgRole): boolean;
  canCreateTeam(ctx: PermissionContext): boolean;
  canCreateOrgWideTopic(ctx: PermissionContext): boolean;
  canCreateTeamTopic(ctx: PermissionContext): boolean;
  canDeleteContent(ctx: PermissionContext): boolean;
  canEditAnyContent(ctx: PermissionContext): boolean;
  canBulkUpdateStatus(ctx: PermissionContext): boolean;
  canViewContentHistory(ctx: PermissionContext): boolean;
  canViewAnalytics(ctx: PermissionContext): boolean;
}

export const PERMISSIONS_SERVICE = Symbol('PERMISSIONS_SERVICE');
