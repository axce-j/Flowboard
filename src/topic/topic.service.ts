import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { PERMISSIONS_SERVICE } from '../permissions/permissions.service.interface';
import type { PermissionsService } from '../permissions/permissions.service.interface';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateTopicDto } from './dto/create-topic.dto';

@Injectable()
export class TopicService {
  constructor(
    @InjectRepository(Topic) private readonly topics: Repository<Topic>,
    @Inject(PERMISSIONS_SERVICE) private readonly permissions: PermissionsService,
  ) {}

  // POST /api/topics — teamId omitted/null -> org-wide (owner-only,
  // PRD 4.1); teamId set -> team sub-topic (owner-only for launch, PRD 4.2).
  // Uniqueness is enforced by the two partial unique indexes on Topic
  // (TECH_SPEC §2.1) as the backstop — catch the resulting DB error and
  // translate it to a 409 here rather than pre-checking with a SELECT.
  async create(actor: AuthenticatedUser, dto: CreateTopicDto) {
    throw new NotImplementedException('TopicService.create — Phase 2');
  }

  // GET /api/topics — org-wide topics + sub-topics for teams the caller
  // belongs to (PRD 4.3).
  async findAvailable(actor: AuthenticatedUser) {
    throw new NotImplementedException('TopicService.findAvailable — Phase 2');
  }
}
