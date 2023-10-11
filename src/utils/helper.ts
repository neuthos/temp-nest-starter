import { ApiResponseOptions } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { NodeEnv } from '@share/enums';
import { NormalException } from '@/exception';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Returns the data wrapped by an object with data key.
 */
export const toSwaggerError = (
  exception: NormalException,
  options?: ApiResponseOptions
) => {
  return {
    content: { 'application/json': { example: exception.toJSON() } },
    ...options,
  };
};

/**
 * Encapsulate the init setup for bootstrap, E2E testing and swagger script resued
 */
export const initialize = (app: INestApplication) => {
  const { BASE_PATH, NODE_ENV } = process.env;

  app.useLogger(app.get(Logger));

  app.enableVersioning();

  // For Swagger UI
  if (NODE_ENV === NodeEnv.DEVELOPMENT) app.enableCors();

  // For convenience exclude to set base path when doing e2e test
  if (BASE_PATH && NODE_ENV !== NodeEnv.TEST) app.setGlobalPrefix(BASE_PATH);
};

export const generateRandomDigits = (digit: number) => {
  return Math.floor(Math.random() * 10000)
    .toString()
    .padStart(digit, '0');
};

export const generateUniqueReferenceNumber = (prefix: string) => {
  const timestamp = Date.now().toString();
  const randomSuffix = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `${prefix}${timestamp}-${randomSuffix}`;
};

export const isValueInEnum = <T>(
  value: T,
  enumObj: Record<string, T>
): boolean => {
  return Object.values(enumObj).includes(value);
};

export function formatToStringDateTimezone(
  timestamp: number | string | Date | any
): string {
  const formattedTime = dayjs(timestamp)
    .tz('UTC')
    .format('YYYY-MM-DD HH:mm:ss.SSSSSS Z');

  return formattedTime;
}
