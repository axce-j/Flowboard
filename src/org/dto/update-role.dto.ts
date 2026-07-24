import { IsEnum } from 'class-validator';
import type { OrgRole } from '../../entities/organization-membership.entity';

export class UpdateRoleDto {
  @IsEnum(['owner', 'admin', 'member'])
  role: OrgRole;
}
