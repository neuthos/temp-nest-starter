// rabbitmq-publisher.service.ts

import * as amqp from 'amqplib';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RabbitmqPublisherService {
  private connection: amqp.Connection;

  private channel: amqp.Channel;

  async onModuleInit() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
  }

  async publishMessage(message: any, queueName: string) {
    await this.channel.assertQueue(queueName, { durable: true });
    this.channel.sendToQueue(
      queueName,
      Buffer.from(
        JSON.stringify({
          pattern: queueName,
          data: message,
        })
      ),
      {
        persistent: true,
      }
    );
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
    }
  }
}
