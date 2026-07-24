import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';

import { envValidationSchema } from './config/env.validation';

import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationMembership } from './entities/organization-membership.entity';
import { Team } from './entities/team.entity';
import { TeamMembership } from './entities/team-membership.entity';
import { Topic } from './entities/topic.entity';
import { ContentIdea } from './entities/content.entity';
import { ContentStatusHistory } from './entities/content-status-history.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';

import { AuthModule } from './auth/auth.module';
import { OrgModule } from './org/org.module';
import { TeamModule } from './team/team.module';
import { TopicModule } from './topic/topic.module';
import { ContentModule } from './module/content.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { EmailModule } from './email/email.module';
import { PermissionsModule } from './permissions/permissions.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
      exclude: ['/api/(.*)'],
    }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
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
        // synchronize is always false now that migrations exist — schema
        // changes go through src/migrations/, never implicit sync
        // (TECH_SPEC §6 app.module.ts, PRD 7.5).
        synchronize: false,
        migrationsRun: config.get('NODE_ENV') === 'production',
        migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
        logging: false,
        extra: {
          max: 5,
          idleTimeoutMillis: 10000,
          connectionTimeoutMillis: 10000,
        },
      }),
    }),

    PermissionsModule,
    EmailModule,
    AuthModule,
    OrgModule,
    TeamModule,
    TopicModule,
    ContentModule,
    AnalyticsModule,
    HealthModule,
  ],
})
export class AppModule {}
