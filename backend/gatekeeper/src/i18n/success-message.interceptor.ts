import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { parseContentLanguage, translate } from './messages';
import { SUCCESS_MESSAGE_KEY } from './success-message.decorator';

/** Routes decorated with @SuccessMessage('some.key') get their return value
 * wrapped into `{ data, message }`, with `message` translated from the
 * catalogs per the request's Content-Language. Routes without the decorator
 * (every GET/list endpoint) are returned untouched. */
@Injectable()
export class SuccessMessageInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const key = this.reflector.get<string | undefined>(SUCCESS_MESSAGE_KEY, context.getHandler());
    if (!key) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const locale = parseContentLanguage(request.headers['content-language']);
    const message = translate(key, locale);

    return next.handle().pipe(map((data) => ({ data, message })));
  }
}
