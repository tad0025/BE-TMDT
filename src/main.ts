import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './core/common/filters/http-exception.filter';
import { LoggingInterceptor } from './core/common/interceptors/logging.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { exec } from 'child_process';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  app.set('trust proxy', 'loopback');

  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:5173'];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const ngrokCmd = process.env.CMD_NGROK;
  if (ngrokCmd) {
    const killCmd = process.platform === 'win32' ? 'taskkill /f /im ngrok.exe' : 'killall ngrok';
    exec(killCmd, () => {
      console.log(`[Ngrok] Starting ngrok: ${ngrokCmd}`);
      const ngrokProcess = exec(ngrokCmd);

      ngrokProcess.stdout?.on('data', (data) => {
        console.log(`[Ngrok] ${data.toString().trim()}`);
      });

      ngrokProcess.stderr?.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg) console.error(`[Ngrok Error] ${msg}`);
      });
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
