/* eslint-disable no-param-reassign */
import { AppModule } from '@mod/app';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { RabbitDeserializer } from '@/filter/rabbit.deserializer';
import { Transport } from '@nestjs/microservices';
import { clusterize } from '@util/clustering';
import { initialize } from '@util/helper';
import process from 'node:process';

const { CLUSTERING, PORT } = process.env;

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.enableCors();

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: 'PRODUCTDIGITAL_STREAM_USER',
      queueOptions: {
        durable: true,
      },
      deserializer: new RabbitDeserializer(),
      clientProperties: {
        connection_name: `PRODUCT DIGITAL SERVICE FOR STREAM USER`,
      },
    },
  });

  app.startAllMicroservices();

  initialize(app);

  // SWAGGER HANDLER
  const config = new DocumentBuilder()
    .setTitle('PRODUCT DIGITAL API')
    .setDescription('PRODUCT DIGITAL API')
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/productdigital/api-documentation', app, document);
  // END SWAGGER HANDLER

  app.use((req: any, _: any, next: any) => {
    req.headers.timezone = 'Asia/Jakarta';
    next();
  });

  app.listen(PORT);
};
if (CLUSTERING === 'true') clusterize(bootstrap);
else bootstrap();
