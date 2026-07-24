import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('api/health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  async check() {
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok',
        db: 'connected',
        latency_ms: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        status: 'degraded',
        db: 'unreachable',
        error: err.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}