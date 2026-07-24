import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { OrgRole } from '../entities/organization-membership.entity';

// Runs after JwtAuthGuard + OrgScopeGuard. Checks the coarse @Roles(...)
// allow-list on the route. Finer-grained or resource-specific decisions
// (e.g. "can this admin remove this particular member") still go through
// PermissionsService inside the relevant service method — this guard only
// handles the simple "is your role in this list at all" gate.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<OrgRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const userRole: OrgRole | undefined = req.user?.role;

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Requires one of role(s): ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  }
}
