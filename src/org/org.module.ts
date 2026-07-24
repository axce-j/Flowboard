import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationMembership } from '../entities/organization-membership.entity';
import { OrgService } from './org.service';
import { OrgController } from './org.controller';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganizationMembership]),
    PermissionsModule,
    AuthModule,
  ],
  providers: [OrgService],
  controllers: [OrgController],
})
export class OrgModule {}
