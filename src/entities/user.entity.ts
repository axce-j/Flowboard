import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrganizationMembership } from './organization-membership.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  email: string;

  // bcrypt hash — never expose this field on any response DTO
  @Column({ name: 'password_hash', type: 'text' })
  passwordHash: string;

  @OneToMany(() => OrganizationMembership, (membership) => membership.user)
  memberships: OrganizationMembership[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
