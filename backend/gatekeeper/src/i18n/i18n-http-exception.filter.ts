import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { parseContentLanguage, translate, type SupportedLocale } from './messages';

function translateMessage(message: unknown, locale: SupportedLocale): unknown {
  if (typeof message === 'string') return translate(message, locale);
  if (Array.isArray(message)) {
    return message.map((entry) => (typeof entry === 'string' ? translate(entry, locale) : entry));
  }
  return message;
}

/** Translates the `message` field of every thrown HttpException's response
 * body according to the request's `Content-Language` header, using the
 * lookup catalogs in ./locales. Service code throws with a catalog key
 * (e.g. `throw new NotFoundException('guestPasses.notFound')`) instead of a
 * hardcoded English string; a message that isn't a known key (such as a
 * class-validator default) passes through untranslated. */
@Catch(HttpException)
export class I18nHttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const locale = parseContentLanguage(request.headers['content-language']);

    const status = exception.getStatus();
    const body = exception.getResponse();

    if (typeof body === 'object' && body !== null && 'message' in body) {
      response.status(status).json({
        ...body,
        message: translateMessage((body as { message: unknown }).message, locale),
      });
      return;
    }

    response.status(status).json(body);
  }
}
