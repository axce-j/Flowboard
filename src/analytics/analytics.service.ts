import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentIdea } from '../entities/content.entity';
import { PERMISSIONS_SERVICE } from '../permissions/permissions.service.interface';
import type { PermissionsService } from '../permissions/permissions.service.interface';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ContentIdea) private readonly repo: Repository<ContentIdea>,
    @Inject(PERMISSIONS_SERVICE) private readonly permissions: PermissionsService,
  ) {}

  // GET /api/analytics — counts by status/type/assignee/team, org-scoped
  // aggregation, excludes soft-deleted rows (PRD 6.1).
  async getBreakdown(actor: AuthenticatedUser) {
    throw new NotImplementedException('AnalyticsService.getBreakdown — Phase 4');
  }
}
