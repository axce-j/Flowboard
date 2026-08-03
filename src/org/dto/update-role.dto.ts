import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import type { OrgRole } from '../../entities/organization-membership.entity';

export class UpdateRoleDto {
  @ApiProperty({ enum: ['owner', 'admin', 'member'], example: 'admin' })
  @IsEnum(['owner', 'admin', 'member'])
  role: OrgRole;
}