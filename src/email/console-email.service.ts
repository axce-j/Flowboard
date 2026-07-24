import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service.interface';

@Injectable()
export class ConsoleEmailService implements EmailService {
  private readonly logger = new Logger('ConsoleEmailService');

  async sendInvite(to: string, orgName: string, link: string): Promise<void> {
    this.logger.log(`[invite] to=${to} org="${orgName}" link=${link}`);
  }

  async sendPasswordReset(to: string, link: string): Promise<void> {
    this.logger.log(`[password-reset] to=${to} link=${link}`);
  }
}
