import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Team } from './team.entity';

// Uniqueness is enforced via two partial unique indexes (not one composite
// UNIQUE) because Postgres treats NULL as distinct from itself. See
// TECH_SPEC §2.1 for the exact DDL — these @Index decorators generate it.
@Entity('topics')
@Index('topic_orgwide_unique', ['organizationId', 'name'], {
  unique: true,
  where: '"team_id" IS NULL',
})
@Index('topic_teamscoped_unique', ['organizationId', 'teamId', 'name'], {
  unique: true,
  where: '"team_id" IS NOT NULL',
})
export class Topic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.topics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // null = org-wide topic, usable by every team in the org.
  // set  = team sub-topic, usable only on that team's content.
  @Column({ name: 'team_id', type: 'uuid', nullable: true })
  teamId: string | null;

  @ManyToOne(() => Team, (team) => team.subTopics, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'team_id' })
  team: Team | null;

  @Column({ type: 'text' })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
