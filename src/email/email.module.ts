import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EMAIL_SERVICE } from './email.service.interface';
import { SesEmailService } from './ses-email.service';
import { ResendEmailService } from './resend-email.service';
import { ConsoleEmailService } from './console-email.service';

@Module({
  imports: [ConfigModule],
  providers: [
    SesEmailService,
    ResendEmailService,
    ConsoleEmailService,
    {
      provide: EMAIL_SERVICE,
      inject: [ConfigService, SesEmailService, ResendEmailService, ConsoleEmailService],
      useFactory: (
        config: ConfigService,
        ses: SesEmailService,
        resend: ResendEmailService,
        dev: ConsoleEmailService,
      ) => {
        switch (config.get<string>('EMAIL_PROVIDER')) {
          case 'ses':
            return ses;
          case 'resend':
            return resend;
          default:
            // Local/dev default — avoids needing SES sandbox approval
            // just to run the app (TECH_SPEC §4).
            return dev;
        }
      },
    },
  ],
  exports: [EMAIL_SERVICE],
})
export class EmailModule {}
