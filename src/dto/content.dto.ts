import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { ContentStatus, ContentType } from '../entities/content.entity';

const CONTENT_TYPES: ContentType[] = ['reel', 'carousel', 'other'];
const CONTENT_STATUSES: ContentStatus[] = ['idea', 'draft', 'ready', 'posted'];

export class CreateContentDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsEnum(CONTENT_TYPES)
  contentType: ContentType;

  @IsUUID()
  teamId: string;

  @IsOptional()
  @IsUUID()
  topicId?: string;

  // Defaults to the creator in the service layer if omitted — only an
  // Owner/Admin may set this to someone else (PRD 5.1).
  @IsOptional()
  @IsUUID()
  handledById?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  // See TECH_SPEC §8 open decision on week representation — currently a
  // date marking the week's start, same shape as scheduledDate.
  @IsOptional()
  @IsDateString()
  weekStartDate?: string;
}

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(CONTENT_TYPES)
  contentType?: ContentType;

  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsOptional()
  @IsUUID()
  handledById?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsDateString()
  weekStartDate?: string;

  // Status changes go through this same DTO but are handled specially in
  // the service — every change writes a ContentStatusHistory row inside the
  // same transaction as the update (PRD 5.3, TECH_SPEC §6 content.service.ts).
  @IsOptional()
  @IsEnum(CONTENT_STATUSES)
  status?: ContentStatus;
}

export class ContentQueryDto {
  @IsOptional()
  @IsEnum(CONTENT_STATUSES)
  status?: ContentStatus;

  @IsOptional()
  @IsEnum(CONTENT_TYPES)
  contentType?: ContentType;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsOptional()
  @IsUUID()
  handledBy?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'scheduledDate', 'title', 'status'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}

export class BulkStatusUpdateDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  ids: string[];

  @IsEnum(CONTENT_STATUSES)
  status: ContentStatus;
}

// Capped batch size per TECH_SPEC §5.1/§8 recommendation.
export const IMPORT_BATCH_MAX = 500;

export class ContentImportDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(IMPORT_BATCH_MAX)
  @ValidateNested({ each: true })
  @Type(() => CreateContentDto)
  items: CreateContentDto[];
}

// Shape of one row's outcome in the bulk import response (TECH_SPEC §5.1).
export interface ContentImportRowResult {
  index: number;
  status: 'created' | 'error';
  id?: string;
  errors?: string[];
}
