import { SetMetadata } from '@nestjs/common';
import { OrgRole } from '../entities/organization-membership.entity';

export const ROLES_KEY = 'roles';

// @Roles('owner') / @Roles('owner', 'admin') — RolesGuard reads this
// metadata but the actual allow/deny decision for anything nuanced still
// goes through PermissionsService, not a raw role-array match, per
// TECH_SPEC §3.
export const Roles = (...roles: OrgRole[]) => SetMetadata(ROLES_KEY, roles);
