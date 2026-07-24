import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { TeamMembership } from '../entities/team-membership.entity';
import { PERMISSIONS_SERVICE } from '../permissions/permissions.service.interface';
import type { PermissionsService } from '../permissions/permissions.service.interface';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team) private readonly teams: Repository<Team>,
    @InjectRepository(TeamMembership)
    private readonly teamMemberships: Repository<TeamMembership>,
    @Inject(PERMISSIONS_SERVICE) private readonly permissions: PermissionsService,
  ) {}

  // POST /api/teams — owner-only, implicitly scoped to req.user.orgId (PRD 3.1).
  async create(actor: AuthenticatedUser, dto: CreateTeamDto) {
    throw new NotImplementedException('TeamService.create — Phase 2');
  }

  // GET /api/teams — teams the user has a TeamMembership in, scoped to org (PRD 3.3).
  async findMine(actor: AuthenticatedUser) {
    throw new NotImplementedException('TeamService.findMine — Phase 2');
  }

  // POST /api/teams/:id/members — can only add users with an active
  // membership in the same org; TeamMembership join enforces no duplicates (PRD 3.2).
  async addMember(actor: AuthenticatedUser, teamId: string, dto: AddTeamMemberDto) {
    throw new NotImplementedException('TeamService.addMember — Phase 2');
  }
}
