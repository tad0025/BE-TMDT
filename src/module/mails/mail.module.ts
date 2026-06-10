import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { ENV_VARS } from 'src/constants/env.constants';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>(ENV_VARS.MAIL_HOST),
          port: config.get<number>(ENV_VARS.MAIL_PORT),
          secure: config.get<number>(ENV_VARS.MAIL_PORT) === 465,
          auth: {
            user: config.get<string>(ENV_VARS.MAIL_USER),
            pass: config.get<string>(ENV_VARS.MAIL_PASS),
          },
        },
        defaults: {
          from: config.get<string>(ENV_VARS.MAIL_FROM),
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailerModule, MailService],
})
export class MailModule {}
