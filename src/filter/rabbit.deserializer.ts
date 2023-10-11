import { Deserializer } from '@nestjs/microservices';

export class RabbitDeserializer implements Deserializer {
  deserialize(value: any): any {
    if (value.pattern) {
      return value;
    }

    console.log({ value }, 'FROM RABBITMQ DESERIALIZER');

    const data = { pattern: 'DEFAULT', data: value };

    if (value.table === 'companies') {
      data.pattern = 'STREAM-COMPANY';
    } else if (value.table === 'users') {
      data.pattern = 'STREAM-USER';
    }
    return data;
  }
}
