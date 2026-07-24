import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

// Runs after JwtAuthGuard. Requires the token to already carry an orgId
// (i.e. rejects pre-org tokens) — the actual per-query org filtering happens
// in each module's service/repository layer, using req.user.orgId as the
// single source of truth for "which org am I scoped to". This guard's job
// is just to make sure that value exists and is well-formed before any
// service code runs, so org-scoping can never be silently skipped.
@Injectable()
export class OrgScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user?.orgId) {
      throw new ForbiddenException(
        'This request requires an org-scoped session. Call /auth/select-org first.',
      );
    }
    return true;
  }
}
