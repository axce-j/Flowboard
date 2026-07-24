import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrgScopeGuard } from '../auth/org-scope.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ContentService } from '../service/content.service';
import {
  BulkStatusUpdateDto,
  ContentImportDto,
  ContentQueryDto,
  CreateContentDto,
  UpdateContentDto,
} from '../dto/content.dto';

@ApiTags('content')
@UseGuards(JwtAuthGuard, OrgScopeGuard, RolesGuard)
@Controller('api/content')
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ContentQueryDto) {
    return this.service.findAll(user, query);
  }

  // Static/segment-specific GET routes must be declared before ':id' so
  // Nest's router doesn't swallow them as an :id param.
  @Get('export')
  exportCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ContentQueryDto,
    @Res() res: Response,
  ) {
    return this.service.exportCsv(user, query);
  }

  @Get(':id/history')
  @Roles('owner', 'admin')
  findHistory(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.findHistory(user, id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.findOne(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateContentDto) {
    return this.service.create(user, dto);
  }

  @Post('import')
  import(@CurrentUser() user: AuthenticatedUser, @Body() dto: ContentImportDto) {
    return this.service.bulkImport(user, dto);
  }

  @Patch('bulk-status')
  @Roles('owner', 'admin')
  bulkUpdateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkStatusUpdateDto,
  ) {
    return this.service.bulkUpdateStatus(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.remove(user, id);
  }
}
