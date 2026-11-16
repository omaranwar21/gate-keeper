import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { STATUS_CODES } from 'http';
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

    // Some exceptions (e.g. @nestjs/throttler's ThrottlerException) build
    // their response as a bare string instead of the usual
    // { statusCode, message, error } object — normalize it to that shape
    // too, so every exception translates and every client-side error
    // parser (which expects `body.message`) sees the same envelope.
    if (typeof body === 'string') {
      response.status(status).json({
        statusCode: status,
        message: translate(body, locale),
        error: STATUS_CODES[status] ?? 'Error',
      });
      return;
    }

    response.status(status).json(body);
  }
}
