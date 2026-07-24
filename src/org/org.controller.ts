import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrgScopeGuard } from '../auth/org-scope.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { OrgService } from './org.service';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('org')
@UseGuards(JwtAuthGuard, OrgScopeGuard, RolesGuard)
@Controller('api/org')
export class OrgController {
  constructor(private readonly service: OrgService) {}

  @Roles('owner', 'admin')
  @Get('members')
  listMembers(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMembers(user.orgId);
  }

  @Roles('owner')
  @Patch('members/:id/role')
  changeRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.service.changeRole(user, id, dto);
  }

  @Roles('owner', 'admin')
  @Delete('members/:id')
  removeMember(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.removeMember(user, id);
  }
}
