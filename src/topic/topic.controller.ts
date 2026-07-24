import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrgScopeGuard } from '../auth/org-scope.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { TopicService } from './topic.service';
import { CreateTopicDto } from './dto/create-topic.dto';

@ApiTags('topics')
@UseGuards(JwtAuthGuard, OrgScopeGuard, RolesGuard)
@Controller('api/topics')
export class TopicController {
  constructor(private readonly service: TopicService) {}

  @Roles('owner')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTopicDto) {
    return this.service.create(user, dto);
  }

  @Get()
  findAvailable(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findAvailable(user);
  }
}
