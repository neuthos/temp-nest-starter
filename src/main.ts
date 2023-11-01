/* eslint-disable no-param-reassign */
import { AppModule } from '@mod/app';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { clusterize } from '@util/clustering';
import { initialize } from '@util/helper';
import process from 'node:process';

const { CLUSTERING, PORT } = process.env;

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.enableCors();

  app.startAllMicroservices();

  initialize(app);

  // SWAGGER HANDLER
  const config = new DocumentBuilder()
    .setTitle('INITIAL API')
    .setDescription('INITIAL API')
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/internaldashboard', app, document);
  // END SWAGGER HANDLER

  app.use((req: any, _: any, next: any) => {
    req.headers.timezone = 'Asia/Jakarta';
    next();
  });

  app.listen(PORT);
};
if (CLUSTERING === 'true') clusterize(bootstrap);
else bootstrap();
