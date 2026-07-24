import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// Two token shapes are ever signed by AuthService:
//  - pre-org token:  { userId }                      (2+ active orgs, pre select-org)
//  - full org token: { userId, orgId, role }          (issued directly, or after select-org)
// JwtAuthGuard + this strategy accept both; OrgScopeGuard is what actually
// requires orgId to be present, keeping the two concerns separate.
export interface JwtPayload {
  userId: string;
  orgId?: string;
  role?: 'owner' | 'admin' | 'member';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // Becomes req.user. Deliberately thin — no DB round-trip here; per-route
    // guards (OrgScopeGuard, RolesGuard) do the heavier checks.
    return {
      userId: payload.userId,
      orgId: payload.orgId,
      role: payload.role,
    };
  }
}
