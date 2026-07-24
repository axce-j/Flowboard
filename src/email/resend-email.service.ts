import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service.interface';

// TODO(phase-1): swap in the `resend` npm package's client once
// EMAIL_PROVIDER=resend is actually exercised. Kept as a plain fetch call
// here to avoid an unused dependency until it's the active provider.
@Injectable()
export class ResendEmailService implements EmailService {
  private readonly logger = new Logger('ResendEmailService');
  private readonly apiKey: string;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('RESEND_API_KEY') ?? '';
    this.fromAddress = this.config.get<string>('RESEND_FROM_ADDRESS') ?? '';
  }

  async sendInvite(to: string, orgName: string, link: string): Promise<void> {
    await this.send(
      to,
      `You've been invited to join ${orgName} on Flowboard`,
      `You've been invited to join "${orgName}" on Flowboard.\n\nAccept your invite: ${link}`,
    );
  }

  async sendPasswordReset(to: string, link: string): Promise<void> {
    await this.send(
      to,
      'Reset your Flowboard password',
      `Reset your password: ${link}\n\nThis link expires shortly and can only be used once.`,
    );
  }

  private async send(to: string, subject: string, text: string): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.fromAddress, to, subject, text }),
    });

    if (!res.ok) {
      const detail = await res.text();
      this.logger.error(`Resend send failed for ${to}: ${detail}`);
      throw new Error(`Resend send failed: ${res.status}`);
    }
  }
}
