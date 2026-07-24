import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ContentIdea } from './content.entity';
import type { ContentStatus } from './content.entity';
import { User } from './user.entity';

// Append-only: rows are never updated or deleted. fromStatus is null for the
// synthetic seed row written on create (manual create or bulk import).
@Entity('content_status_histories')
@Index(['contentId', 'changedAt'])
export class ContentStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_id', type: 'uuid' })
  contentId: string;

  @ManyToOne(() => ContentIdea, (content) => content.statusHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'content_id' })
  content: ContentIdea;

  @Column({ name: 'from_status', type: 'enum', enum: ['idea', 'draft', 'ready', 'posted'], nullable: true })
  fromStatus: ContentStatus | null;

  @Column({ name: 'to_status', type: 'enum', enum: ['idea', 'draft', 'ready', 'posted'] })
  toStatus: ContentStatus;

  @Column({ name: 'changed_by', type: 'uuid' })
  changedBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changedByUser: User;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;
}
