import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTopicDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  // Omitted or null -> org-wide topic. Set -> team sub-topic, must resolve
  // to a team in the caller's org (TECH_SPEC §2.1).
  @IsOptional()
  @IsUUID()
  teamId?: string;
}
