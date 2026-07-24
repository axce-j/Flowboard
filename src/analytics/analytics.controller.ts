import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrgScopeGuard } from '../auth/org-scope.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@UseGuards(JwtAuthGuard, OrgScopeGuard, RolesGuard)
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Roles('owner', 'admin')
  @Get()
  getBreakdown(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getBreakdown(user);
  }
}
