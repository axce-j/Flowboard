import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export type OrgRole = 'owner' | 'admin' | 'member';
export type MembershipStatus = 'pending' | 'active';

// Enum exists in full now even though v2 only gates behavior on 'owner' in most
// places — see PRD §9 "Roles at launch" and TECH_SPEC §8 PermissionsService note.
@Entity('organization_memberships')
@Unique(['userId', 'organizationId'])
export class OrganizationMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'enum', enum: ['owner', 'admin', 'member'], default: 'member' })
  role: OrgRole;

  @Column({ type: 'enum', enum: ['pending', 'active'], default: 'pending' })
  status: MembershipStatus;

  @CreateDateColumn({ name: 'invited_at' })
  invitedAt: Date;

  @Column({ name: 'joined_at', type: 'timestamptz', nullable: true })
  joinedAt: Date | null;

  // New-user invite branch only (PRD 1.5): a hashed, single-use, expiring
  // token that both sets the invitee's password and activates this
  // membership in one call. Null for existing-user invites and for any
  // already-active membership.
  @Column({ name: 'invite_token_hash', type: 'text', nullable: true })
  inviteTokenHash: string | null;

  @Column({ name: 'invite_token_expires_at', type: 'timestamptz', nullable: true })
  inviteTokenExpiresAt: Date | null;
}
