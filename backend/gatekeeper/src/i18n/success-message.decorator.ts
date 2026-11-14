import { SetMetadata } from '@nestjs/common';
import type { MessageKey } from './messages';

export const SUCCESS_MESSAGE_KEY = 'successMessageKey';

/** Marks a controller method's response as carrying a translated success
 * message: SuccessMessageInterceptor wraps its return value into
 * `{ data, message }`, translating `key` per the request's Content-Language. */
export const SuccessMessage = (key: MessageKey) => SetMetadata(SUCCESS_MESSAGE_KEY, key);
