import { Injectable } from '@nestjs/common';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { join } from 'path';
import type { TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  public createTypeOrmOptions(): PostgresConnectionOptions {
    return {
      type: 'postgres',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,

      entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
      synchronize: false,
      dropSchema: false,
      migrationsRun: false,
      logging: true,
      migrations: [join(__dirname, '../migrations/**/*{.ts,.js}')],
      cli: {
        migrationsDir: join(__dirname, '../migrations'),
        entitiesDir: join(__dirname, '../**/*.entity{.ts,.js}'),
      },
    };
  }
}
