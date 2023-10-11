import * as Joi from 'joi';
import { AppController } from './app.controller';
import { ConfigModuleOptions } from '@nestjs/config';
import { IncomingMessage, ServerResponse } from 'http';
import { LogLevel, NodeEnv } from '@share/enums';
import { Params } from 'nestjs-pino';
import { RequestMethod } from '@nestjs/common';

export class AppConfig {
  public static getInitConifg(): ConfigModuleOptions {
    const validLogLevelList = Object.keys(LogLevel).map((key) => LogLevel[key]);
    const validNodeEnvList = Object.keys(NodeEnv).map((key) => NodeEnv[key]);

    return {
      isGlobal: true,
      validationSchema: Joi.object(<
        { [P in keyof NodeJS.ProcessEnv]: Joi.SchemaInternals }
      >{
        BASE_PATH: Joi.string().allow('').optional(),
        CLUSTERING: Joi.boolean().required(),
        LOG_LEVEL: Joi.string()
          .allow('')
          .valid(...validLogLevelList)
          .optional(),
        NODE_ENV: Joi.string()
          .valid(...validNodeEnvList)
          .required(),
        PORT: Joi.number().min(1).max(65535).required(),

        DB_TYPE: Joi.string().required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_NAME: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        RABBITMQ_URL: Joi.string().required(),
      }),
    };
  }

  public static getLoggerConfig(): Params {
    const { BASE_PATH, CLUSTERING, LOG_LEVEL, NODE_ENV } = process.env;

    return {
      exclude: [
        {
          method: RequestMethod.ALL,
          path: `${BASE_PATH}/${AppController.prototype.healthz.name}`,
        },
      ],
      pinoHttp: {
        autoLogging: true,
        base: CLUSTERING === 'true' ? { pid: process.pid } : {},
        customAttributeKeys: {
          responseTime: 'timeSpent',
        },
        formatters: { level: (level) => ({ level }) },
        level:
          LOG_LEVEL ||
          (NODE_ENV === NodeEnv.PRODUCTION ? LogLevel.INFO : LogLevel.TRACE),
        serializers: {
          req(request: IncomingMessage) {
            return {
              method: request.method,
              url: request.url,
            };
          },
          res(reply: ServerResponse) {
            return {
              statusCode: reply.statusCode,
            };
          },
        },
        transport:
          NODE_ENV !== NodeEnv.PRODUCTION
            ? {
                target: 'pino-pretty',
                options: {
                  translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                },
              }
            : null,
      },
    };
  }
}
