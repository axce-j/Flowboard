import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Delegates entirely to JwtStrategy.validate(). Kept as its own class
// (rather than using AuthGuard('jwt') inline) so @Public()-style overrides
// or logging can be added later without touching every controller.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
