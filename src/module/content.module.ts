import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentIdea } from '../entities/content.entity';
import { ContentStatusHistory } from '../entities/content-status-history.entity';
import { Team } from '../entities/team.entity';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';
import { ContentService } from '../service/content.service';
import { ContentController } from '../controller/content.controller';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentIdea, ContentStatusHistory, Team, Topic, User]),
    PermissionsModule,
    AuthModule,
  ],
  providers: [ContentService],
  controllers: [ContentController],
})
export class ContentModule {}
