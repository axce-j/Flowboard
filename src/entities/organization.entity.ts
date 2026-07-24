import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrganizationMembership } from './organization-membership.entity';
import { Team } from './team.entity';
import { Topic } from './topic.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @OneToMany(() => OrganizationMembership, (membership) => membership.organization)
  memberships: OrganizationMembership[];

  @OneToMany(() => Team, (team) => team.organization)
  teams: Team[];

  @OneToMany(() => Topic, (topic) => topic.organization)
  topics: Topic[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
