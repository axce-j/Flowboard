import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { EmailService } from './email.service.interface';

@Injectable()
export class SesEmailService implements EmailService {
  private readonly logger = new Logger('SesEmailService');
  private readonly fromAddress: string;
  private _client: SESClient | undefined;

  constructor(private readonly config: ConfigService) {
    // Deliberately NOT constructing the SESClient here. EmailModule
    // registers all three provider classes as plain providers so the
    // factory can choose between them — Nest instantiates every one of
    // them regardless of EMAIL_PROVIDER, so an eager `new SESClient(...)`
    // would throw on missing AWS_REGION even when SES isn't the active
    // provider. Built lazily on first actual send instead.
    this.fromAddress = this.config.get<string>('SES_FROM_ADDRESS') ?? '';
  }

  private get client(): SESClient {
    if (!this._client) {
      const region = this.config.get<string>('AWS_REGION');
      if (!region) {
        throw new Error(
          'AWS_REGION is required to send email via SES — set it in your env or switch EMAIL_PROVIDER.',
        );
      }
      this._client = new SESClient({ region });
    }
    return this._client;
  }

  async sendInvite(to: string, orgName: string, link: string): Promise<void> {
    // TODO(phase-1): real HTML template. Plain-text body is a functional
    // placeholder so the invite flow is testable end-to-end immediately.
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

  private async send(to: string, subject: string, body: string): Promise<void> {
    const command = new SendEmailCommand({
      Source: this.fromAddress,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: { Text: { Data: body } },
      },
    });

    try {
      await this.client.send(command);
    } catch (err) {
      // SES sandbox mode rejects unverified recipients — surface clearly
      // rather than swallowing the error (see TECH_SPEC §4).
      this.logger.error(`SES send failed for ${to}: ${(err as Error).message}`);
      throw err;
    }
  }
}
