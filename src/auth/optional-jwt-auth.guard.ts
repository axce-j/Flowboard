import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as any;
  }

  // Overridden so a missing/invalid token doesn't throw — it just leaves
  // req.user undefined. AuthService.acceptInvite decides what's required
  // based on which branch of AcceptInviteDto was sent.
  handleRequest(err: any, user: any) {
    return user || undefined;
  }
}
