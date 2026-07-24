import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationMembership } from './entities/organization-membership.entity';
import { Team } from './entities/team.entity';
import { TeamMembership } from './entities/team-membership.entity';
import { Topic } from './entities/topic.entity';
import { ContentIdea } from './entities/content.entity';
import { ContentStatusHistory } from './entities/content-status-history.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';

// Used only by `npm run migration:generate|run|revert` (TypeORM CLI). The
// running app configures its own connection in app.module.ts — kept
// separate so the CLI never accidentally picks up NestJS DI concerns.
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [
    User,
    Organization,
    OrganizationMembership,
    Team,
    TeamMembership,
    Topic,
    ContentIdea,
    ContentStatusHistory,
    PasswordResetToken,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
