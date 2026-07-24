import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ContentIdea } from '../entities/content.entity';
import { ContentStatusHistory } from '../entities/content-status-history.entity';
import { PERMISSIONS_SERVICE } from '../permissions/permissions.service.interface';
import type { PermissionsService } from '../permissions/permissions.service.interface';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import {
  BulkStatusUpdateDto,
  ContentImportDto,
  ContentImportRowResult,
  ContentQueryDto,
  CreateContentDto,
  UpdateContentDto,
} from '../dto/content.dto';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ContentIdea) private readonly repo: Repository<ContentIdea>,
    @InjectRepository(ContentStatusHistory)
    private readonly history: Repository<ContentStatusHistory>,
    private readonly dataSource: DataSource,
    @Inject(PERMISSIONS_SERVICE) private readonly permissions: PermissionsService,
  ) {}

  // Always injects orgId (via team join) from actor.orgId, applies
  // pagination/sort/search, excludes soft-deleted rows by default
  // (TECH_SPEC §6 content.service.ts).
  async findAll(actor: AuthenticatedUser, query: ContentQueryDto) {
    throw new NotImplementedException('ContentService.findAll — Phase 3');
  }

  async findOne(actor: AuthenticatedUser, id: string): Promise<ContentIdea> {
    throw new NotImplementedException('ContentService.findOne — Phase 3');
  }

  // GET /api/content/:id/history — ordered ContentStatusHistory rows with
  // actor names (PRD 5.5).
  async findHistory(actor: AuthenticatedUser, contentId: string) {
    throw new NotImplementedException('ContentService.findHistory — Phase 3');
  }

  // Sets createdBy from actor.userId, validates teamId belongs to caller's
  // org, validates topicId (if present) per TECH_SPEC §2.1, writes the seed
  // ContentStatusHistory row (fromStatus: null) in the same transaction.
  async create(actor: AuthenticatedUser, dto: CreateContentDto): Promise<ContentIdea> {
    throw new NotImplementedException('ContentService.create — Phase 3');
  }

  // Status changes write a ContentStatusHistory row inside the same
  // transaction as the update, not as an afterthought (PRD 5.3).
  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateContentDto,
  ): Promise<ContentIdea> {
    throw new NotImplementedException('ContentService.update — Phase 3');
  }

  // Soft delete only — sets deletedAt, never a hard DELETE (PRD 5.4).
  async remove(actor: AuthenticatedUser, id: string): Promise<{ message: string }> {
    throw new NotImplementedException('ContentService.remove — Phase 3');
  }

  // One ContentStatusHistory row per item, all in one transaction (PRD 5.8).
  async bulkUpdateStatus(actor: AuthenticatedUser, dto: BulkStatusUpdateDto) {
    throw new NotImplementedException('ContentService.bulkUpdateStatus — Phase 3');
  }

  // Per-row validation + insert, partial success, one seed history row per
  // created item — one transaction PER ROW, not one for the whole batch
  // (PRD 5.9, TECH_SPEC §5.1).
  async bulkImport(
    actor: AuthenticatedUser,
    dto: ContentImportDto,
  ): Promise<ContentImportRowResult[]> {
    throw new NotImplementedException('ContentService.bulkImport — Phase 3');
  }

  // GET /api/content/export — streams CSV, respects active filters (PRD 6.2).
  async exportCsv(actor: AuthenticatedUser, query: ContentQueryDto) {
    throw new NotImplementedException('ContentService.exportCsv — Phase 4');
  }
}
