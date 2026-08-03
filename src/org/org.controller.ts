import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrgScopeGuard } from '../auth/org-scope.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { OrgService } from './org.service';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('org')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrgScopeGuard, RolesGuard)
@Controller('api/org')
export class OrgController {
  constructor(private readonly service: OrgService) {}

  @ApiOperation({ summary: 'List members of the current organization (active + pending)' })
  @ApiResponse({ status: 200, description: 'Array of memberships with user email, role, status' })
  @Roles('owner', 'admin')
  @Get('members')
  listMembers(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMembers(user.orgId);
  }

  @ApiOperation({ summary: "Change a member's role (owner only)" })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 400, description: 'Would demote the last remaining owner' })
  @ApiResponse({ status: 404, description: 'Membership not found in this org' })
  @Roles('owner')
  @Patch('members/:id/role')
  changeRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.service.changeRole(user, id, dto);
  }

  @ApiOperation({ summary: 'Remove a member from the organization' })
  @ApiResponse({ status: 200, description: 'Member removed (membership only, User is untouched)' })
  @ApiResponse({ status: 400, description: 'Would remove the last remaining owner' })
  @ApiResponse({ status: 403, description: 'Admins cannot remove an owner' })
  @ApiResponse({ status: 404, description: 'Membership not found in this org' })
  @Roles('owner', 'admin')
  @Delete('members/:id')
  removeMember(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.removeMember(user, id);
  }
}