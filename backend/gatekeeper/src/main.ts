import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module';
import { I18nHttpExceptionFilter } from './i18n/i18n-http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  // Render (and most PaaS hosts) sit behind a reverse proxy: without this,
  // every request looks like it comes from the proxy's own IP, and rate
  // limiting would throttle all users together instead of individually.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new I18nHttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
