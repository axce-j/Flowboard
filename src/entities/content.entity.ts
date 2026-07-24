import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Team } from './team.entity';
import { Topic } from './topic.entity';
import { User } from './user.entity';
import { ContentStatusHistory } from './content-status-history.entity';

export type ContentStatus = 'idea' | 'draft' | 'ready' | 'posted';
export type ContentType = 'reel' | 'carousel' | 'other';

@Entity('content_ideas')
@Index(['teamId', 'status'])
export class ContentIdea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // NOTE: v1's `contentNumber` (int) was dropped in v2 now that `id` (uuid)
  // exists — decision confirmed during migration planning.

  @Column({ name: 'team_id', type: 'uuid' })
  teamId: string;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ name: 'topic_id', type: 'uuid', nullable: true })
  topicId: string | null;

  @ManyToOne(() => Topic, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'topic_id' })
  topic: Topic | null;

  @Column({ name: 'handled_by', type: 'uuid' })
  handledBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'handled_by' })
  handledByUser: User;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    name: 'content_type',
    type: 'enum',
    enum: ['reel', 'carousel', 'other'],
  })
  contentType: ContentType;

  // OPEN DECISION (TECH_SPEC §8): week representation. Defaulted here to a
  // nullable `date` marking the week's start (real Postgres `date`, replacing
  // v1's free-text column) — revisit before Phase 3 content build if an
  // int week-number + year representation is preferred instead.
  @Column({ name: 'week_start_date', type: 'date', nullable: true })
  weekStartDate: string | null;

  @Column({ name: 'scheduled_date', type: 'date', nullable: true })
  scheduledDate: string | null;

  @Column({
    type: 'enum',
    enum: ['idea', 'draft', 'ready', 'posted'],
    default: 'idea',
  })
  status: ContentStatus;

  @OneToMany(() => ContentStatusHistory, (history) => history.content)
  statusHistory: ContentStatusHistory[];

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
