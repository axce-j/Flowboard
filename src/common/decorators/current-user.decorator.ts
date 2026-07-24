import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Shape written onto req.user by JwtAuthGuard/JwtStrategy after a full
// org-scoped token is validated (i.e. NOT the pre-org token used only for
// /auth/select-org).
export interface AuthenticatedUser {
  userId: string;
  orgId: string;
  role: 'owner' | 'admin' | 'member';
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
